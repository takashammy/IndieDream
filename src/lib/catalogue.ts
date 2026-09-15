/**
 * Catalogue fixture.
 *
 * Seed artists, events, and board posts live in `@/lib/data` only as a first-run
 * fallback. After hydrate, the live catalogue is the `cue_studio` SQLite snapshot
 * written by `saveStudio` / `writeStudioSlice`. Admin Desk is the editor.
 * Wipe localStorage (`indie-dream-v4`) and the studio row before launch.
 */
export { ARTISTS, EVENTS, POSTS, APP_NAME } from "@/lib/data";
export { writeStudioSlice, readStudioSlice } from "@/lib/cue-write";
