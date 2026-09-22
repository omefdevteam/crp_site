export const pinGroupIds = ["beacons", "missions", "ambassadors"] as const;

export type PinGroup = (typeof pinGroupIds)[number];

type PinBase = {
  id: string;
  group: PinGroup;
  city: string;
  lat: number;
  lng: number;
};

export type Pin =
  | (PinBase & { kind: "icon" })
  | (PinBase & { kind: "photo"; image: string });

export type PinGroupMeta = {
  label: string;
  accent: string;
  icon: string;
  blurb: readonly [string, string];
};

export const pinGroups = {
  beacons: {
    label: "Beacons",
    accent: "#3dadff",
    icon: "/icons/pin-beacon.svg",
    blurb: [
      "Connecting communities as beacons, illuminating",
      "pathways for collaboration",
    ],
  },
  missions: {
    label: "Missions",
    accent: "#fa8d2e",
    icon: "/icons/pin-mission.svg",
    blurb: [
      "Missions are activities that beacons report",
      "that require action",
    ],
  },
  ambassadors: {
    label: "Ambassadors",
    accent: "#ec268f",
    icon: "/icons/pin-ambassador.svg",
    blurb: [
      "Participants who complete our programs",
      "become our ambassadors.",
    ],
  },
} as const satisfies Record<PinGroup, PinGroupMeta>;

export const pins = [
  { id: "beacon-dublin", kind: "icon", group: "beacons", city: "Dublin", lat: 53.35, lng: -6.26 },
  {
    id: "beacon-antalya",
    kind: "photo",
    group: "beacons",
    city: "Antalya",
    lat: 36.9,
    lng: 30.7,
    image: "/images/pavilion-expo.jpg",
  },
  { id: "beacon-nairobi", kind: "icon", group: "beacons", city: "Nairobi", lat: -1.29, lng: 36.82 },
  { id: "beacon-sao-paulo", kind: "icon", group: "beacons", city: "São Paulo", lat: -23.55, lng: -46.63 },
  { id: "beacon-manila", kind: "icon", group: "beacons", city: "Manila", lat: 14.6, lng: 120.98 },
  { id: "mission-lagos", kind: "icon", group: "missions", city: "Lagos", lat: 6.52, lng: 3.38 },
  { id: "mission-dhaka", kind: "icon", group: "missions", city: "Dhaka", lat: 23.81, lng: 90.41 },
  { id: "mission-mexico", kind: "icon", group: "missions", city: "Mexico City", lat: 19.43, lng: -99.13 },
  { id: "mission-jakarta", kind: "icon", group: "missions", city: "Jakarta", lat: -6.21, lng: 106.85 },
  { id: "mission-cairo", kind: "icon", group: "missions", city: "Cairo", lat: 30.04, lng: 31.24 },
  { id: "ambassador-london", kind: "icon", group: "ambassadors", city: "London", lat: 51.51, lng: -0.13 },
  { id: "ambassador-new-york", kind: "icon", group: "ambassadors", city: "New York", lat: 40.71, lng: -74.01 },
  { id: "ambassador-berlin", kind: "icon", group: "ambassadors", city: "Berlin", lat: 52.52, lng: 13.41 },
  { id: "ambassador-tokyo", kind: "icon", group: "ambassadors", city: "Tokyo", lat: 35.68, lng: 139.69 },
  { id: "ambassador-cape-town", kind: "icon", group: "ambassadors", city: "Cape Town", lat: -33.92, lng: 18.42 },
] as const satisfies readonly Pin[];
