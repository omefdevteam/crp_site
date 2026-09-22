import { createHmac } from "crypto";
import { lt, sql } from "drizzle-orm";
import { appSecret } from "@/lib/config";
import { getDb, rateLimits, type Store } from "@/lib/db";

// Fixed-window counter in Postgres so every instance shares one view. Keys are
// HMAC'd so the table never stores raw emails or IP addresses.
export async function rateLimit(scope: string, identifier: string, limit: number, seconds = 3600): Promise<boolean> {
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const key = createHmac("sha256", appSecret()).update(`${scope}:${bucket}:${identifier}`).digest("hex");
  const [row] = await getDb().insert(rateLimits).values({ key, count: 1, expiresAt: new Date((bucket + 1) * seconds * 1000) })
    .onConflictDoUpdate({ target: rateLimits.key, set: { count: sql`${rateLimits.count} + 1` } })
    .returning({ count: rateLimits.count });
  return row.count <= limit;
}

export async function purgeExpiredRateLimits(db: Store): Promise<void> {
  await db.delete(rateLimits).where(lt(rateLimits.expiresAt, new Date()));
}

export function clientIp(headers: Headers): string {
  // Only trust this header behind the deployment's trusted reverse proxy.
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
