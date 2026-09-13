import { env } from "@/lib/env.server";

export function r2Configured() {
  return Boolean(env("R2_ACCOUNT_ID") && env("R2_ACCESS_KEY_ID") && env("R2_SECRET_ACCESS_KEY") && env("R2_BUCKET_NAME"));
}

function must(key: string) {
  const value = env(key);
  if (!value) throw new Error(`${key} is not set`);
  return value;
}

function encodeRfc3986(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

async function hmac(key: BufferSource | string, value: string) {
  const raw = typeof key === "string" ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(value));
}

async function hmacHex(key: BufferSource, value: string) {
  const buf = await hmac(key, value);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function amzDate(now = new Date()) {
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amz: iso.slice(0, 16) + "Z", day: iso.slice(0, 8) };
}

export function safeTrackKey(artistId: string, filename: string) {
  const base = filename.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "track";
  const id = artistId.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 40) || "artist";
  return `tracks/${id}/${Date.now()}-${base}`;
}

export function assertTrackKey(key: string) {
  if (!key.startsWith("tracks/") || key.includes("..") || key.includes("//")) {
    throw new Error("Invalid object key");
  }
  return key;
}

export async function presign(method: "PUT" | "GET", key: string, contentType?: string, expires = 3600) {
  const account = must("R2_ACCOUNT_ID");
  const access = must("R2_ACCESS_KEY_ID");
  const secret = must("R2_SECRET_ACCESS_KEY");
  const bucket = must("R2_BUCKET_NAME");
  const host = `${account}.r2.cloudflarestorage.com`;
  const { amz, day } = amzDate();
  const credential = `${access}/${day}/auto/s3/aws4_request`;
  const signedHeaders = "host";
  const query: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": amz,
    "X-Amz-Expires": String(expires),
    "X-Amz-SignedHeaders": signedHeaders,
  };
  const canonicalQs = Object.keys(query)
    .sort()
    .map((k) => `${encodeRfc3986(k)}=${encodeRfc3986(query[k])}`)
    .join("&");
  const canonical = [
    method,
    `/${bucket}/${key.split("/").map(encodeRfc3986).join("/")}`,
    canonicalQs,
    `host:${host}\n`,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical)))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const scope = `${day}/auto/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amz}\n${scope}\n${digest}`;
  const dateKey = await hmac(`AWS4${secret}`, day);
  const regionKey = await hmac(dateKey, "auto");
  const serviceKey = await hmac(regionKey, "s3");
  const signingKey = await hmac(serviceKey, "aws4_request");
  const signature = await hmacHex(signingKey, stringToSign);
  const url = `https://${host}/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}?${canonicalQs}&X-Amz-Signature=${signature}`;
  return { url, key, contentType: contentType || "audio/mpeg" };
}
