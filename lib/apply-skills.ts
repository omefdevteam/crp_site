// Row-major order matching Figma 2184:180 (3 columns).
export const APPLY_SKILLS = [
  { id: "agriculture-food", image: "/images/apply/skills/agriculture-food.png", en: "Agriculture & Food", fr: "Agriculture et alimentation" },
  { id: "ai-data", image: "/images/apply/skills/ai-data.png", en: "AI & Data", fr: "IA et données" },
  { id: "climate-science", image: "/images/apply/skills/climate-science.png", en: "Climate Science", fr: "Science du climat" },
  { id: "climate-justice", image: "/images/apply/skills/climate-justice.png", en: "Climate Justice", fr: "Justice climatique" },
  { id: "community-organizing", image: "/images/apply/skills/community-organizing.png", en: "Community organizing", fr: "Organisation communautaire" },
  { id: "disaster-response", image: "/images/apply/skills/disaster-response.png", en: "Disaster Response", fr: "Réponse aux catastrophes" },
  { id: "energy", image: "/images/apply/skills/energy.png", en: "Energy", fr: "Énergie" },
  { id: "finance-digital-assets", image: "/images/apply/skills/finance-digital-assets.png", en: "Finance & Digital Assets", fr: "Finance et actifs numériques" },
  { id: "health-wellbeing", image: "/images/apply/skills/health-wellbeing.png", en: "Health & Wellbeing", fr: "Santé et bien-être" },
  { id: "human-rights", image: "/images/apply/skills/human-rights.png", en: "Human Rights", fr: "Droits humains" },
  { id: "indigenous-rights", image: "/images/apply/skills/indigenous-rights.png", en: "Indigenous Rights", fr: "Droits autochtones" },
  { id: "insurance-finance", image: "/images/apply/skills/insurance-finance.png", en: "Insurance & Finance", fr: "Assurance et finance" },
  { id: "law-policy", image: "/images/apply/skills/law-policy.png", en: "Law & Policy", fr: "Droit et politiques" },
  { id: "migration-displacement", image: "/images/apply/skills/migration-displacement.png", en: "Migration & Displacement", fr: "Migration et déplacement" },
  { id: "media-storytelling", image: "/images/apply/skills/media-storytelling.png", en: "Media & Storytelling", fr: "Médias et narration" },
  { id: "repairative-frameworks", image: "/images/apply/skills/repairative-frameworks.png", en: "Repairative Frameworks", fr: "Cadres réparateurs" },
  { id: "technology", image: "/images/apply/skills/technology.png", en: "Technology", fr: "Technologie" },
  { id: "urban-planning", image: "/images/apply/skills/urban-planning.png", en: "Urban Planning", fr: "Urbanisme" },
] as const;

export const SKILL_LABELS = APPLY_SKILLS.map((s) => s.en) as unknown as [
  (typeof APPLY_SKILLS)[number]["en"],
  ...(typeof APPLY_SKILLS)[number]["en"][],
];

const SKILL_SET = new Set<string>(SKILL_LABELS);

export function isSkillLabel(value: string): value is (typeof APPLY_SKILLS)[number]["en"] {
  return SKILL_SET.has(value);
}
