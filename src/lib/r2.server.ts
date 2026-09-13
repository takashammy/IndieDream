import { env } from "@/lib/env.server";

export function r2Configured() {
  return Boolean(env("R2_ACCOUNT_ID") && env("R2_ACCESS_KEY_ID") && env("R2_SECRET_ACCESS_KEY") && env("R2_BUCKET_NAME"));
}

function must(key: string) {
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

function sha256Hex(text: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then((buf) =>
    [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""),
  );
}

function amzDate(now = new Date()) {
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amz: `${iso.slice(0, 15)}Z`, day: iso.slice(0, 8) };
}

export function safeTrackKey(artistId: string, filename: string) {
  const base = filename.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "track";
  const id = artistId.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 40) || "artist";
  return `tracks/${id}/${Date.now()}-${base}`;
}

export function assertTrackKey(key: string) {
  if (!key.startsWith("tracks/") || key.includes("..") || key.includes("//")) throw new Error("Invalid object key");
  return key;
}

async function signingKey(secret: string, day: string) {
  const dateKey = await hmac(`AWS4${secret}`, day);
  const regionKey = await hmac(dateKey, "auto");
  const serviceKey = await hmac(regionKey, "s3");
  return hmac(serviceKey, "aws4_request");
}

export async function presign(method: "PUT" | "GET", key: string, contentType?: string, expires = 3600) {
  const account = accountId();
  const access = must("R2_ACCESS_KEY_ID");
  const secret = must("R2_SECRET_ACCESS_KEY");
  const bucket = must("R2_BUCKET_NAME");
  const host = `${account}.r2.cloudflarestorage.com`;
  const { amz, day } = amzDate();
  const credential = `${access}/${day}/auto/s3/aws4_request`;
  const query: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Content-Sha256": "UNSIGNED-PAYLOAD",
    "X-Amz-Credential": credential,
    "X-Amz-Date": amz,
    "X-Amz-Expires": String(expires),
    "X-Amz-SignedHeaders": "host",
  };
  const canonicalQs = Object.keys(query)
    .sort()
    .map((k) => `${encodeRfc3986(k)}=${encodeRfc3986(query[k])}`)
    .join("&");
  const canonical = [method, `/${bucket}/${key.split("/").map(encodeRfc3986).join("/")}`, canonicalQs, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const digest = await sha256Hex(canonical);
  const scope = `${day}/auto/s3/aws4_request`;
  const signature = await hmacHex(await signingKey(secret, day), `AWS4-HMAC-SHA256\n${amz}\n${scope}\n${digest}`);
  const url = `https://${host}/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}?${canonicalQs}&X-Amz-Signature=${signature}`;
  return { url, key, contentType: contentType || "audio/mpeg" };
}

export async function putObject(key: string, body: Uint8Array, contentType: string) {
  const account = accountId();
  const access = must("R2_ACCESS_KEY_ID");
  const secret = must("R2_SECRET_ACCESS_KEY");
  const bucket = must("R2_BUCKET_NAME");
  const host = `${account}.r2.cloudflarestorage.com`;
  const { amz, day } = amzDate();
  const type = contentType || "audio/mpeg";
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
    body: body as unknown as BodyInit,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 PUT ${res.status}${text ? `: ${text.slice(0, 180)}` : ""}`);
  }
  return key;
}
