"use client";

import { useState } from "react";
import { COUNTRIES, type Country } from "@/lib/countries";
import { CountryDropdown } from "../apply/CountryDropdown";
import { FormShell } from "../apply/FormShell";
import { ContinueButton } from "../apply/ContinueButton";
import { Turnstile, TURNSTILE_SITE_KEY } from "../Turnstile";
import { FIELD, PLACEHOLDER } from "../apply/fieldStyles";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GHANA = COUNTRIES.find((c) => c.name === "Ghana") ?? COUNTRIES[0];

export type NominatorData = {
  nominatorName: string;
  nominatorEmail: string;
  nominatorPhone: string;
  nominatorOrganization: string;
  nominatorRelation: string;
  turnstileToken?: string | null;
};

export function NominatorStep({
  onBack,
  onSubmit,
  submitting,
  error,
}: {
  onBack: () => void;
  onSubmit: (data: NominatorData) => void;
  submitting: boolean;
  error: string | null;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dialCountry, setDialCountry] = useState<Country>(GHANA);
  const [mobile, setMobile] = useState("");
  const [organization, setOrganization] = useState("");
  const [relation, setRelation] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const valid =
    name.trim().length > 0 &&
    EMAIL_RE.test(email.trim()) &&
    mobile.trim().length > 0 &&
    organization.trim().length > 0 &&
    relation.trim().length > 0;
  const turnstileReady = !TURNSTILE_SITE_KEY || Boolean(turnstileToken);
  const canSubmit = valid && turnstileReady && !submitting;

  return (
    <FormShell
      onBack={onBack}
      footer={
        <>
          {error ? (
            <p role="alert" className="text-center text-[13px] text-magenta">
              {error}
            </p>
          ) : null}
          <Turnstile onToken={setTurnstileToken} size="compact" />
          <ContinueButton
            label={submitting ? "One moment…" : "Continue"}
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit) return;
              onSubmit({
                nominatorName: name.trim(),
                nominatorEmail: email.trim(),
                nominatorPhone: `${dialCountry.dial} ${mobile.trim()}`,
                nominatorOrganization: organization.trim(),
                nominatorRelation: relation.trim(),
                turnstileToken,
              });
            }}
          />
        </>
      }
    >
      <h1 className="text-center text-[26px] leading-[0.9] tracking-[-1.04px] text-black desk:text-[36px] desk:tracking-[-1.44px]">
        About you
      </h1>

      <div className="mt-5 flex flex-col gap-1.5 desk:mt-7 desk:gap-2">
        <div className={`${FIELD} pl-5 pr-6`}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="*NAME"
            aria-label="Your full name"
            className={`w-full bg-transparent text-[15px] text-black outline-none ${PLACEHOLDER}`}
          />
        </div>

        <div className="flex flex-col gap-1.5 desk:flex-row desk:gap-2">
          <div className={`${FIELD} flex-1 pl-5 pr-6`}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="*EMAIL"
              aria-label="Your email"
              spellCheck={false}
              className={`w-full bg-transparent text-[15px] text-black outline-none ${PLACEHOLDER}`}
            />
          </div>
          <div className={`${FIELD} gap-3 pl-3 pr-5 desk:w-[312px]`}>
            <CountryDropdown variant="inline" value={dialCountry} onChange={setDialCountry} />
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="*MOBILE"
              aria-label="Your mobile number"
              className={`w-full bg-transparent text-[15px] text-black outline-none ${PLACEHOLDER}`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 desk:flex-row desk:gap-2">
          <div className={`${FIELD} flex-1 pl-5 pr-6`}>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="*ORGANIZATION"
              aria-label="Organization"
              className={`w-full bg-transparent text-[15px] text-black outline-none ${PLACEHOLDER}`}
            />
          </div>
          <div className={`${FIELD} flex-1 pl-5 pr-6`}>
            <input
              type="text"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder="*RELATION TO NOMINEE"
              aria-label="Relation to nominee"
              className={`w-full bg-transparent text-[15px] text-black outline-none ${PLACEHOLDER}`}
            />
          </div>
        </div>
      </div>
    </FormShell>
  );
}
