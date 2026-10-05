export type AboutTeamMember = {
  id: string;
  name: string;
  role: string;
  quote: string;
  image: string;
  imagePosition?: string;
  place?: { lat: number; lng: number };
};

const photo = (file: string) => `/images/about/team/${file}` as const;
const blankAvatar = photo("avatar-blank.jpg");

export const aboutTeam = [
  {
    id: "genevieve-leveille",
    name: "Geneviève Leveille",
    role: "Founder & President",
    quote: "Pioneering digital leader advancing technology for climate-vulnerable communities.",
    image: photo("genevieve-leveille.jpg"),
  },
  {
    id: "taylor-rankin",
    name: "Taylor Rankin",
    role: "Executive Producer",
    quote: "Global producer creating impactful cultural events and experiences.",
    image: photo("taylor-rankin.jpg"),
    place: { lat: 39.0, lng: -104.5 },
  },
  {
    id: "stefania-passamonte",
    name: "Stefania Passamonte",
    role: "In-house Counsel",
    quote: "International counsel guiding governance, compliance, and partnerships.",
    image: photo("stefania-passamonte.jpg"),
    imagePosition: "center 12%",
  },
  {
    id: "nathan-khrupalo",
    name: "Nathan Khrupalo",
    role: "Sponsors Relations Director",
    quote: "Partnership leader connecting global capital with climate action.",
    image: photo("nathan-khrupalo.jpg"),
  },
  {
    id: "joseph-raymond-hammond",
    name: "Joseph Raymond Hammond",
    role: "Program Director",
    quote: "Program leader shaping global policy and development forums.",
    image: photo("joseph-raymond-hammond.jpg"),
  },
  {
    id: "tochukwu-macfoy",
    name: "Dr. Tochukwu Macfoy",
    role: "Creative Director",
    quote: "Creative strategist using art and storytelling for social change.",
    image: photo("tochukwu-macfoy.jpg"),
    place: { lat: 11.2, lng: 12.0 },
  },
  {
    id: "sutu-campbell",
    name: "Sutu Campbell",
    role: "Interactive Experience Advisor",
    quote: "Award-winning artist pioneering immersive digital storytelling.",
    image: photo("sutu-campbell.jpg"),
  },
  {
    id: "anirudha-ghosh",
    name: "Anirudha Ghosh",
    role: "UX Designer",
    quote: "Product designer creating intuitive, accessible digital experiences.",
    image: photo("anirudha-ghosh.jpg"),
    place: { lat: 22.6, lng: 79.0 },
  },
  {
    id: "faithful-kobina-quayson",
    name: "Faithful Kobina Quayson",
    role: "Web Developer",
    quote: "Web developer converting curated designs into functional web products.",
    image: photo("faithful-kobina-quayson.jpg"),
    place: { lat: 6.8, lng: -2.0 },
  },
  {
    id: "sthella-ngolet",
    name: "Sthella Ngolet",
    role: "Francophone Programs Advocate",
    quote: "Connecting Francophone communities with global climate action.",
    image: photo("sthella-ngolet.jpg"),
  },
  {
    id: "gemma-gutierrez",
    name: "Gemma Gutierrez",
    role: "Youth Programs",
    quote: "Youth advocate empowering the next generation of climate leaders.",
    image: photo("gemma-gutierrez.jpg"),
    place: { lat: 39.0, lng: -89.5 },
  },
  {
    id: "analyah-dos-santos",
    name: "Analyah dos Santos",
    role: "Climate Programming",
    quote: "Climate researcher advancing adaptation and humanitarian solutions.",
    image: photo("analyah-dos-santos.jpg"),
  },
  {
    id: "rowland-jones",
    name: "Rowland Jones",
    role: "Head of Technology",
    quote: "Technology strategist powering secure, connected global experiences.",
    image: photo("rowland-jones.jpg"),
    place: { lat: 7.9, lng: -0.2 },
  },
  {
    id: "vanessa-helou",
    name: "Vanessa Helou",
    role: "Coordinating Producer",
    quote: "Creative producer coordinating global events, partners, and media.",
    image: photo("vanessa-helou.jpg"),
  },
  {
    id: "chiamaka-chukwudi",
    name: "Chiamaka Chukwudi",
    role: "Production Coordinator",
    quote: "Production coordinator delivering complex international events.",
    image: blankAvatar,
    place: { lat: 7.4, lng: 4.2 },
  },
  {
    id: "oyelese-oreoluwa-daniel",
    name: "Oyelese Oreoluwa Daniel",
    role: "Event Coordinator",
    quote: "Event coordinator ensuring smooth logistics and delegate experiences.",
    image: blankAvatar,
    place: { lat: 10.4, lng: 10.2 },
  },
  {
    id: "danielle-kyony",
    name: "Danielle Kyony",
    role: "Intern & Volunteer Coordinator",
    quote: "Emerging advocate mobilizing volunteers for climate justice.",
    image: photo("danielle-kyony.jpg"),
  },
  {
    id: "angel-mordi",
    name: "Angel Mordi",
    role: "Social Media Manager",
    quote:
      "Digital storyteller focused on turning ideas into clear, engaging content that connects brands with their audiences.",
    image: photo("angel-mordi.jpg"),
    place: { lat: 9.4, lng: 8.4 },
  },
  {
    id: "gift-adedayo",
    name: "Gift Adedayo",
    role: "Brand Designer",
    quote: "Designer who loves turning ideas into clear visual solutions.",
    image: photo("gift-adedayo.jpg"),
    place: { lat: 8.6, lng: 6.4 },
  },
  {
    id: "kim-dauthel",
    name: "Kim Dauthel",
    role: "member",
    quote: "...",
    image: photo("kim-dauthel.jpg"),
  },
  {
    id: "mehdi-yann",
    name: "Mehdi-Yann",
    role: "member",
    quote: "...",
    image: photo("mehdi-yann.jpg"),
  },
  {
    id: "naquetta-ricks",
    name: "Naquetta Ricks",
    role: "member",
    quote: "...",
    image: photo("naquetta-ricks.jpg"),
  },
] as const satisfies readonly AboutTeamMember[];
