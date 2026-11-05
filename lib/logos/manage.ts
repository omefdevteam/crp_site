import { randomUUID } from "node:crypto";
import { and, asc, eq, sql } from "drizzle-orm";
import { del, put } from "@vercel/blob";
import { recordEvent, type AdminEvent } from "@/lib/admin/events";
import { expireCopy } from "@/lib/copy/read";
import { siteLogos, type Db, type SiteLogo, type Tx } from "@/lib/db";
import { isMissingTable } from "@/lib/logos/read";
import {
  BUILTIN_LOGOS,
  LOGO_GROUPS,
  LOGOS_PER_GROUP_MAX,
  builtinLogo,
  checkLogoFile,
  isPublicLogoUrl,
  parseLogoLink,
  parseLogoName,
  parseLogoRef,
  type CheckedLogoFile,
  type LogoFit,
  type LogoGroup,
  type LogoProblem,
} from "@/lib/logos/model";

// Staff changes to the partner and funder logos. Every change runs in one
// transaction with a per-group lock, records an activity event, and then
// clears the cached pages exactly like a Website text publish.

/** The public logo file store. Kept apart from the private identity and clip store. */
export type LogoStore = {
  put(pathname: string, bytes: Uint8Array, contentType: string): Promise<{ url: string; pathname: string }>;
  remove(pathname: string): Promise<void>;
};

// A public Vercel Blob store has its own token; the main BLOB_READ_WRITE_TOKEN
// belongs to the private store and is never used for logos.
export function logoStoreFromEnv(env: Readonly<Record<string, string | undefined>> = process.env): LogoStore | null {
  const token = env.LOGO_BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return null;
  return {
    async put(pathname, bytes, contentType) {
      const blob = await put(pathname, Buffer.from(bytes), { access: "public", token, contentType, addRandomSuffix: false, allowOverwrite: false });
      return { url: blob.url, pathname: blob.pathname };
    },
    async remove(pathname) {
      try {
        await del(pathname, { token });
      } catch (err) {
        if (err instanceof Error && err.name === "BlobNotFoundError") return;
        throw err;
      }
    },
  };
}

export type LogoResult = { readonly ok: true } | { readonly ok: false; readonly reason: LogoProblem };

class Refused extends Error {
  constructor(readonly reason: LogoProblem) {
    super(reason);
  }
}

// ---- Dashboard view ----

export type DeskLogo = {
  readonly ref: string;
  readonly name: string;
  readonly link: string | null;
  readonly src: string;
  readonly fit: LogoFit;
};

export type DeskGroup = {
  readonly group: LogoGroup;
  readonly logos: readonly DeskLogo[];
  /** True while the group still shows the logos built into the site. */
  readonly builtIn: boolean;
};

export type LogoDesk = {
  /** False until the site_logos table exists. */
  readonly ready: boolean;
  readonly uploads: boolean;
  readonly groups: readonly DeskGroup[];
};

function deskLogo(group: LogoGroup, row: SiteLogo): DeskLogo | null {
  const builtin = builtinLogo(group, row.builtin);
  if (builtin) return { ref: row.id, name: row.name, link: row.linkUrl, src: builtin.src, fit: builtin.fit };
  if (!row.url || !isPublicLogoUrl(row.url)) return null;
  return { ref: row.id, name: row.name, link: row.linkUrl, src: row.url, fit: "inside" };
}

function builtinDesk(group: LogoGroup): DeskGroup {
  return {
    group,
    builtIn: true,
    logos: BUILTIN_LOGOS[group.id].map((logo) => ({ ref: logo.key, name: logo.name, link: null, src: logo.src, fit: logo.fit })),
  };
}

export async function loadLogoDesk(db: Db, store: LogoStore | null): Promise<LogoDesk> {
  let rows: SiteLogo[];
  try {
    rows = await db.select().from(siteLogos).orderBy(asc(siteLogos.logoGroup), asc(siteLogos.position));
  } catch (err) {
    if (isMissingTable(err)) return { ready: false, uploads: false, groups: LOGO_GROUPS.map(builtinDesk) };
    throw err;
  }
  return {
    ready: true,
    uploads: store !== null,
    groups: LOGO_GROUPS.map((group) => {
      const mine = rows.filter((row) => row.logoGroup === group.id).flatMap((row) => deskLogo(group, row) ?? []);
      return mine.length > 0 ? { group, logos: mine, builtIn: false } : builtinDesk(group);
    }),
  };
}

// ---- Changes ----

