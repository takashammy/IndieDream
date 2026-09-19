import { defineEventHandler, getRequestURL } from "h3";
import { handleR2ImageGet } from "../../../src/lib/image-upload.server";

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  const request = new Request(url, { method: "GET" });
  return handleR2ImageGet(request);
});
