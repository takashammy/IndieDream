export type ShopInstrument = {
  id: string;
  name: string;
  kind: "Concert ukulele" | "Soprano ukulele" | "Tenor ukulele" | "Baritone ukulele" | "Other";
  price: string;
  woods: string;
  blurb: string;
  photo: string;
};

export const INNER_SOUL_INSTRUMENTS: ShopInstrument[] = [
  {
    id: "uke-harbour",
    name: "Harbour Concert",
    kind: "Concert ukulele",
    price: "$1,280",
    woods: "Solid mahogany top, mahogany back and sides",
    blurb: "The house concert uke. Warm midrange, sits under a vocal without fighting it.",
    photo: "/media/covers/guitar.jpg",
  },
  {
    id: "uke-lantern",
    name: "Lantern Soprano",
    kind: "Soprano ukulele",
    price: "$880",
    woods: "Laminate mahogany, rosewood fingerboard",
    blurb: "Small room, high voice. Built for lessons and first songs.",
    photo: "/media/covers/silk.jpg",
  },
  {
    id: "uke-typhoon",
    name: "Typhoon Tenor",
    kind: "Tenor ukulele",
    price: "$1,680",
    woods: "Solid cedar top, rosewood back",
    blurb: "Longer scale, more low end. The one we send out on paid sessions.",
    photo: "/media/covers/vinyl.jpg",
  },
  {
    id: "uke-midlevels",
    name: "Mid-Levels Baritone",
    kind: "Baritone ukulele",
    price: "$1,980",
    woods: "Solid spruce top, mahogany body",
    blurb: "DGBE tuning. For guitarists who want the uke without relearning the neck.",
    photo: "/media/covers/cello.jpg",
  },
  {
    id: "uke-nightbus",
    name: "Night Bus Concert",
    kind: "Concert ukulele",
    price: "$1,080",
    woods: "Spalted maple top, sapele back",
    blurb: "Brighter attack. Cuts a rehearsal room without a pickup.",
    photo: "/media/covers/rain.jpg",
  },
  {
    id: "uke-studio",
    name: "Studio Tenor Pickup",
    kind: "Tenor ukulele",
    price: "$2,280",
    woods: "Solid koa top, mahogany back, under-saddle pickup",
    blurb: "Plug-in tenor for live and tracking. The shop flagship.",
    photo: "/media/covers/synth.jpg",
  },
  {
    id: "uke-lesson",
    name: "Lesson Pack Soprano",
    kind: "Soprano ukulele",
    price: "$620",
    woods: "Laminate sapele, geared tuners",
    blurb: "The student instrument. Bag and tuner included. Built to be borrowed.",
    photo: "/media/covers/drums.jpg",
  },
];
