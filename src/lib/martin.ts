function martinIdsFromEnv(): Set<string> | null {
  const raw =
    typeof process !== "undefined" ? process.env.MARTIN_ACCOUNT_IDS?.trim() : undefined;
  if (!raw) return null;
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
}

export function isMartinAccount(
  acc: { id?: string; username?: string; name?: string } | null | undefined,
) {
  if (!acc) return false;
  const ids = martinIdsFromEnv();
  if (ids) return acc.id ? ids.has(acc.id) : false;
  const u = String(acc.username ?? "").trim().toLowerCase();
  const n = String(acc.name ?? "").trim().toLowerCase();
  return u === "martin" || n === "martin sham";
}
