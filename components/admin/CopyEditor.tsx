"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { updateCopy } from "@/app/admin/(console)/copy/actions";
import { Button, buttonClass } from "@/components/admin/Button";
import { languageLabel } from "@/lib/admin/labels";
import { area, card, field, focusRing } from "@/components/admin/marks";
import { ConfirmSubmit, SubmitButton } from "@/components/admin/SubmitButton";
import { previewPath } from "@/lib/copy/preview";
import {
  copyCellId,
  clearCopyDrafts,
  readCopyDrafts,
  settleCopyDrafts,
  rememberCopyDraft,
  shownCopyText,
  writeCopyDrafts,
  type CopyDraftMap,
} from "@/lib/copy/draftState";
import type { CopyRow } from "@/lib/copy/editor";
import { CATALOGS, isSingleValue, type CatalogId } from "@/lib/copy/catalog";
import { DESK_DEFAULT_LANGUAGE, deskHref, entryLanguage } from "@/lib/copy/deskUrl";

type Cell = CopyRow["cells"][number];

export function CopyEditor({
  row,
  scopeAll,
  query,
  needsReview,
  language = DESK_DEFAULT_LANGUAGE,
  history,
}: {
  row: CopyRow;
  scopeAll: boolean;
  query: string;
  needsReview: boolean;
  /** The language from the page address (`lang`); the toggle switches it. */
  language?: string;
  /** Earlier versions, one block per language; only the shown language's block appears. */
  history?: Readonly<Record<string, ReactNode>>;
}) {
  const [drafts, setDrafts] = useState<CopyDraftMap>(readCopyDrafts);
  // The toggle switches at once; the address then catches up so the choice sticks.
  const [chosen, setChosen] = useState(language);
  const [addressLanguage, setAddressLanguage] = useState(language);
  if (addressLanguage !== language) {
    setAddressLanguage(language);
    setChosen(language);
  }
  const live = settleCopyDrafts(
    drafts,
    row.cells.map((cell) => ({
      id: copyCellId(row.catalog, row.key, cell.locale),
      revision: cell.revision,
      serverText: cell.draft ?? cell.value,
    })),
  );
  if (live !== drafts) {
    writeCopyDrafts(live);
    setDrafts(live);
  }
  const dirty = Object.keys(live).length > 0;
  // One value for every language (social links): a single, plainly labelled input.
  const single = isSingleValue(row.catalog);
  const active = entryLanguage(chosen, row.cells.map((cell) => cell.locale));
  const english = row.cells.find((cell) => cell.locale === "en");

  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (href.startsWith("/admin/copy") || href.startsWith("?") || href.startsWith("#")) return;
      if (typeof window.confirm !== "function") return;
      if (window.confirm("You have unsaved changes. Leave without saving?")) {
        clearCopyDrafts();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  return (
    <section className="grid min-w-0 gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-black/50">{row.catalog === "page" ? row.sectionLabel : CATALOGS[row.catalog].label}</p>
          <h2 className="mt-1 break-words text-xl font-semibold" title={row.key}>{row.label}</h2>
        </div>
        {single ? null : (
          <nav aria-label="Language" className="flex shrink-0 gap-1 rounded-full bg-white p-1">
            {row.cells.map((cell) => {
              const marks = cellMarks(cell, live, row);
              const current = cell.locale === active;
              return (
                <Link
                  key={cell.locale}
                  href={deskHref({ catalog: row.catalog, all: scopeAll, review: needsReview, q: query, key: row.key, lang: cell.locale })}
                  replace
                  scroll={false}
                  aria-current={current ? "page" : undefined}
                  title={[languageLabel(cell.locale), ...marks.map((mark) => mark.label)].join(" · ")}
                  onClick={() => setChosen(cell.locale)}
                  className={`relative inline-flex h-10 min-w-12 items-center justify-center rounded-full px-3 text-sm font-semibold uppercase tracking-wide transition ${focusRing} ${current ? "bg-black text-white" : "text-black hover:bg-cream"}`}
                >
                  {cell.locale}
                  {marks.length > 0 ? (
                    <>
                      <span aria-hidden="true" className={`absolute right-1 top-1 size-2.5 rounded-full ring-2 ring-white ${DOT[marks[0]?.kind ?? "draft"]}`} />
                      <span className="sr-only">{`, ${marks.map((mark) => mark.label).join(", ")}`}</span>
                    </>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
      <div className="grid gap-4">
        {row.cells.map((cell) => {
          const id = copyCellId(row.catalog, row.key, cell.locale);
          const server = cell.draft ?? cell.value;
          const shown = shownCopyText(live, id, cell.revision, server);
          const fieldId = `${row.catalog}-${row.key}-${cell.locale}`;
          const preview = previewPath(row.catalog, row.section, cell.locale);
          const helpId = row.help ? `${fieldId}-help` : undefined;
          const referenceId = `${fieldId}-english`;
          const reference = !single && cell.locale !== "en" ? english : undefined;
          const onChange = (text: string) => {
            const next = rememberCopyDraft(readCopyDrafts(), id, cell.revision, text, server);
            writeCopyDrafts(next);
            setDrafts(next);
          };
          // Every language stays in the page (hidden when not shown) so unsaved
          // text and the browser's undo history survive switching languages.
          return (
            <form key={cell.locale} action={updateCopy} hidden={cell.locale !== active} className={`${card} grid gap-3`}>
              <HiddenScope catalog={row.catalog} scopeAll={scopeAll} query={query} needsReview={needsReview} copyKey={row.key} language={cell.locale} />
              <input type="hidden" name="locale" value={cell.locale} />
              <input type="hidden" name="base" value={cell.revision} />
              <input type="hidden" name="digest" value={row.digest} />
              <div className="flex flex-wrap items-center gap-2">
                {single ? null : <h3 className="text-lg font-semibold">{languageLabel(cell.locale)}</h3>}
                {single ? null : <StateChip kind={cell.state.kind} />}
                {cell.override ? <span className="rounded-full bg-black px-2 py-1 text-xs font-semibold text-white">Edited</span> : <span className="rounded-full border border-black/15 px-2 py-1 text-xs">Default</span>}
                {cell.locale !== "en" && cell.state.kind !== "source" && !server.trim() ? <span className="rounded-full bg-magenta px-2 py-1 text-xs font-semibold text-white">Missing translation</span> : null}
                {cell.draft !== null || (live[id] && live[id].revision === cell.revision) ? <span className="rounded-full bg-orange px-2 py-1 text-xs font-semibold">Draft</span> : null}
                {preview ? <Button href={preview} variant="outline" size="sm">Preview</Button> : null}
              </div>
              {single ? (
                <>
                  <label className="text-sm font-semibold" htmlFor={fieldId}>{row.label} (all languages)</label>
                  {row.help ? <p id={helpId} className="-mt-2 text-sm text-black/60">{row.help}</p> : null}
                  <input
                    id={fieldId}
                    name="value"
                    type="text"
                    inputMode="url"
                    spellCheck={false}
                    placeholder="https://"
                    aria-describedby={helpId}
                    className={field}
                    value={shown}
                    autoComplete="off"
                    onChange={(event) => onChange(event.target.value)}
                  />
                </>
              ) : (
                <>
                  <label className="sr-only" htmlFor={fieldId}>{languageLabel(cell.locale)} text</label>
                  {row.help ? <p id={helpId} className="text-sm text-black/60">{row.help}</p> : null}
                  {reference ? (
                    <div id={referenceId} className="rounded-3xl border border-dashed border-black/15 px-4 py-3 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-black/50">English</p>
                      <p lang="en" className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words text-black/70">{reference.value || "No English text yet."}</p>
                    </div>
                  ) : null}
                  <textarea
                    id={fieldId}
                    name="value"
                    lang={cell.locale}
                    rows={10}
                    aria-describedby={[helpId, reference ? referenceId : undefined].filter(Boolean).join(" ") || undefined}
                    className={`${area} max-h-[75vh] min-h-64 resize-y field-sizing-content`}
                    value={shown}
                    autoComplete="off"
                    onChange={(event) => onChange(event.target.value)}
                  />
                </>
              )}
              <div className="flex flex-wrap gap-2">
                <SubmitButton className={buttonClass("solid")} name="intent" value="draft" pendingLabel="Saving">Save draft</SubmitButton>
                <SubmitButton className={buttonClass("primary")} name="intent" value="publish" pendingLabel="Publishing">Publish</SubmitButton>
                <ConfirmSubmit
                  className={buttonClass("danger")}
                  confirmVariant="danger"
                  name="intent"
                  value="reset"
                  pendingLabel="Resetting"
                  title="Go back to the default text?"
                  message={single ? "The link is removed and its icon shows without a link. You can restore it from earlier versions." : "Your edits to this language are replaced. You can restore them from earlier versions."}
                  confirmLabel="Reset"
                >
                  Reset to default
                </ConfirmSubmit>
                {cell.state.kind === "stale" ? <SubmitButton className={buttonClass("outline")} name="intent" value="mark" pendingLabel="Saving">Mark reviewed</SubmitButton> : null}
              </div>
            </form>
          );
        })}
        {history?.[active] ?? null}
      </div>
    </section>
  );
}

type MarkKind = "missing" | "unsaved" | "draft" | "stale";

const DOT: Record<MarkKind, string> = {
  missing: "bg-magenta",
  unsaved: "bg-orange",
  draft: "bg-orange",
  stale: "bg-leaf",
};

/** Why a language on the toggle needs a look, most urgent first. */
export function cellMarks(cell: Cell, live: CopyDraftMap, row: Pick<CopyRow, "catalog" | "key">): { kind: MarkKind; label: string }[] {
  const local = live[copyCellId(row.catalog, row.key, cell.locale)];
  const unsaved = local !== undefined && local.revision === cell.revision ? local : null;
  const text = unsaved ? unsaved.text : cell.draft ?? cell.value;
  const marks: { kind: MarkKind; label: string }[] = [];
  if (cell.locale !== "en" && cell.state.kind !== "source" && !text.trim()) marks.push({ kind: "missing", label: "Missing translation" });
  if (unsaved) marks.push({ kind: "unsaved", label: "Unsaved changes" });
  else if (cell.draft !== null) marks.push({ kind: "draft", label: "Draft" });
  if (cell.state.kind === "stale") marks.push({ kind: "stale", label: "Needs review" });
  return marks;
}

export function HiddenScope({
  catalog,
  scopeAll,
  query,
  needsReview,
  copyKey,
  language,
}: {
  catalog: CatalogId;
  scopeAll: boolean;
  query: string;
  needsReview: boolean;
  copyKey?: string;
  /** Keeps the language toggle where it was after saving. */
  language?: string;
}) {
  return (
    <>
      <input type="hidden" name="catalog" value={catalog} />
      {scopeAll ? <input type="hidden" name="all" value="1" /> : null}
      <input type="hidden" name="q" value={query} />
      {needsReview ? <input type="hidden" name="review" value="1" /> : null}
      {copyKey ? <input type="hidden" name="key" value={copyKey} /> : null}
      {language && language !== DESK_DEFAULT_LANGUAGE ? <input type="hidden" name="lang" value={language} /> : null}
    </>
  );
}

function StateChip({ kind }: { kind: "source" | "current" | "stale" }) {
  if (kind === "source") return <span className="rounded-full bg-lime px-2 py-1 text-xs font-semibold">Original</span>;
  if (kind === "stale") return <span className="rounded-full bg-black px-2 py-1 text-xs font-semibold text-lime">Needs review</span>;
  return <span className="rounded-full bg-leaf/40 px-2 py-1 text-xs font-semibold">Up to date</span>;
}
