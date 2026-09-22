export type NavKey = "about" | "involved" | "contact";
export type NavLink = { key: NavKey; href: string };

export const navLinks: readonly NavLink[] = [
  { key: "about", href: "/about" },
  { key: "involved", href: "/#join" },
  { key: "contact", href: "/contact" },
];

export const mobileNavLinks: readonly NavLink[] = navLinks;

/** Footer labels that already have a page. Unmapped labels stay `#`. */
const footerHrefs: Record<string, string> = {
  Stories: "/#content",
  Récits: "/#content",
  Partners: "/partner",
  Partenaires: "/partner",
  Ambassadors: "/programs",
  Ambassadeurs: "/programs",
  Mission: "/about",
};

export function footerHref(label: string): string {
  return footerHrefs[label] ?? "#";
}
