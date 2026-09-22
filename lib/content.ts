export const posterKinds = [
  "phone",
  "getup",
  "wish",
  "chicken",
  "taste",
  "cash",
] as const;

export type PosterKind = (typeof posterKinds)[number];
export type PosterSize = "short" | "tall";

export type ContentPosterItem = {
  kind: PosterKind;
  image: string;
  size: PosterSize;
  topic: string;
};

export const contentPosters: readonly ContentPosterItem[] = [
  {
    kind: "phone",
    image: "/images/home/phone.png",
    size: "short",
    topic: "Technology",
  },
  {
    kind: "getup",
    image: "/images/home/getup-b.png",
    size: "tall",
    topic: "Accessibility",
  },
  {
    kind: "wish",
    image: "/images/home/wish.png",
    size: "short",
    topic: "Reflection & Prediction",
  },
  {
    kind: "chicken",
    image: "/images/home/chicken.png",
    size: "tall",
    topic: "Adaption",
  },
  {
    kind: "taste",
    image: "/images/home/taste.png",
    size: "tall",
    topic: "Nutrition & Health",
  },
  {
    kind: "cash",
    image: "/images/home/cash.png",
    size: "short",
    topic: "Finance",
  },
];
