import { defineEventHandler, getHeader, getRequestURL, readRawBody } from "h3";
import { handleImageUpload } from "../../../src/lib/image-upload.server";

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  const raw = (await readRawBody(event, false)) ?? new Uint8Array();
  const contentType = getHeader(event, "content-type") || "image/jpeg";
  const request = new Request(url, {
    method: "POST",
    headers: { "content-type": contentType },
    body: raw as unknown as BodyInit,
  });
  return handleImageUpload(request);
});
