import { defineEventHandler, getHeader, getRequestURL, readRawBody } from "h3";
import { handleResetMartin } from "../../../src/lib/reset-martin.server";

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  const raw = (await readRawBody(event, false)) ?? new Uint8Array();
  const contentType = getHeader(event, "content-type") || "application/json";
  const headers = new Headers({ "content-type": contentType });
  const secretHeader = getHeader(event, "x-martin-reset-secret");
  if (secretHeader) headers.set("x-martin-reset-secret", secretHeader);
  const auth = getHeader(event, "authorization");
  if (auth) headers.set("authorization", auth);
  const forwarded = getHeader(event, "x-forwarded-for");
  if (forwarded) headers.set("x-forwarded-for", forwarded);
  const realIp = getHeader(event, "x-real-ip");
  if (realIp) headers.set("x-real-ip", realIp);
  const request = new Request(url, {
    method: "POST",
    headers,
    body: raw.byteLength ? (raw as unknown as BodyInit) : undefined,
  });
  return handleResetMartin(request);
});
