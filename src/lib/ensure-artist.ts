import { type Artist } from "@/lib/data";
import { currentAccount, useCue } from "@/lib/store";

export function ensureOwnArtist(): Artist | null {
  const state = useCue.getState();
  const acc = currentAccount(state);
  if (!acc) return null;
  if (acc.kind !== "artist" && acc.kind !== "admin") return null;

  const artistId =
    acc.artistId ||
    `art-${String(acc.username || acc.id)
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "user"}`;
  const existing = state.artists.find((artist) => artist.id === artistId);
  if (existing) {
    if (acc.artistId === artistId) return existing;
    useCue.setState({
      accounts: state.accounts.map((row) => (row.id === acc.id ? { ...row, artistId } : row)),
    });
    return existing;
  }

  const artist: Artist = {
    id: artistId,
    name: acc.name || acc.username,
    role: acc.role || "Artist",
    city: acc.location,
    area: acc.location,
    photo: acc.photo || "/media/user.jpg",
    genres: ["Indie"],
    bio: acc.bio || "",
    songs: [],
    label: "",
    labelApproved: false,
    verified: acc.kind === "admin",
  };

  useCue.setState({
    artists: [...state.artists, artist],
    accounts: state.accounts.map((row) => (row.id === acc.id ? { ...row, artistId } : row)),
  });
  return artist;
}
