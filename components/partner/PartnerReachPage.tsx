"use client";

import { type FormEvent, type ReactNode, type RefObject, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import LocaleLink from "@/components/LocaleLink";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { COUNTRIES, type Country } from "@/lib/countries";
import { CountryDropdown } from "../apply/CountryDropdown";
import { PLACEHOLDER } from "../apply/fieldStyles";
import { useText } from "@/lib/ui-text";
import { useCopy } from "../LanguageProvider";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const US = COUNTRIES.find((c) => c.code === "US") ?? COUNTRIES[0];

const FIELD =
  `${PLACEHOLDER} w-full rounded-[48px] border border-black/12 bg-white text-[14px] font-semibold uppercase tracking-[0.56px] text-black outline-none`;
const FIELD_SM = `${FIELD} h-[63px] px-6`;

const SUPPORT_INTENTS = ["ambassador", "storyline", "speaker"] as const;

function Caret({ up }: { up?: boolean }) {
  return (
    <svg viewBox="0 0 12 12" className={`size-3 shrink-0 text-black/48 ${up ? "rotate-180" : ""}`} fill="none" aria-hidden>
      <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RadioMark({ selected }: { selected: boolean }) {
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded-full border border-black/32 bg-white">
      {selected ? <span className="size-2.5 rounded-full bg-black" /> : null}
    </span>
  );
}

function CheckMark({ selected }: { selected: boolean }) {
  return (
    <span className={`grid size-5 shrink-0 place-items-center rounded-[8px] border border-black/32 ${selected ? "bg-black" : "bg-white"}`}>
      {selected ? (
        <svg viewBox="0 0 12 12" className="size-3 text-white" fill="none" aria-hidden>
          <path d="M2.5 6.2 4.8 8.5 9.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  );
}

function useMenu(open: boolean, onClose: () => void) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const anchor = triggerRef.current;
    if (!open || !anchor) return;
    const place = () => {
      const rect = anchor.getBoundingClientRect();
      setBox({ top: rect.bottom + 8, left: rect.left, width: rect.width });
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
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.("[data-choice-menu]")) return;
      onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return { triggerRef, box };
}

function MenuShell({
  open,
  box,
  label,
  children,
}: {
  open: boolean;
  box: { top: number; left: number; width: number } | null;
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  if (!open || !box || typeof document === "undefined") return null;
  return createPortal(
    <div
      data-choice-menu
      id={id}
      role="listbox"
      aria-label={label}
      style={{ top: box.top, left: box.left, width: box.width }}
      className="fixed z-[80] flex flex-col rounded-[24px] border border-black/12 bg-white px-[18px] py-1.5"
    >
      {children}
    </div>,
    document.body,
  );
}

function OptionRow({
  selected,
  onClick,
  children,
  mark,
}: {
  selected: boolean;
  onClick: () => void;
  children: string;
  mark: ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className="relative flex h-14 w-full items-center gap-3 text-left"
    >
      {selected ? <span className="absolute inset-y-0 -left-3 -right-3 rounded-[18px] bg-[rgba(244,241,234,0.64)]" /> : null}
      <span className="relative">{mark}</span>
      <span className="relative min-w-0 flex-1 text-[20px] leading-[0.96] tracking-[-0.8px] text-black">{children}</span>
    </button>
  );
}

function FieldButton({
  label,
  value,
  open,
  onClick,
  buttonRef,
}: {
  label: string;
  value: string;
  open: boolean;
  onClick: () => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-expanded={open}
      aria-label={label}
      onClick={onClick}
      className="flex h-[63px] min-w-0 flex-1 items-center rounded-[48px] border border-black/12 bg-white pl-6 pr-8 text-left"
    >
      {value ? (
        <span className="flex min-w-0 flex-1 flex-col justify-center pr-3">
          <span className="text-[10px] font-semibold uppercase leading-[0.9] tracking-[0.4px] text-black/48 mix-blend-hard-light">{label}</span>
          <span className="truncate text-[20px] font-normal leading-[1.2] tracking-[-0.8px] text-black">{value}</span>
        </span>
      ) : (
        <span className="min-w-0 flex-1 truncate pr-3 text-[14px] font-semibold uppercase leading-[0.9] tracking-[0.56px] text-black/48 mix-blend-hard-light">
          {label}
        </span>
      )}
      <Caret up={open} />
    </button>
  );
}

function SupportMenu({
  label,
  options,
  wholeOrg,
  picks,
  onWholeOrg,
  onToggle,
}: {
  label: string;
  options: readonly string[];
  wholeOrg: boolean;
  picks: readonly number[];
  onWholeOrg: () => void;
  onToggle: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const close = useMemo(() => () => setOpen(false), []);
  const { triggerRef, box } = useMenu(open, close);
  const value = wholeOrg
    ? options[0] ?? ""
    : picks.map((index) => options[index]).filter(Boolean).join(", ");

  return (
    <>
      <FieldButton label={label} value={value} open={open} onClick={() => setOpen((current) => !current)} buttonRef={triggerRef} />
      <MenuShell open={open} box={box} label={label}>
        <OptionRow selected={wholeOrg} onClick={onWholeOrg} mark={<RadioMark selected={wholeOrg} />}>
          {options[0] ?? ""}
        </OptionRow>
        <div className="my-1.5 h-px w-full bg-black/12" />
        {options.slice(1).map((option, index) => {
          const optionIndex = index + 1;
          const selected = picks.includes(optionIndex);
          return (
            <OptionRow key={option} selected={selected} onClick={() => onToggle(optionIndex)} mark={<CheckMark selected={selected} />}>
              {option}
            </OptionRow>
          );
        })}
      </MenuShell>
    </>
  );
}

function SponsorshipMenu({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const close = useMemo(() => () => setOpen(false), []);
  const { triggerRef, box } = useMenu(open, close);

  return (
    <>
      <FieldButton label={label} value={value} open={open} onClick={() => setOpen((current) => !current)} buttonRef={triggerRef} />
      <MenuShell open={open} box={box} label={label}>
        {options.map((option) => {
          const selected = value === option;
          return (
            <OptionRow
              key={option}
              selected={selected}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              mark={<RadioMark selected={selected} />}
            >
              {option}
            </OptionRow>
          );
        })}
      </MenuShell>
    </>
  );
}

function initialSupport(intent: string | null) {
  const index = SUPPORT_INTENTS.indexOf(intent as (typeof SUPPORT_INTENTS)[number]);
  if (index === -1) return { wholeOrg: true, picks: [] as number[] };
  return { wholeOrg: false, picks: [index + 1] };
}

export function PartnerReachPage() {
  const copy = useCopy();
  const tr = useText();
  const params = useSearchParams();
  const form = copy.partnerPage.reachOutForm;
  const starting = initialSupport(params.get("support"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [organization, setOrganization] = useState("");
  const [designation, setDesignation] = useState("");
  const [wholeOrg, setWholeOrg] = useState(starting.wholeOrg);
  const [picks, setPicks] = useState<number[]>(starting.picks);
  const [sponsorship, setSponsorship] = useState("");
  const [message, setMessage] = useState("");
  const [dial, setDial] = useState<Country>(US);
  const supportLabel = wholeOrg
    ? form.supportOptions[0] ?? ""
    : picks.map((index) => form.supportOptions[index]).filter(Boolean).join(", ");

  const ready = useMemo(
    () =>
      name.trim().length > 1 &&
      EMAIL_RE.test(email.trim()) &&
      mobile.trim().length > 5 &&
      organization.trim().length > 1 &&
      designation.trim().length > 1 &&
      supportLabel.length > 0,
    [name, email, mobile, organization, designation, supportLabel],
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) return;
    const body = [
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      `Mobile: ${dial.dial} ${mobile.trim()}`,
      `Organization: ${organization.trim()}`,
      `Designation: ${designation.trim()}`,
      `Support: ${supportLabel}`,
      sponsorship ? `Sponsorship: ${sponsorship}` : null,
      "",
      message.trim(),
    ]
      .filter((line) => line !== null)
      .join("\n");
    const href = `mailto:${copy.contactPage.email}?subject=${encodeURIComponent("Partnership — Climate Refugee Pavilion")}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-cream px-4 pb-6 pt-4 desk:px-16 desk:pb-6 desk:pt-0">
      <header className="flex h-[88px] shrink-0 items-center justify-between">
        <LocaleLink
          href="/partner"
          aria-label={tr("Back")}
          className="grid size-10 place-items-center rounded-full bg-white"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/apply/arrow-left.svg" alt="" width={24} height={24} className="size-6" />
        </LocaleLink>
        <LanguageSwitch />
      </header>

      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col items-center">
        <div className="flex w-full max-w-[1072px] flex-1 flex-col items-center overflow-hidden rounded-[48px] bg-white px-5 py-10 desk:rounded-[154px] desk:px-10 desk:py-16">
          <div className="flex w-full max-w-[632px] flex-1 flex-col items-center justify-between gap-8">
            <div className="flex w-full flex-col items-center gap-6 text-center text-black">
              <h1 className="text-[40px] leading-[0.9] tracking-[-1.6px] desk:text-[48px] desk:tracking-[-1.92px]">
                {form.title}
              </h1>
              <p className="max-w-[545px] text-[24px] leading-[0.9] tracking-[-0.96px] desk:text-[32px] desk:tracking-[-1.28px]">
                {form.body}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2">
              <input
                required
                name="name"
                autoComplete="name"
                placeholder={form.name}
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-label={form.name}
                className={FIELD_SM}
              />
              <div className="flex flex-col gap-2 desk:flex-row">
                <input
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder={form.email}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-label={form.email}
                  className={`${FIELD_SM} desk:min-w-0 desk:flex-1`}
                />
                <div className={`${FIELD_SM} flex items-center gap-4 pl-4 pr-6 desk:w-[312px] desk:shrink-0`}>
                  <CountryDropdown variant="inline" value={dial} onChange={setDial} />
                  <input
                    required
                    type="tel"
                    name="mobile"
                    autoComplete="tel"
                    placeholder={form.mobile}
                    value={mobile}
                    onChange={(event) => setMobile(event.target.value)}
                    aria-label={form.mobile}
                    className={`${PLACEHOLDER} min-w-0 flex-1 bg-transparent text-[14px] font-semibold uppercase tracking-[0.56px] text-black outline-none`}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 desk:flex-row">
                <input
                  required
                  name="organization"
                  autoComplete="organization"
                  placeholder={form.organization}
                  value={organization}
                  onChange={(event) => setOrganization(event.target.value)}
                  aria-label={form.organization}
                  className={`${FIELD_SM} desk:min-w-0 desk:flex-1`}
                />
                <input
                  required
                  name="designation"
                  autoComplete="organization-title"
                  placeholder={form.designation}
                  value={designation}
                  onChange={(event) => setDesignation(event.target.value)}
                  aria-label={form.designation}
                  className={`${FIELD_SM} desk:min-w-0 desk:flex-1`}
                />
              </div>
              <div className="flex flex-col gap-2 desk:flex-row">
                <SupportMenu
                  label={form.support}
                  options={form.supportOptions}
                  wholeOrg={wholeOrg}
                  picks={picks}
                  onWholeOrg={() => {
                    setWholeOrg(true);
                    setPicks([]);
                  }}
                  onToggle={(index) => {
                    setWholeOrg(false);
                    setPicks((current) =>
                      current.includes(index) ? current.filter((item) => item !== index) : [...current, index].sort(),
                    );
                  }}
                />
                <SponsorshipMenu
                  label={form.sponsorship}
                  options={form.sponsorshipOptions}
                  value={sponsorship}
                  onChange={setSponsorship}
                />
              </div>
              <textarea
                name="message"
                placeholder={form.message}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                aria-label={form.message}
                className={`${FIELD} h-[145px] resize-none rounded-[31.5px] px-6 py-6`}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!ready}
          className={`mt-4 flex h-16 w-full max-w-[632px] items-center justify-center rounded-full text-[18px] font-semibold uppercase leading-[0.9] tracking-[0.72px] text-white mix-blend-hard-light desk:mt-2 desk:h-20 desk:text-[20px] desk:tracking-[0.8px] ${
            ready ? "gradient-brand" : "gradient-brand opacity-32"
          }`}
        >
          {form.continue}
        </button>
      </form>
    </div>
  );
}
