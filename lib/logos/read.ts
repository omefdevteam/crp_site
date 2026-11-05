import { cache } from "react";
import { unstable_cache } from "next/cache";
import { asc, sql } from "drizzle-orm";
import { getDb, siteLogos, type Db } from "@/lib/db";
import { cachedRenderPhase, COPY_TAG, type CachedRenderPhase } from "@/lib/copy/read";
import { queryWithRetry, rateLimitedWarn, shortReason, withTimeout, isConnectionError, type RetryOptions } from "@/lib/copy/resilience";
import { BUILTIN_LOGOS, shownLogos, type LogoRow, type SiteLogos } from "@/lib/logos/model";

// Logos are read the same way as the site copy (lib/copy/read.ts): through the
// shared data cache tagged "copy", so a logo change clears it together with the
// prerendered pages, and a DB outage never bakes the built-in logos into a
// cached page that already had real ones.

const REVALIDATE_SECONDS = 600;
const FALLBACK_REVALIDATE_SECONDS = 60;
const DEADLINE_MS = 1500;
const RETRY: RetryOptions = { attemptTimeoutMs: 5_000, budgetMs: 8_000, retryDelayMs: 250 };
const WARN_INTERVAL_MS = 5 * 60_000;

/** Thrown while regenerating a cached page without any logo rows: Next keeps the previous page. */
export class LogosUnavailableError extends Error {
  constructor(reason: string) {
    super(`[logos] site logos unavailable while regenerating a cached page (${reason}); keeping the previous page`);
    this.name = "LogosUnavailableError";
  }
}

// Postgres "undefined_table": the 0020 migration has not been applied yet.
export function isMissingTable(err: unknown): boolean {
  for (let current: unknown = err, depth = 0; current && depth < 5; depth++) {
    const record = current as { code?: unknown; cause?: unknown };
    if (record.code === "42P01") return true;
    current = record.cause;
  }
  return false;
}

export async function queryLogoRows(db: Db): Promise<LogoRow[]> {
  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('statement_timeout', '1500', true)`);
      return tx
        .select({
          id: siteLogos.id,
          logoGroup: siteLogos.logoGroup,
          position: siteLogos.position,
          name: siteLogos.name,
          linkUrl: siteLogos.linkUrl,
          builtin: siteLogos.builtin,
          url: siteLogos.url,
        })
        .from(siteLogos)
        .orderBy(asc(siteLogos.logoGroup), asc(siteLogos.position));
    });
  } catch (err) {
    // Before the migration: no table means no edits yet, so the built-in logos show.
    if (isMissingTable(err)) return [];
    throw err;
  }
}

type Logger = { warn: (key: string, line: string) => void; error: (line: string) => void };

const defaultLogger: Logger = { warn: rateLimitedWarn(WARN_INTERVAL_MS), error: (line) => console.error(line) };

export type LogoSourceOptions = {
  query: () => Promise<LogoRow[]>;
  cache?: (refresh: () => Promise<LogoRow[]>) => () => Promise<LogoRow[]>;
  deadlineMs: number;
  retry: RetryOptions;
  log?: Logger;
  shortenPageLifetime?: () => Promise<unknown> | unknown;
  cachedReadLimitMs?: number;
};

export function createLogoSource(options: LogoSourceOptions) {
  const log = options.log ?? defaultLogger;
  let lastGood: readonly LogoRow[] | undefined;
  const remember = <T extends readonly LogoRow[]>(rows: T): T => {
    lastGood = rows;
    return rows;
  };

  async function refresh(): Promise<LogoRow[]> {
    try {
      return remember(await queryWithRetry(options.query, options.retry));
    } catch (err) {
      if (lastGood && isConnectionError(err)) {
        log.warn("logos-refresh", `[logos] refresh failed (${shortReason(err)}); keeping last good logos`);
        return [...lastGood];
      }
      throw err;
    }
  }

  const cached = options.cache ? options.cache(refresh) : refresh;

  // Dynamic renders (and next dev): never wait more than the deadline.
  async function read(): Promise<SiteLogos> {
    try {
      return shownLogos(remember(await withTimeout(cached(), options.deadlineMs, "logo read")));
    } catch (err) {
      log.warn("logos-read", `[logos] logos unavailable (${shortReason(err)}); showing ${lastGood ? "last good" : "built-in"} logos`);
      return lastGood ? shownLogos(lastGood) : BUILTIN_LOGOS;
    }
  }

  // Prerendered pages: same rules as readForCachedPage in lib/copy/read.ts.
  async function readForCachedPage(phase: CachedRenderPhase): Promise<SiteLogos> {
    if (phase === "dev") return read();
    try {
      return shownLogos(remember(await withTimeout(cached(), options.cachedReadLimitMs ?? options.retry.budgetMs + 2_000, "logo read (cached page)")));
    } catch (err) {
      const reason = shortReason(err);
      if (lastGood) {
        log.warn("logos-page", `[logos] logos unavailable (${reason}); cached page uses the last good logos`);
        return shownLogos(lastGood);
      }
      if (phase === "runtime") {
        log.warn("logos-page", `[logos] logos unavailable (${reason}); keeping the previous cached page`);
        throw new LogosUnavailableError(reason);
      }
      log.warn("logos-build", `[logos] logos unavailable at build (${reason}); prerendering the built-in logos with a short revalidate`);
      await options.shortenPageLifetime?.();
      return BUILTIN_LOGOS;
    }
  }

  return { refresh, read, readForCachedPage, lastGood: () => lastGood };
}

const source = createLogoSource({
  query: () => queryLogoRows(getDb()),
  cache: (refresh) => unstable_cache(refresh, ["site-logos"], { tags: [COPY_TAG], revalidate: REVALIDATE_SECONDS }),
  deadlineMs: DEADLINE_MS,
  retry: RETRY,
  cachedReadLimitMs: RETRY.budgetMs + 2_000,
  shortenPageLifetime: unstable_cache(async () => true, ["logos-fallback-ttl"], { tags: [COPY_TAG], revalidate: FALLBACK_REVALIDATE_SECONDS }),
});

/** Logos for the prerendered public pages under /[lang]. */
export const publicSiteLogos = cache(async (): Promise<SiteLogos> => source.readForCachedPage(cachedRenderPhase()));
