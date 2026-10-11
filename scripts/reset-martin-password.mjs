#!/usr/bin/env node
/**
 * One-shot: set a new password for the founder login `martin` (or MARTIN_USERNAME).
 *
 * Usage:
 *   DATABASE_URL=... NEW_PASSWORD='your-temp-password' node scripts/reset-martin-password.mjs
 *
 * Dry run (no write):
 *   ... node scripts/reset-martin-password.mjs --dry-run
 *
 * Do not commit NEW_PASSWORD. Change the password from Me after you log in.
 */
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";

const scrypt = promisify(scryptCb);
const STUDIO_ID = "indie-dream";
const dryRun = process.argv.includes("--dry-run");
const username = (process.env.MARTIN_USERNAME || "martin").trim().toLowerCase();
const plain = process.env.NEW_PASSWORD?.trim() || "";

async function hashPassword(value) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scrypt(value, salt, 32);
  return `s2:${salt}:${buf.toString("hex")}`;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("[reset-martin] DATABASE_URL is required.");
    process.exit(1);
  }
  if (plain.length < 8) {
    console.error("[reset-martin] NEW_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
  const client = await pool.connect();
  try {
    const rows = await client.query(`select accounts from cue_studio where id = $1`, [STUDIO_ID]);
    if (!rows.rows[0]) {
      console.error("[reset-martin] no cue_studio row.");
      process.exit(1);
    }
    const accounts = JSON.parse(JSON.stringify(rows.rows[0].accounts ?? []));
    const idx = accounts.findIndex(
      (a) => a && String(a.username ?? "").toLowerCase() === username,
    );
    if (idx < 0) {
      console.error(`[reset-martin] no account with username "${username}".`);
      process.exit(1);
    }

    const hashed = await hashPassword(plain);
    if (dryRun) {
      console.log(`[reset-martin] dry run — would reset password for @${accounts[idx].username} (${accounts[idx].id}).`);
      return;
    }

    accounts[idx] = { ...accounts[idx], password: hashed };
    await client.query(
      `update cue_studio set accounts = $2::jsonb, updated_at = now() where id = $1`,
      [STUDIO_ID, JSON.stringify(accounts)],
    );
    console.log(`[reset-martin] password updated for @${accounts[idx].username}. Log in, then change it from Me.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[reset-martin] failed:", err);
  process.exit(1);
});
