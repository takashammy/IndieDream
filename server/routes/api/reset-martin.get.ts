import { defineEventHandler, getRequestURL } from "h3";
import { handleResetMartin } from "../../../src/lib/reset-martin.server";

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  const request = new Request(url, { method: "GET" });
  return handleResetMartin(request);
});
