import { addLogoAction, moveLogoAction, removeLogoAction, replaceLogoAction, updateLogoAction } from "@/app/admin/(console)/copy/logos/actions";
import { Button, buttonClass } from "@/components/admin/Button";
import { LogoFileField } from "@/components/admin/LogoFileField";
import { card, field } from "@/components/admin/marks";
import { ConfirmSubmit, SubmitButton } from "@/components/admin/SubmitButton";
import type { DeskGroup, DeskLogo, LogoDesk } from "@/lib/logos/manage";
import { LOGO_LINK_MAX, LOGO_NAME_MAX, LOGO_PROBLEM_TEXT, LOGOS_PER_GROUP_MAX, type LogoFit, type LogoProblem } from "@/lib/logos/model";

const DONE: Readonly<Record<string, string>> = {
  added: "Logo added. It shows on the site within a few seconds.",
  replaced: "Logo image replaced. It shows on the site within a few seconds.",
  saved: "Saved. The change shows on the site within a few seconds.",
  removed: "Logo removed from the site.",
  moved: "Order saved.",
};

// Same look as the circles on the Programs page.
const FIT: Readonly<Record<LogoFit, { circle: string; img: string }>> = {
  cover: { circle: "", img: "absolute inset-0 size-full object-cover" },
  framed: { circle: "border border-white bg-black", img: "absolute inset-0 size-full object-contain" },
  inside: { circle: "bg-white", img: "absolute inset-[14%] size-[72%] object-contain" },
};

