import { defineEventHandler, getHeader, getRequestURL } from "h3";
import { handleResetMartin } from "../../../src/lib/reset-martin.server";

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  const headers = new Headers();
  const secretHeader = getHeader(event, "x-martin-reset-secret");
  if (secretHeader) headers.set("x-martin-reset-secret", secretHeader);
  const auth = getHeader(event, "authorization");
  if (auth) headers.set("authorization", auth);
  const forwarded = getHeader(event, "x-forwarded-for");
  if (forwarded) headers.set("x-forwarded-for", forwarded);
  const realIp = getHeader(event, "x-real-ip");
  if (realIp) headers.set("x-real-ip", realIp);
  const request = new Request(url, { method: "GET", headers });
  return handleResetMartin(request);
});
