"use client";

import { type FormEvent, useMemo, useState } from "react";
import { COUNTRIES, type Country } from "@/lib/countries";
import { trail } from "@/lib/fonts";
import { CountryDropdown } from "../apply/CountryDropdown";
import { PLACEHOLDER } from "../apply/fieldStyles";
import { useCopy } from "../LanguageProvider";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const US = COUNTRIES.find((c) => c.dial === "+1") ?? COUNTRIES[0];

const FIELD =
  `${PLACEHOLDER} w-full rounded-[48px] border border-black/12 bg-white text-[14px] font-semibold uppercase tracking-[0.56px] text-black outline-none`;
const FIELD_SM = `${FIELD} h-[63px] px-6`;

function ContactRow({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 py-1 pr-5">
      <span className="grid size-12 shrink-0 place-items-center rounded-[20px] bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon} alt="" width={16} height={16} className="size-4" />
      </span>
      <p className="text-[14px] font-semibold uppercase tracking-[1.12px] text-black/64">
        {label}
      </p>
    </div>
  );
}

export function ContactPage() {
  const copy = useCopy();
  const c = copy.contactPage;
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");
  const [dial, setDial] = useState<Country>(US);

  const ready = useMemo(
    () =>
      name.trim().length > 1 &&
      EMAIL_RE.test(email.trim()) &&
      mobile.trim().length > 5 &&
      message.trim().length > 2,
    [name, email, mobile, message],
  );

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ready) return;
    const body = [
      `Name: ${name.trim()}`,
      organization.trim() ? `Organization: ${organization.trim()}` : null,
      `Email: ${email.trim()}`,
      `Mobile: ${dial.dial} ${mobile.trim()}`,
      "",
      message.trim(),
    ]
      .filter(Boolean)
      .join("\n");
    const href = `mailto:${c.email}?subject=${encodeURIComponent("Contact — Climate Refugee Pavilion")}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  }

  return (
    <section className="bg-cream px-5 pb-16 pt-24 desk:px-16 desk:py-[88px]">
      <div className="mx-auto flex min-h-[640px] max-w-[1072px] flex-col overflow-hidden rounded-[88px] bg-white px-6 py-10 desk:h-[629px] desk:min-h-0 desk:flex-row desk:items-end desk:rounded-[154px] desk:px-10 desk:py-16">
        <div className="flex flex-col gap-2 desk:h-[501px] desk:w-[558px] desk:shrink-0 desk:-mr-[109px] desk:gap-0">
          <h1
            className={`${trail.className} text-[clamp(56px,12vw,130px)] uppercase leading-[0.9] tracking-[0.04em] text-black desk:flex-1 desk:tracking-[5.2px]`}
          >
            {c.title}
          </h1>
          <div className="mt-6 flex flex-col desk:mt-0">
            <ContactRow icon="/icons/contact/at.svg" label={c.email} />
            <ContactRow icon="/icons/contact/map-pin.svg" label={c.address} />
            <ContactRow icon="/icons/contact/phone.svg" label={c.phone} />
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="relative z-10 mt-8 flex w-full flex-col gap-2 desk:mt-0 desk:h-[420px] desk:flex-1 desk:items-end desk:justify-center"
        >
          <input
            required
            name="name"
            autoComplete="name"
            placeholder={c.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label={c.name}
            className={FIELD_SM}
          />
          <input
            name="organization"
            autoComplete="organization"
            placeholder={c.organization}
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            aria-label={c.organization}
            className={FIELD_SM}
          />
          <div className="flex w-full flex-col gap-2 desk:flex-row">
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              placeholder={c.emailField}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label={c.emailField}
              className={`${FIELD_SM} desk:min-w-0 desk:flex-1 desk:w-auto`}
            />
            <div className={`${FIELD_SM} flex items-center gap-4 pl-4 pr-6 desk:min-w-0 desk:flex-1 desk:w-auto`}>
              <CountryDropdown variant="inline" value={dial} onChange={setDial} />
              <input
                required
                type="tel"
                name="mobile"
                autoComplete="tel"
                placeholder={c.mobile}
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                aria-label={c.mobile}
                className={`${PLACEHOLDER} min-w-0 flex-1 bg-transparent text-[14px] font-semibold uppercase tracking-[0.56px] text-black outline-none`}
              />
            </div>
          </div>
          <textarea
            required
            name="message"
            placeholder={c.message}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-label={c.message}
            rows={4}
            className={`${FIELD} min-h-[120px] w-full flex-1 resize-none rounded-[31.5px] px-6 py-6 desk:min-h-0`}
          />
          <button
            type="submit"
            disabled={!ready}
            className="mt-1 h-14 w-full shrink-0 rounded-full bg-black text-[16px] font-semibold uppercase tracking-[0.64px] text-white transition-opacity disabled:opacity-32 desk:mt-0 desk:h-16 desk:w-[284px]"
          >
            {c.send}
          </button>
        </form>
      </div>
    </section>
  );
}