async function lockGroup(tx: Tx, group: LogoGroup): Promise<SiteLogo[]> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`site_logos:${group.id}`}))`);
  const rows = await tx.select().from(siteLogos).where(eq(siteLogos.logoGroup, group.id)).orderBy(asc(siteLogos.position), asc(siteLogos.id));
  if (rows.length > 0) return rows;
  // First change to this group: copy the built-in logos in so they can be edited too.
  return tx
    .insert(siteLogos)
    .values(group.builtins.map((logo, position) => ({ logoGroup: group.id, position, name: logo.name, builtin: logo.id })))
    .returning()
    .then((inserted) => inserted.sort((a, b) => a.position - b.position));
}

function find(group: LogoGroup, rows: readonly SiteLogo[], rawRef: unknown): SiteLogo {
  const ref = parseLogoRef(group, rawRef);
  const row = !ref ? undefined : ref.kind === "builtin" ? rows.find((item) => item.builtin === ref.builtin) : rows.find((item) => item.id === ref.id);
  if (!row) throw new Refused("not-found");
  return row;
}

async function renumber(tx: Tx, ordered: readonly SiteLogo[]): Promise<void> {
  for (const [position, row] of ordered.entries()) {
    if (row.position !== position) await tx.update(siteLogos).set({ position }).where(eq(siteLogos.id, row.id));
  }
}

function groupOf(input: unknown): LogoGroup {
  const group = LOGO_GROUPS.find((item) => item.id === input);
  if (!group) throw new Refused("not-found");
  return group;
}

type Change = { readonly event: AdminEvent };

async function change(db: Db, actorId: string, run: (tx: Tx) => Promise<Change>, cleanup?: () => Promise<void>): Promise<LogoResult> {
  try {
    await db.transaction(async (tx) => {
      const result = await run(tx);
      await recordEvent(tx, actorId, result.event);
    });
  } catch (err) {
    await cleanup?.().catch(() => {});
    if (err instanceof Refused) return { ok: false, reason: err.reason };
    if (isMissingTable(err)) return { ok: false, reason: "not-ready" };
    throw err;
  }
  expireCopy();
  return { ok: true };
}

async function upload(store: LogoStore | null, group: LogoGroup, file: CheckedLogoFile): Promise<{ url: string; pathname: string }> {
  if (!store) throw new Refused("storage-off");
  const pathname = `site-logos/${group.id.replace(".", "-")}/${randomUUID()}.${file.extension}`;
  let stored;
  try {
    stored = await store.put(pathname, file.bytes, file.contentType);
  } catch {
    throw new Refused("storage-failed");
  }
  // A token for the private store would hand back a private URL the public page can't show.
  if (!isPublicLogoUrl(stored.url)) {
    await store.remove(stored.pathname).catch(() => {});
    throw new Refused("storage-failed");
  }
  return stored;
}

function refusal(err: unknown): LogoResult {
  if (err instanceof Refused) return { ok: false, reason: err.reason };
  throw err;
}

async function dropOld(store: LogoStore | null, pathname: string | null | undefined): Promise<void> {
  if (!store || !pathname) return;
  // Best effort: the row is already gone or replaced, so a leftover file is harmless.
  await store.remove(pathname).catch(() => {});
}

export type AddLogoInput = { group: unknown; name: unknown; link: unknown; file: Uint8Array | null };

export async function addLogo(db: Db, store: LogoStore | null, actorId: string, input: AddLogoInput): Promise<LogoResult> {
  let group: LogoGroup;
  let stored: { url: string; pathname: string };
  let name: string;
  let link: string | null;
  let file: CheckedLogoFile;
  try {
    group = groupOf(input.group);
    const parsedName = parseLogoName(input.name);
    if (!parsedName.ok) throw new Refused(parsedName.problem);
    const parsedLink = parseLogoLink(input.link);
    if (!parsedLink.ok) throw new Refused(parsedLink.problem);
    const checked = checkLogoFile(input.file);
    if (!checked.ok) throw new Refused(checked.problem);
    name = parsedName.value;
    link = parsedLink.value;
    file = checked.value;
    stored = await upload(store, group, file);
  } catch (err) {
    return refusal(err);
  }
  return change(db, actorId, async (tx) => {
    const rows = await lockGroup(tx, group);
    if (rows.length >= LOGOS_PER_GROUP_MAX) throw new Refused("full");
    await tx.insert(siteLogos).values({
      logoGroup: group.id,
      position: rows.length,
      name,
      linkUrl: link,
      url: stored.url,
      pathname: stored.pathname,
      contentType: file.contentType,
      byteSize: file.bytes.length,
      updatedBy: actorId,
    });
    return { event: { kind: "logo.added", logoGroup: group.id, logoName: name } };
  }, () => dropOld(store, stored.pathname));
}

export type ReplaceLogoInput = { group: unknown; ref: unknown; file: Uint8Array | null };

export async function replaceLogo(db: Db, store: LogoStore | null, actorId: string, input: ReplaceLogoInput): Promise<LogoResult> {
  let group: LogoGroup;
  let stored: { url: string; pathname: string };
  let file: CheckedLogoFile;
  try {
    group = groupOf(input.group);
    const checked = checkLogoFile(input.file);
    if (!checked.ok) throw new Refused(checked.problem);
    file = checked.value;
    stored = await upload(store, group, file);
  } catch (err) {
    return refusal(err);
  }
  let old: string | null = null;
  const result = await change(db, actorId, async (tx) => {
    const rows = await lockGroup(tx, group);
    const row = find(group, rows, input.ref);
    old = row.pathname;
    await tx
      .update(siteLogos)
      .set({ builtin: null, url: stored.url, pathname: stored.pathname, contentType: file.contentType, byteSize: file.bytes.length, updatedBy: actorId })
      .where(and(eq(siteLogos.id, row.id), eq(siteLogos.logoGroup, group.id)));
    return { event: { kind: "logo.replaced", logoGroup: group.id, logoName: row.name } };
  }, () => dropOld(store, stored.pathname));
  if (result.ok) await dropOld(store, old);
  return result;
}

export type UpdateLogoInput = { group: unknown; ref: unknown; name: unknown; link: unknown };

export async function updateLogo(db: Db, actorId: string, input: UpdateLogoInput): Promise<LogoResult> {
  let group: LogoGroup;
  let name: string;
  let link: string | null;
  try {
    group = groupOf(input.group);
    const parsedName = parseLogoName(input.name);
    if (!parsedName.ok) throw new Refused(parsedName.problem);
    const parsedLink = parseLogoLink(input.link);
    if (!parsedLink.ok) throw new Refused(parsedLink.problem);
    name = parsedName.value;
    link = parsedLink.value;
  } catch (err) {
    return refusal(err);
  }
  return change(db, actorId, async (tx) => {
    const rows = await lockGroup(tx, group);
    const row = find(group, rows, input.ref);
    await tx.update(siteLogos).set({ name, linkUrl: link, updatedBy: actorId }).where(eq(siteLogos.id, row.id));
    return { event: { kind: "logo.updated", logoGroup: group.id, logoName: name, previousName: row.name } };
  });
}

export type RemoveLogoInput = { group: unknown; ref: unknown };

export async function removeLogo(db: Db, store: LogoStore | null, actorId: string, input: RemoveLogoInput): Promise<LogoResult> {
  let group: LogoGroup;
  try {
    group = groupOf(input.group);
  } catch (err) {
    return refusal(err);
  }
  let old: string | null = null;
  const result = await change(db, actorId, async (tx) => {
    const rows = await lockGroup(tx, group);
    const row = find(group, rows, input.ref);
    if (rows.length <= 1) throw new Refused("last-logo");
    await tx.delete(siteLogos).where(eq(siteLogos.id, row.id));
    await renumber(tx, rows.filter((item) => item.id !== row.id));
    old = row.pathname;
    return { event: { kind: "logo.removed", logoGroup: group.id, logoName: row.name } };
  });
  if (result.ok) await dropOld(store, old);
  return result;
}

export type MoveLogoInput = { group: unknown; ref: unknown; direction: unknown };

export async function moveLogo(db: Db, actorId: string, input: MoveLogoInput): Promise<LogoResult> {
  let group: LogoGroup;
  try {
    group = groupOf(input.group);
    if (input.direction !== "up" && input.direction !== "down") throw new Refused("not-found");
  } catch (err) {
    return refusal(err);
  }
  const direction = input.direction as "up" | "down";
  return change(db, actorId, async (tx) => {
    const rows = await lockGroup(tx, group);
    const row = find(group, rows, input.ref);
    const from = rows.indexOf(row);
    const to = direction === "up" ? from - 1 : from + 1;
    const ordered = [...rows];
    if (to >= 0 && to < ordered.length) {
      ordered.splice(from, 1);
      ordered.splice(to, 0, row);
    }
    await renumber(tx, ordered);
    return { event: { kind: "logo.moved", logoGroup: group.id, logoName: row.name, direction } };
  });
}