function Preview({ logo }: { logo: DeskLogo }) {
  return (
    <span className={`relative size-16 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10 ${FIT[logo.fit].circle}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo.src} alt="" width={64} height={64} className={FIT[logo.fit].img} />
    </span>
  );
}

function Row({ entry, logo, index, canChange, uploads }: { entry: DeskGroup; logo: DeskLogo; index: number; canChange: boolean; uploads: boolean }) {
  const groupId = entry.group.id;
  const base = `${groupId}-${index}`;
  const count = entry.logos.length;
  const hidden = (
    <>
      <input type="hidden" name="group" value={groupId} />
      <input type="hidden" name="ref" value={logo.ref} />
    </>
  );
  return (
    <li className="grid gap-4 rounded-3xl bg-cream p-4">
      <div className="flex flex-wrap items-center gap-4">
        <Preview logo={logo} />
        <div className="min-w-0 flex-1 basis-48">
          <p className="text-xs font-semibold uppercase tracking-wide text-black/50">Logo {index + 1} of {count}</p>
          <p className="break-words font-semibold">{logo.name}</p>
          {logo.link ? <p className="break-all text-sm text-black/60">Opens {logo.link}</p> : <p className="text-sm text-black/60">No link</p>}
        </div>
        {canChange ? (
          <div className="flex gap-2">
            <form action={moveLogoAction}>
              {hidden}
              <input type="hidden" name="direction" value="up" />
              <button type="submit" className={buttonClass("outline", "sm")} disabled={index === 0} aria-label={`Move ${logo.name} earlier`}>Move earlier</button>
            </form>
            <form action={moveLogoAction}>
              {hidden}
              <input type="hidden" name="direction" value="down" />
              <button type="submit" className={buttonClass("outline", "sm")} disabled={index === count - 1} aria-label={`Move ${logo.name} later`}>Move later</button>
            </form>
          </div>
        ) : null}
      </div>
      {canChange ? (
        <div className="grid gap-4 desk:grid-cols-2">
          <form action={updateLogoAction} className="grid content-start gap-3">
            {hidden}
            <div className="grid gap-1">
              <label className="text-sm font-semibold" htmlFor={`${base}-name`}>Name (read out by screen readers)</label>
              <input id={`${base}-name`} name="name" type="text" required maxLength={LOGO_NAME_MAX} defaultValue={logo.name} autoComplete="off" className={field} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-semibold" htmlFor={`${base}-link`}>Link (optional)</label>
              <input id={`${base}-link`} name="link" type="url" inputMode="url" maxLength={LOGO_LINK_MAX} placeholder="https://" defaultValue={logo.link ?? ""} spellCheck={false} autoComplete="off" className={field} />
            </div>
            <div><SubmitButton className={buttonClass("solid")} pendingLabel="Saving">Save</SubmitButton></div>
          </form>
          <div className="grid content-start gap-3">
            {uploads ? (
              <form action={replaceLogoAction} className="grid gap-3">
                {hidden}
                <LogoFileField id={`${base}-file`} label="New image" />
                <div><SubmitButton className={buttonClass("outline")} pendingLabel="Uploading">Replace image</SubmitButton></div>
              </form>
            ) : null}
            <form action={removeLogoAction}>
              {hidden}
              {count > 1 ? (
                <ConfirmSubmit
                  className={buttonClass("danger")}
                  confirmVariant="danger"
                  pendingLabel="Removing"
                  title={`Remove the ${logo.name} logo?`}
                  message="It disappears from the site straight away. To bring it back, upload it again."
                  confirmLabel="Remove"
                >
                  Remove
                </ConfirmSubmit>
              ) : (
                <p className="text-sm text-black/60">This is the only logo in the group, so it can’t be removed. Replace it instead.</p>
              )}
            </form>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function Group({ entry, canChange, uploads, ready, notice }: { entry: DeskGroup; canChange: boolean; uploads: boolean; ready: boolean; notice: { text: string; bad: boolean } | null }) {
  const groupId = entry.group.id;
  const full = entry.logos.length >= LOGOS_PER_GROUP_MAX;
  return (
    <section id={groupId} className={`${card} grid gap-4`} aria-labelledby={`${groupId}-title`}>
      <div>
        <h2 id={`${groupId}-title`} className="text-xl font-semibold">{entry.group.label}</h2>
        <p className="mt-1 text-sm text-black/60">{entry.group.where}. Shown in this order, left to right.</p>
        {entry.builtIn ? <p className="mt-1 text-sm text-black/60">These are the logos built into the site. They stay until you change them here.</p> : null}
        {notice ? <p role={notice.bad ? "alert" : "status"} className={`mt-3 text-sm font-semibold ${notice.bad ? "text-magenta" : "text-leaf"}`}>{notice.text}</p> : null}
      </div>
      <ul className="grid gap-3">
        {entry.logos.map((logo, index) => (
          <Row key={logo.ref} entry={entry} logo={logo} index={index} canChange={canChange && ready} uploads={uploads} />
        ))}
      </ul>
      {canChange && ready ? (
        full ? (
          <p className="text-sm text-black/60">This group has {LOGOS_PER_GROUP_MAX} logos, the most that fit. Remove one to add another.</p>
        ) : uploads ? (
          <details className="rounded-3xl border border-black/10 p-4">
            <summary className="cursor-pointer text-sm font-semibold">Add a logo</summary>
            <form action={addLogoAction} className="mt-4 grid gap-3 desk:max-w-xl">
              <input type="hidden" name="group" value={groupId} />
              <LogoFileField id={`${groupId}-new-file`} label="Image" />
              <div className="grid gap-1">
                <label className="text-sm font-semibold" htmlFor={`${groupId}-new-name`}>Name (read out by screen readers)</label>
                <input id={`${groupId}-new-name`} name="name" type="text" required maxLength={LOGO_NAME_MAX} placeholder="For example, Climate Action Network" autoComplete="off" className={field} />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-semibold" htmlFor={`${groupId}-new-link`}>Link (optional)</label>
                <input id={`${groupId}-new-link`} name="link" type="url" inputMode="url" maxLength={LOGO_LINK_MAX} placeholder="https://" spellCheck={false} autoComplete="off" className={field} />
              </div>
              <p className="text-sm text-black/60">The new logo goes at the end of the row.</p>
              <div><SubmitButton className={buttonClass("primary")} pendingLabel="Uploading">Add logo</SubmitButton></div>
            </form>
          </details>
        ) : null
      ) : null}
    </section>
  );
}

function problemText(error: string): string {
  return Object.hasOwn(LOGO_PROBLEM_TEXT, error) ? LOGO_PROBLEM_TEXT[error as LogoProblem] : "Not saved. Try again.";
}

export function LogoDeskView({ desk, canChange, group, error, done }: { desk: LogoDesk; canChange: boolean; group: string; error: string; done: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Website text</h1>
        <p className="mt-1 text-sm text-black/60">Partner and funder logos. Changes go live on the site within a few seconds.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" href="/admin/copy">Text</Button>
        <Button variant="solid" href="/admin/copy/logos" aria-current="page">Logos</Button>
      </div>
      {!desk.ready ? (
        <p className={`${card} text-sm`}>Logo editing isn’t switched on yet. The logos below are the ones built into the site, and they keep showing as they are.</p>
      ) : !desk.uploads && canChange ? (
        <p className={`${card} text-sm`}>{LOGO_PROBLEM_TEXT["storage-off"]}</p>
      ) : null}
      {desk.groups.map((entry) => {
        const mine = group === entry.group.id;
        const notice = mine && error ? { text: problemText(error), bad: true } : mine && DONE[done] ? { text: DONE[done], bad: false } : null;
        return <Group key={entry.group.id} entry={entry} canChange={canChange} uploads={desk.uploads} ready={desk.ready} notice={notice} />;
      })}
    </div>
  );
}
