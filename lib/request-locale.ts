import { headers } from "next/headers";
import { parseLocale } from "@/lib/locale";
export async function requestPath() { return (await headers()).get("x-site-path") ?? "/"; }
// Proxy overwrites this header from the URL; public content never depends on cookies.
export async function requestLocale() {
  return parseLocale((await headers()).get("x-site-locale"));
}
