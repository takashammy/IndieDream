export type ShopInstrument = {
  id: string;
  name: string;
  kind: "Concert ukulele" | "Soprano ukulele" | "Tenor ukulele" | "Baritone ukulele" | "Other";
  price: string;
  woods: string;
  blurb: string;
  photo: string;
};

export const INNER_SOUL_INSTRUMENTS: ShopInstrument[] = [];
