import {
  assertSameSiteRequest,
  CrossSiteRequestError,
} from "@/lib/auth/isolation.server";

export { CrossSiteRequestError };

/** Block sibling/cross-site scripted requests against cue-session endpoints. */
export function assertCueSessionSafeRequest(): void {
  assertSameSiteRequest();
}
