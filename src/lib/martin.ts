export function isMartinAccount(acc: { username?: string; name?: string } | null | undefined) {
  if (!acc) return false;
  const u = String(acc.username ?? "").trim().toLowerCase();
  const n = String(acc.name ?? "").trim().toLowerCase();
  return u === "martin" || n === "martin sham";
}
