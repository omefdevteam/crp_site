// Row-major order matching Figma 2184:180 (3 columns).
export const APPLY_SKILLS = [
  { id: "agriculture-food", image: "/images/apply/skills/agriculture-food.png", en: "Agriculture & Food", fr: "Agriculture et alimentation", es: "Agricultura y alimentación", pt: "Agricultura e alimentação" },
  { id: "ai-data", image: "/images/apply/skills/ai-data.png", en: "AI & Data", fr: "IA et données", es: "IA y datos", pt: "IA e dados" },
  { id: "climate-science", image: "/images/apply/skills/climate-science.png", en: "Climate Science", fr: "Science du climat", es: "Ciencia del clima", pt: "Ciência climática" },
  { id: "climate-justice", image: "/images/apply/skills/climate-justice.png", en: "Climate Justice", fr: "Justice climatique", es: "Justicia climática", pt: "Justiça climática" },
  { id: "community-organizing", image: "/images/apply/skills/community-organizing.png", en: "Community organizing", fr: "Organisation communautaire", es: "Organización comunitaria", pt: "Organização comunitária" },
  { id: "disaster-response", image: "/images/apply/skills/disaster-response.png", en: "Disaster Response", fr: "Réponse aux catastrophes", es: "Respuesta ante desastres", pt: "Resposta a catástrofes" },
  { id: "energy", image: "/images/apply/skills/energy.png", en: "Energy", fr: "Énergie", es: "Energía", pt: "Energia" },
  { id: "finance-digital-assets", image: "/images/apply/skills/finance-digital-assets.png", en: "Finance & Digital Assets", fr: "Finance et actifs numériques", es: "Finanzas y activos digitales", pt: "Finanças e ativos digitais" },
  { id: "health-wellbeing", image: "/images/apply/skills/health-wellbeing.png", en: "Health & Wellbeing", fr: "Santé et bien-être", es: "Salud y bienestar", pt: "Saúde e bem-estar" },
  { id: "human-rights", image: "/images/apply/skills/human-rights.png", en: "Human Rights", fr: "Droits humains", es: "Derechos humanos", pt: "Direitos humanos" },
  { id: "indigenous-rights", image: "/images/apply/skills/indigenous-rights.png", en: "Indigenous Rights", fr: "Droits autochtones", es: "Derechos de los pueblos indígenas", pt: "Direitos dos povos indígenas" },
  { id: "insurance-finance", image: "/images/apply/skills/insurance-finance.png", en: "Insurance & Finance", fr: "Assurance et finance", es: "Seguros y finanzas", pt: "Seguros e finanças" },
  { id: "law-policy", image: "/images/apply/skills/law-policy.png", en: "Law & Policy", fr: "Droit et politiques", es: "Derecho y políticas públicas", pt: "Direito e políticas públicas" },
  { id: "migration-displacement", image: "/images/apply/skills/migration-displacement.png", en: "Migration & Displacement", fr: "Migration et déplacement", es: "Migración y desplazamiento", pt: "Migração e deslocação" },
  { id: "media-storytelling", image: "/images/apply/skills/media-storytelling.png", en: "Media & Storytelling", fr: "Médias et narration", es: "Medios y narración", pt: "Media e narrativas" },
  { id: "repairative-frameworks", image: "/images/apply/skills/repairative-frameworks.png", en: "Repairative Frameworks", fr: "Cadres réparateurs", es: "Marcos de reparación", pt: "Mecanismos de reparação" },
  { id: "technology", image: "/images/apply/skills/technology.png", en: "Technology", fr: "Technologie", es: "Tecnología", pt: "Tecnologia" },
  { id: "urban-planning", image: "/images/apply/skills/urban-planning.png", en: "Urban Planning", fr: "Urbanisme", es: "Urbanismo", pt: "Planeamento urbano" },
] as const;

export const SKILL_LABELS = APPLY_SKILLS.map((s) => s.en) as unknown as [
  (typeof APPLY_SKILLS)[number]["en"],
  ...(typeof APPLY_SKILLS)[number]["en"][],
];

const SKILL_SET = new Set<string>(SKILL_LABELS);

export function isSkillLabel(value: string): value is (typeof APPLY_SKILLS)[number]["en"] {
  return SKILL_SET.has(value);
}
