/** Standalone R2 helpers for scripts/migrate-images-to-r2.mjs (no TS path aliases). */

function env(key) {
  const v = process.env[key]?.trim();
  return v || undefined;
}

export function r2Configured() {
  return Boolean(env("R2_ACCOUNT_ID") && env("R2_ACCESS_KEY_ID") && env("R2_SECRET_ACCESS_KEY") && env("R2_BUCKET_NAME"));
}

function must(key) {
  const value = env(key);
  if (!value) throw new Error(`${key} is not set`);
  return value;
}

function accountId() {
  return must("R2_ACCOUNT_ID")
    .replace(/^https?:\/\//, "")
    .replace(/\.r2\.cloudflarestorage\.com.*$/i, "")
    .replace(/\/$/, "")
    .trim();
}

function encodeRfc3986(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

async function hmac(key, value) {
  const raw = typeof key === "string" ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(value));
}

async function hmacHex(key, value) {
  const buf = await hmac(key, value);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sha256Hex(text) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then((buf) =>
    [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""),
  );
}

function amzDate(now = new Date()) {
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amz: `${iso.slice(0, 15)}Z`, day: iso.slice(0, 8) };
}

export function safePhotoKey(accountId) {
  const id = String(accountId).replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 40) || "user";
  return `photos/${id}/${Date.now()}.jpg`;
}

export function safeCoverKey(artistId, songId) {
  const artist = String(artistId).replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 40) || "artist";
  const song = String(songId).replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 40) || "song";
  return `covers/${artist}/${song}.jpg`;
}

function parseDataUrl(dataUrl) {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) throw new Error("Invalid image data URL");
  const contentType = match[1].toLowerCase() === "image/png" ? "image/png" : "image/jpeg";
  const buf = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
  return { buf, contentType };
}

async function signingKey(secret, day) {
  const dateKey = await hmac(`AWS4${secret}`, day);
  const regionKey = await hmac(dateKey, "auto");
  const serviceKey = await hmac(regionKey, "s3");
  return hmac(serviceKey, "aws4_request");
}

async function putObject(key, body, contentType) {
  const account = accountId();
  const access = must("R2_ACCESS_KEY_ID");
  const secret = must("R2_SECRET_ACCESS_KEY");
  const bucket = must("R2_BUCKET_NAME");
  const host = `${account}.r2.cloudflarestorage.com`;
  const { amz, day } = amzDate();
  const type = contentType || "image/jpeg";
  const payloadHash = "UNSIGNED-PAYLOAD";
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonical = [
    "PUT",
    `/${bucket}/${key.split("/").map(encodeRfc3986).join("/")}`,
    "",
    `content-type:${type}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amz}`,
    "",
    signedHeaders,
    payloadHash,
  ].join("\n");
  const digest = await sha256Hex(canonical);
  const scope = `${day}/auto/s3/aws4_request`;
  const signature = await hmacHex(await signingKey(secret, day), `AWS4-HMAC-SHA256\n${amz}\n${scope}\n${digest}`);
  const auth = `AWS4-HMAC-SHA256 Credential=${access}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const res = await fetch(`https://${host}/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`, {
    method: "PUT",
    headers: {
      Authorization: auth,
      "Content-Type": type,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amz,
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 PUT ${res.status}${text ? `: ${text.slice(0, 180)}` : ""}`);
  }
  return key;
}

export async function migrateDataUrlToR2(dataUrl, key) {
  if (!r2Configured()) return dataUrl;
  const { buf, contentType } = parseDataUrl(dataUrl);
  await putObject(key, buf, contentType);
  return `r2:${key}`;
}
