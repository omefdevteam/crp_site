import { cache } from "react";
import { revalidatePath, unstable_cache, updateTag } from "next/cache";
import { sql } from "drizzle-orm";
import { getDb, type Db } from "@/lib/db";
import type { Locale } from "@/lib/locale";
import type { Messages } from "@/lib/messages";
import {
  indexPublished,
  mergePage,
  NO_OVERRIDES,
  socialLinks,
  uiOverrides,
  type PublishedCopy,
  type PublishedRow,
} from "@/lib/copy/catalog";
import type { UiOverrides } from "@/lib/ui-messages";
import type { SocialLinks } from "@/lib/copy/social";
import { emailSourcesFrom, JSON_EMAILS, type EmailSources } from "@/lib/copy/sources";
import { isConnectionError, queryWithRetry, rateLimitedWarn, shortReason, withTimeout, type RetryOptions } from "@/lib/copy/resilience";

export const COPY_TAG = "copy";
const REVALIDATE_SECONDS = 600;
// How long a page render waits for the copy before using the fallback (unchanged).
const DEADLINE_MS = 1500;
// The refresh itself: one retry on connection errors, 5s per attempt (a Neon
// compute waking from scale-to-zero plus the TLS handshake fits well inside
// that), 8s in total. It runs as a background revalidation, so this budget
// does not add to page render time.
const RETRY: RetryOptions = { attemptTimeoutMs: 5_000, budgetMs: 8_000, retryDelayMs: 250 };
const WARN_INTERVAL_MS = 5 * 60_000;
// A prerendered page built while the DB was unreachable shows the bundled
// defaults; it is regenerated after this many seconds instead of the full TTL.
const FALLBACK_REVALIDATE_SECONDS = 60;
// Upper bound on a cached-page read (the retry budget plus headroom).
const CACHED_READ_LIMIT_MS = RETRY.budgetMs + 2_000;

/**
 * Where a prerendered (cached) page is being rendered:
 * - "build": `next build`. A DB failure renders the defaults with a short revalidate, so a deploy never fails on a DB hiccup.
 * - "runtime": ISR regeneration on the server. A DB failure throws, so Next keeps serving the previous page.
 * - "dev": `next dev`. Nothing is cached; behave like a dynamic render.
 */
export type CachedRenderPhase = "build" | "runtime" | "dev";

export function cachedRenderPhase(env: { NEXT_PHASE?: string; NODE_ENV?: string } = process.env): CachedRenderPhase {
  if (env.NEXT_PHASE === "phase-production-build") return "build";
  return env.NODE_ENV === "production" ? "runtime" : "dev";
}

/** Thrown while regenerating a cached page without any real copy: Next keeps the previous page instead of caching the defaults. */
export class CopyUnavailableError extends Error {
  constructor(reason: string) {
    super(`[copy] site copy unavailable while regenerating a cached page (${reason}); keeping the previous page`);
    this.name = "CopyUnavailableError";
  }
}

type SiteCopy = {
  messages: Messages;
  ui: UiOverrides;
  /** Footer social links: one value for every locale, already checked as https. */
  social: SocialLinks;
  published: PublishedCopy;
};

