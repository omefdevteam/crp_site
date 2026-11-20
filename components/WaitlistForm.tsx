"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type InputHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { useText } from "@/lib/ui-text";
import { APPLY_SKILLS } from "@/lib/apply-skills";
import { submitWaitlist } from "@/lib/actions";
import { ContinueButton } from "./apply/ContinueButton";
import { DateField } from "./apply/DateField";
import { FormShell } from "./apply/FormShell";
import { FIELD, FIELD_LG, LABEL_LG, MINI_LABEL, PLACEHOLDER_LG, VALUE_LG } from "./apply/fieldStyles";
import { useCopy, useLanguage } from "./LanguageProvider";
import { Turnstile, TURNSTILE_SITE_KEY } from "./Turnstile";
import { useCaptureSubmission } from "./useCaptureSubmission";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same floating-label pill as the apply form's More about you step.
function FloatInput({ label, className = "", ...input }: { label: string; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const filled = String(input.value ?? "").length > 0;
  return (
    <label className={`${FIELD} ${FIELD_LG} w-full min-w-0 flex-col items-start justify-center pl-6 pr-8 ${className}`}>
      {filled ? <span className={MINI_LABEL}>{label}</span> : null}
      <input
        {...input}
        placeholder={label}
        aria-label={label}
        className={`w-full min-w-0 bg-transparent outline-none ${VALUE_LG} ${PLACEHOLDER_LG} ${filled ? "mt-0.5" : ""}`}
      />
    </label>
  );
}

function Caret({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 12 12" className={`size-3 shrink-0 text-black/48 transition-transform ${up ? "rotate-180" : ""}`} fill="none" aria-hidden>
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// "Your superpower" (Figma 124:382): any of the apply form's 18 skills, as
// checkboxes so people can pick more than one. Optional.
function SuperpowerField({ value, onChange }: { value: readonly string[]; onChange: (v: string[]) => void }) {
  const tr = useText();
  const { locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [box, setBox] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const label = tr("Your superpower");
  const pickedLabel = APPLY_SKILLS.filter((s) => value.includes(s.en))
    .map((s) => s[locale as "en"] ?? s.en)
    .join(", ");

  useLayoutEffect(() => {
    const anchor = triggerRef.current;
    if (!open || !anchor) return;
    const place = () => {
      const r = anchor.getBoundingClientRect();
      const below = window.innerHeight - r.bottom - 16;
      const above = r.top - 16;
      const up = below < 240 && above > below;
      const maxHeight = Math.max(180, Math.min(360, up ? above : below));
      setBox({ top: up ? r.top - 8 - maxHeight : r.bottom + 8, left: r.left, width: r.width, maxHeight });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (triggerRef.current?.contains(target) || target.closest?.("[data-superpower-menu]")) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className={`${FIELD} ${FIELD_LG} w-full min-w-0 shrink-0 gap-6 desk:w-auto desk:flex-1 pl-6 pr-8 text-left transition-colors ${open ? "bg-cream" : ""}`}
      >
        <span className="flex min-w-0 flex-1 flex-col justify-center">
          {pickedLabel ? (
            <>
              <span className={MINI_LABEL}>{label}</span>
              <span className={`mt-0.5 truncate ${VALUE_LG}`}>{pickedLabel}</span>
            </>
          ) : (
            <span className={`truncate ${LABEL_LG}`}>{label}</span>
          )}
        </span>
        <Caret up={open} />
      </button>
      {open && box
        ? createPortal(
            <div
              data-superpower-menu
              role="listbox"
              aria-multiselectable
              aria-label={label}
              style={{ top: box.top, left: box.left, width: box.width, maxHeight: box.maxHeight }}
              className="fixed z-[80] flex flex-col overflow-y-auto overscroll-contain rounded-[24px] border border-black/12 bg-white px-[18px] py-1.5"
            >
              {APPLY_SKILLS.map((skill) => {
                const selected = value.includes(skill.en);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => onChange(selected ? value.filter((v) => v !== skill.en) : [...value, skill.en])}
                    className={`relative flex min-h-12 gap-3 w-full shrink-0 items-center rounded-[18px] px-3 text-left text-[16px] leading-[1.1] tracking-[-0.64px] text-black transition-colors hover:bg-[rgba(244,241,234,0.64)] desk:min-h-14 desk:text-[20px] desk:tracking-[-0.8px] ${
                      selected ? "bg-[rgba(244,241,234,0.64)]" : ""
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`flex size-5 shrink-0 items-center justify-center rounded-[6px] border ${selected ? "border-black bg-black text-white" : "border-black/32 bg-white"}`}
                    >
                      {selected ? (
                        <svg viewBox="0 0 12 12" className="size-3" fill="none">
                          <path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                    </span>
                    {skill[locale as "en"] ?? skill.en}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

// Waitlist page (Figma 124:227) and its thank-you screen (Figma 124:393), opened
// from the homepage "Join the waitlist" button. Built from the apply form's parts.
export function WaitlistForm({ onClose, source = "homepage_waitlist" }: { onClose: () => void; source?: string }) {
  const tr = useText();
  const copy = useCopy();
  const { locale } = useLanguage();
  const { pending, error, challengeKey, submit } = useCaptureSubmission();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [superpower, setSuperpower] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [organization, setOrganization] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [doneName, setDoneName] = useState<string | null>(null);

  const ready =
    name.trim().length > 0 &&
    EMAIL_RE.test(email.trim()) &&
    dob.length > 0 &&
    subject.trim().length > 0 &&
    !pending &&
    !(TURNSTILE_SITE_KEY && !token);

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!ready) return;
    const saved = await submit(() =>
      submitWaitlist({
        email: email.trim(),
        name: name.trim(),
        dob,
        ...(superpower.length ? { superpower } : {}),
        subject: subject.trim(),
        ...(organization.trim() ? { organization: organization.trim() } : {}),
        source,
        locale,
        turnstileToken: token,
      }),
    );
    if (saved) setDoneName(name.trim());
    else setToken(null);
  };

  if (doneName !== null) {
    return (
      <FormShell wide fill footer={<ContinueButton label={tr("Back to home")} onClick={onClose} />}>
        <div role="status" className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center desk:gap-8 desk:px-0">
          <p className="text-[32px] leading-[0.9] tracking-[-0.04em] text-black desk:text-[48px]">
            {tr("Hi {name},").replace("{name}", doneName)}
          </p>
          <p className="max-w-[632px] text-[20px] leading-[0.96] tracking-[-0.04em] text-black/64 desk:text-[32px]">
            {tr("We’ve signed you up for our waitlist.")}
            <br aria-hidden />
            {tr("Stay tuned for our latest updates.")}
          </p>
        </div>
      </FormShell>
    );
  }

  return (
    <FormShell
      wide
      fill
      onBack={onClose}
      footer={
        <>
          {error ? (
            <p role="alert" className="text-center text-sm text-black">
              {copy.waitlist.saveError}
            </p>
          ) : null}
          <ContinueButton label={tr("Join")} disabled={!ready} onClick={() => void send()} />
        </>
      }
    >
      <form noValidate onSubmit={send} aria-busy={pending} className="flex min-h-0 flex-1 flex-col px-4 desk:px-0">
        <h1 className="text-center text-[32px] leading-[0.9] tracking-[-0.04em] text-black desk:text-[48px]">{copy.waitlist.title}</h1>
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-2 overflow-y-auto py-6">
          <FloatInput label={tr("*Name")} name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          <FloatInput
            label={tr("*Email")}
            type="email"
            name="email"
            autoComplete="email"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex w-full gap-2 max-desk:flex-col">
            <DateField value={dob} onChange={setDob} size="lg" className="desk:w-[206px] desk:shrink-0" />
            <SuperpowerField value={superpower} onChange={setSuperpower} />
          </div>
          <FloatInput label={tr("*Subject")} name="subject" maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} />
          <FloatInput
            label={tr("Organization")}
            name="organization"
            autoComplete="organization"
            maxLength={200}
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
          <button type="submit" hidden aria-hidden tabIndex={-1} />
        </div>
        <Turnstile key={challengeKey} onToken={setToken} appearance="interaction-only" float />
      </form>
    </FormShell>
  );
}
