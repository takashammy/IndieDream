export type LocationArea = "HK Island" | "Kowloon" | "New Territories";

export type AccountKind = "admin" | "artist" | "explorer" | "business";

export type SongStatus = "approved" | "pending" | "declined";

export type Song = {
  id: string;
  title: string;
  duration: string;
  plays: string;
  cover: string;
  uploadedAt: string;
  status: SongStatus;
  spotify?: string;
  youtube?: string;
  audioUrl?: string;
};