export async function queryPublishedRows(db: Db): Promise<PublishedRow[]> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('statement_timeout', '1500', true)`);
    const result = await tx.execute(sql`
      select catalog, locale, key, value
      from (
        select distinct on (catalog, locale, key) catalog, locale, key, value
        from copy_revisions
        order by catalog, locale, key, revision desc
      ) head
      where value is not null
    `);
    const rows = Array.isArray(result) ? result : result.rows;
    return rows.flatMap((row) => {
      const record = row as { catalog?: unknown; locale?: unknown; key?: unknown; value?: unknown };
      if (typeof record.catalog !== "string" || typeof record.locale !== "string" || typeof record.key !== "string" || typeof record.value !== "string") return [];
      return [{ catalog: record.catalog, locale: record.locale, key: record.key, value: record.value }];
    });
  });
}

type Logger = { warn: (key: string, line: string) => void; error: (line: string) => void };

const defaultLogger: Logger = {
  warn: rateLimitedWarn(WARN_INTERVAL_MS),
  error: (line) => console.error(line),
};

// Reads the published rows, or falls back to the last good rows this instance
// has seen, or to the bundled defaults. A connection-class failure is an
// expected outage (Neon waking up, a dropped socket) and gets one rate-limited
// warn line; anything else is unexpected and stays an error.
export async function publishedOrFallback(
  load: () => Promise<readonly PublishedRow[]>,
  fallback: () => readonly PublishedRow[] | undefined = () => undefined,
  log: Logger = defaultLogger,
): Promise<PublishedCopy> {
  try {
    return indexPublished(await load());
  } catch (err) {
    const stale = fallback();
    if (isConnectionError(err)) {
      log.warn("read", `[copy] published copy unavailable (${shortReason(err)}); serving ${stale ? "last good" : "default"} copy`);
    } else {
      log.error(`[copy] published rows unavailable: ${shortReason(err)}`);
    }
    return stale ? indexPublished(stale) : NO_OVERRIDES;
  }
}

export type CopySourceOptions = {
  query: () => Promise<PublishedRow[]>;
  // Wraps the refresh in the shared data cache (unstable_cache in production).
  cache?: (refresh: () => Promise<PublishedRow[]>) => () => Promise<PublishedRow[]>;
  deadlineMs: number;
  retry: RetryOptions;
  log?: Logger;
  /** Called when a build-time prerender falls back to the defaults; shortens that page's revalidate. */
  shortenPageLifetime?: () => Promise<unknown> | unknown;
  /** Upper bound for readForCachedPage (defaults to the retry budget plus 2s). */
  cachedReadLimitMs?: number;
};

export function createCopySource(options: CopySourceOptions) {
  const log = options.log ?? defaultLogger;
  // Newest rows this server instance has seen, from the DB or the data cache.
  let lastGood: readonly PublishedRow[] | undefined;
  const remember = <T extends readonly PublishedRow[]>(rows: T): T => {
    lastGood = rows;
    return rows;
  };

  // Runs inside unstable_cache. When it throws during a background
  // revalidation Next logs a full error with a stack, so an expected outage
  // returns the last good rows instead (the same rows the stale entry holds),
  // which keeps the page on that copy until the next revalidation.
  async function refresh(): Promise<PublishedRow[]> {
    try {
      return remember(await queryWithRetry(options.query, options.retry));
    } catch (err) {
      if (lastGood && isConnectionError(err)) {
        log.warn("refresh", `[copy] refresh failed (${shortReason(err)}); keeping last good copy`);
        return [...lastGood];
      }
      throw err;
    }
  }

  const cached = options.cache ? options.cache(refresh) : refresh;

  // Page render never waits longer than deadlineMs; a slow refresh keeps going
  // in the background and lands in the cache when it finishes.
  function read(): Promise<PublishedCopy> {
    return publishedOrFallback(
      async () => remember(await withTimeout(cached(), options.deadlineMs, "copy read")),
      () => lastGood,
      log,
    );
  }

  // For pages whose HTML is cached (ISR). Never ends up with the bundled
  // defaults in a cache because the DB was slow or down:
  // - no 1.5s deadline: wait for the full retry budget, since ISR renders run
  //   in the background (or at build) and nobody is waiting on them;
  // - real rows this instance already has (last good) are fine to serve;
  // - otherwise, at runtime, throw so Next keeps the previous cached page;
  // - at build, render the defaults but with a short revalidate.
  async function readForCachedPage(phase: CachedRenderPhase): Promise<PublishedCopy> {
    if (phase === "dev") return read();
    try {
      return indexPublished(remember(await withTimeout(cached(), options.cachedReadLimitMs ?? options.retry.budgetMs + 2_000, "copy read (cached page)")));
    } catch (err) {
      const reason = shortReason(err);
      if (lastGood) {
        log.warn("page", `[copy] published copy unavailable (${reason}); cached page uses the last good copy`);
        return indexPublished(lastGood);
      }
      if (phase === "runtime") {
        log.warn("page", `[copy] published copy unavailable (${reason}); keeping the previous cached page`);
        throw new CopyUnavailableError(reason);
      }
      log.warn("build", `[copy] published copy unavailable at build (${reason}); prerendering the default copy with a short revalidate`);
      await options.shortenPageLifetime?.();
      return NO_OVERRIDES;
    }
  }

  return { refresh, read, readForCachedPage, lastGood: () => lastGood };
}

const source = createCopySource({
  query: () => queryPublishedRows(getDb()),
  cache: (refresh) => unstable_cache(refresh, ["copy-head"], { tags: [COPY_TAG], revalidate: REVALIDATE_SECONDS }),
  deadlineMs: DEADLINE_MS,
  retry: RETRY,
  cachedReadLimitMs: CACHED_READ_LIMIT_MS,
  // Any unstable_cache call lowers the revalidate of the page being prerendered to its own.
  shortenPageLifetime: unstable_cache(async () => true, ["copy-fallback-ttl"], { tags: [COPY_TAG], revalidate: FALLBACK_REVALIDATE_SECONDS }),
});

function siteCopyFrom(published: PublishedCopy, locale: Locale): SiteCopy {
  return { messages: mergePage(published, locale), ui: uiOverrides(published), social: socialLinks(published), published };
}

/** Site copy for dynamic routes (admin, apply links, confirmation): never waits more than 1.5s. */
export const siteCopy = cache(async (locale: Locale): Promise<SiteCopy> => siteCopyFrom(await source.read(), locale));

/**
 * Site copy for the prerendered public pages under /[lang]. Their HTML is
 * cached, so a failed DB read must not be baked in as the default text; see
 * readForCachedPage.
 */
export const publicSiteCopy = cache(async (locale: Locale): Promise<SiteCopy> =>
  siteCopyFrom(await source.readForCachedPage(cachedRenderPhase()), locale));

export async function loadEmailSources(): Promise<EmailSources> {
  try {
    return emailSourcesFrom(await source.read());
  } catch (err) {
    console.error("[copy] email sources unavailable", err instanceof Error ? err.message : err);
    return JSON_EMAILS;
  }
}

// Runs after every successful publish (publish, reset, restore, mark reviewed).
// updateTag expires the copy data cache and every prerendered page tagged
// "copy" (all of /[lang]/*); revalidatePath clears the same pages by route, in
// case a page was ever rendered without the tag.
export function expireCopy(): void {
  try {
    updateTag(COPY_TAG);
    revalidatePath("/[lang]", "layout");
  } catch (err) {
    if (process.env.NODE_ENV === "production") throw err;
  }
}
