#!/usr/bin/env node
/**
 * One-off migration: inline data:image/ profile photos and cover art in cue_studio
 * JSON → Cloudflare R2 object keys (stored as r2:photos/... and r2:covers/...).
 *
 * Usage:
 *   DATABASE_URL=... R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... \
 *   R2_SECRET_ACCESS_KEY=... R2_BUCKET_NAME=... \
 *   node scripts/migrate-images-to-r2.mjs
 *
 * Dry run (no writes):
 *   ... node scripts/migrate-images-to-r2.mjs --dry-run
 */
import pg from "pg";
import {
  migrateDataUrlToR2,
  r2Configured,
  safeCoverKey,
  safePhotoKey,
} from "./r2-migrate-lib.mjs";

const STUDIO_ID = "indie-dream";
const dryRun = process.argv.includes("--dry-run");

function isDataUrl(value) {
  return typeof value === "string" && value.trim().startsWith("data:image/");
}

function stripLegacyCover(value) {
  if (typeof value !== "string") return value;
  return value.split("#r2=")[0];
}

async function migratePhoto(value, accountId) {
  if (!isDataUrl(value)) return value;
  const key = safePhotoKey(String(accountId));
  if (dryRun) {
    console.log(`[dry-run] photo ${accountId} -> r2:${key}`);
    return `r2:${key}`;
  }
  return migrateDataUrlToR2(value, key);
}

async function migrateCover(value, artistId, songId) {
  if (!isDataUrl(stripLegacyCover(value))) return value;
  const dataUrl = stripLegacyCover(value);
  const key = safeCoverKey(String(artistId), String(songId));
  if (dryRun) {
    console.log(`[dry-run] cover ${artistId}/${songId} -> r2:${key}`);
    const legacy = typeof value === "string" && value.includes("#r2=") ? value.split("#r2=")[1] : null;
    return legacy ? `r2:${key}#r2=${legacy}` : `r2:${key}`;
  }
  const migrated = await migrateDataUrlToR2(dataUrl, key);
  const legacy = typeof value === "string" && value.includes("#r2=") ? value.split("#r2=")[1] : null;
  return legacy ? `${migrated}#r2=${legacy}` : migrated;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("[migrate-images] DATABASE_URL is required.");
    process.exit(1);
  }
  if (!r2Configured()) {
    console.error("[migrate-images] R2 env vars are required.");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
  const client = await pool.connect();
  let photoCount = 0;
  let coverCount = 0;

  try {
    const rows = await client.query(`select accounts, artists from cue_studio where id = $1`, [STUDIO_ID]);
    if (!rows.rows[0]) {
      console.log("[migrate-images] no cue_studio row — nothing to do.");
      return;
    }

    const accounts = JSON.parse(JSON.stringify(rows.rows[0].accounts ?? []));
    const artists = JSON.parse(JSON.stringify(rows.rows[0].artists ?? []));

    for (const acc of accounts) {
      if (!acc || typeof acc !== "object") continue;
      if (isDataUrl(acc.photo)) {
        acc.photo = await migratePhoto(acc.photo, acc.id || acc.username || "user");
        photoCount += 1;
      }
    }

    for (const artist of artists) {
      if (!artist || typeof artist !== "object") continue;
      if (isDataUrl(artist.photo)) {
        artist.photo = await migratePhoto(artist.photo, artist.id || "artist");
        photoCount += 1;
      }
      const songs = Array.isArray(artist.songs) ? artist.songs : [];
      for (const song of songs) {
        if (!song || typeof song !== "object") continue;
        const raw = song.cover;
        if (isDataUrl(stripLegacyCover(raw))) {
          song.cover = await migrateCover(raw, artist.id, song.id);
          coverCount += 1;
        }
      }
    }

    if (photoCount === 0 && coverCount === 0) {
      console.log("[migrate-images] no inline images found.");
      return;
    }

    if (dryRun) {
      console.log(`[migrate-images] dry run — would migrate ${photoCount} photo(s), ${coverCount} cover(s).`);
      return;
    }

    await client.query(
      `update cue_studio set accounts = $2::jsonb, artists = $3::jsonb, updated_at = now() where id = $1`,
      [STUDIO_ID, JSON.stringify(accounts), JSON.stringify(artists)],
    );
    console.log(`[migrate-images] migrated ${photoCount} photo(s) and ${coverCount} cover(s).`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[migrate-images] failed:", err);
  process.exit(1);
});
