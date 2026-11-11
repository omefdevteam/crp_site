import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, isMemberSitePath, localePath, publicPaths, parseLocale, LOCALE_COOKIE, MEMBER_PREFIX, MEMBER_ROUTE } from "@/lib/locale";
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/\/$/, "") || "/";
  const first = pathname.split("/")[1];
  const localized = isLocale(first);
  const path = localized ? pathname.slice(first.length + 1) || "/" : pathname;
  const isPublic = (publicPaths as readonly string[]).includes(path);
  const headers = new Headers(request.headers);
  headers.set("x-site-path", isPublic ? path : "/");
  headers.set("x-site-locale", localized ? first : isPublic ? defaultLocale : parseLocale(request.cookies.get(LOCALE_COOKIE)?.value));
  if (!localized && isPublic && ["GET", "HEAD"].includes(request.method)) {
    const destination = request.nextUrl.clone();
    destination.pathname = localePath(path, defaultLocale);
    return NextResponse.redirect(destination, 308);
  }
  // A bare /ambassador link (an old bookmark) goes to the visitor's language.
  if (!localized && isMemberSitePath(path) && ["GET", "HEAD"].includes(request.method)) {
    const destination = request.nextUrl.clone();
    destination.pathname = `/${parseLocale(request.cookies.get(LOCALE_COOKIE)?.value)}${path}`;
    return NextResponse.redirect(destination, 307);
  }
  // The Ambassador pages live in app/ambassador-space/[lang], outside the
  // cached public tree. Visitors only ever see /{lang}/ambassador/...; the
  // internal folder is not an address of its own.
  if (pathname === MEMBER_ROUTE || pathname.startsWith(`${MEMBER_ROUTE}/`)) {
    return new NextResponse("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex, nofollow" } });
  }
  const member = localized && isMemberSitePath(path);
  let response: NextResponse;
  if (member) {
    const destination = request.nextUrl.clone();
    destination.pathname = `${MEMBER_ROUTE}/${first}${path.slice(MEMBER_PREFIX.length)}`;
    response = NextResponse.rewrite(destination, { request: { headers } });
  } else {
    response = NextResponse.next({ request: { headers } });
  }
  response.headers.set("Content-Language", headers.get("x-site-locale")!);
  if (!isPublic) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // Staff pages must never be framed by another site (clickjacking) or leak
    // their addresses through the Referer header. Same-origin framing stays
    // allowed because the console shows private documents in an iframe.
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("Content-Security-Policy", "frame-ancestors 'self'");
    response.headers.set("Referrer-Policy", "same-origin");
    response.headers.set("X-Content-Type-Options", "nosniff");
  }
  if (member) {
    // Ambassador pages are per person: never framed, never cached, and their
    // addresses never leak through Referer.
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
    response.headers.set("Referrer-Policy", path === "/ambassador/confirm" ? "no-referrer" : "same-origin");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Cache-Control", "private, no-store");
  }
  if (pathname === "/admin/confirm") {
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}
export const config = { matcher: ["/((?!api(?:/|$)|_next/|.*\\.).*)"] };
