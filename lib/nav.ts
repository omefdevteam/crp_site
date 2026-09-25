export type NavKey = "about" | "involved" | "contact";
export type NavLink = { key: NavKey; href: string };
export const navLinks: readonly NavLink[] = [{ key: "about", href: "/about" }, { key: "involved", href: "/#join" }, { key: "contact", href: "/contact" }];
export const mobileNavLinks = navLinks;
const footerPaths = [["/#content", "/#sponsors", "/partner"], ["/programs", "/#platform", "/about"], ["/privacy", "#", "/about"]];
export function footerHref(column: number, item: number): string { return footerPaths[column]?.[item] ?? "#"; }
