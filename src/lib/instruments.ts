export type ShopInstrument = {
  id: string;
  name: string;
  kind: "Concert ukulele" | "Soprano ukulele" | "Tenor ukulele" | "Baritone ukulele" | "Electric acoustic ukulele" | "Other";
  series?: string;
  colours?: string[];
  price: string;
  woods: string;
  blurb: string;
  photo: string;
};

export const INNER_SOUL_INSTRUMENTS: ShopInstrument[] = [
  {
    id: "ghost-uke",
    name: "Ukulele (Electric Acoustic)",
    kind: "Electric acoustic ukulele",
    series: "Ghost series",
    colours: ["Pink Ghost", "White Ghost", "Blue Ghost"],
    price: "$420",
    woods: "Translucent acrylic",
    blurb: "Electric-acoustic ukulele from the Ghost series. Translucent body in Pink Ghost, White Ghost, or Blue Ghost — pick a colour when you enquire.",
    photo: "/media/shop/ghost-ukulele.jpg",
  },
  {
    id: "ukumeowmeow-uke",
    name: "Ukulele (Electric Acoustic)",
    kind: "Electric acoustic ukulele",
    series: "Ukumeowmeow series",
    colours: ["Midnight Glitter", "Moondust Marble"],
    price: "$550",
    woods: "Cat-ear body",
    blurb: "Electric-acoustic ukulele from the Ukumeowmeow series. Cat-ear body in Midnight Glitter or Moondust Marble — pick a colour when you enquire.",
    photo: "/media/shop/ukumeowmeow.jpg",
  },
];
