"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { COUNTRIES, type Country } from "@/lib/countries";
import { ageFromDob, minApplicantAge, maxApplicantAge } from "@/lib/capture";
import { submitInterest, requestApplicationLink } from "@/lib/actions";
import { useLanguage } from "../LanguageProvider";
import { Turnstile, TURNSTILE_SITE_KEY } from "../Turnstile";
import { CountryDropdown } from "./CountryDropdown";
import { DateField } from "./DateField";
import { Toast } from "./Toast";
import { ContinueButton } from "./ContinueButton";
import { FormRadioCard } from "./FormRadioCard";
import { FormCheckRow } from "./FormCheckRow";
import { FIELD, PLACEHOLDER } from "./fieldStyles";

type ToastKind = "interest" | "success" | "already" | "existing" | "link-sent" | "link-failed";

export type AboutData = {
  fullName: string;
  email: string;
  dob: string;
  track: "in_person" | "online";
  skills: string[];
  phone?: string;
  nationality?: string;
  basedIn?: string;
  canTravel?: boolean;
  hasValidPassport?: boolean;
  turnstileToken?: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GHANA = COUNTRIES.find((c) => c.name === "Ghana") ?? COUNTRIES[0];

export function AboutStep({
  onBack,
  onSubmit,
  submitting,
  error,
  skills,
  existing = false,
}: {
  onBack: () => void;
  onSubmit: (data: AboutData) => void;
  submitting: boolean;
  error: string | null;
  skills: string[];
  // The address has already applied: offer to email its owner a resume link.
  existing?: boolean;
}) {
  const { locale, setLocale } = useLanguage();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [dialCountry, setDialCountry] = useState<Country>(GHANA);
  const [mobile, setMobile] = useState("");
  const [nationality, setNationality] = useState<Country | null>(null);
  const [basedIn, setBasedIn] = useState<Country | null>(null);
  const [track, setTrack] = useState<"in_person" | "online" | null>(null);
  const [canTravel, setCanTravel] = useState(false);
  const [hasValidPassport, setHasValidPassport] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastKind | null>(null);
  const [interestBusy, setInterestBusy] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  // Turnstile tokens are single-use; remounting the widget issues a fresh one
  // before the next server call (the resend action after a failed submit).
  const [challengeKey, setChallengeKey] = useState(0);
  const [followup, setFollowup] = useState<"sent" | "failed" | "closed" | null>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (existing && !armed) {
    setArmed(true);
    setFollowup(null);
    setTurnstileToken(null);
    setChallengeKey((k) => k + 1);
  } else if (!existing && armed) {
    setArmed(false);
  }

  const resumeToast = followup === "closed" ? null
    : followup === "sent" ? "link-sent"
    : followup === "failed" ? "link-failed"
    : existing ? "existing"
    : null;
  const shown = resumeToast ?? toast;

  const valid =
    fullName.trim().length > 0 && EMAIL_RE.test(email.trim()) && /^\d{4}-\d{2}-\d{2}$/.test(dob);
  const travelReady =
    track === "online" || (track === "in_person" && canTravel && hasValidPassport);
  const turnstileReady = !TURNSTILE_SITE_KEY || Boolean(turnstileToken);
  const canSubmit = valid && travelReady && turnstileReady;

  const handleSubmit = () => {
    if (!canSubmit || submitting || !track) return;
    // Gate the 19-26 window here; outside it, offer to record interest instead
    // of applying. The server enforces the same bounds.
    const age = ageFromDob(dob);
    if (age < minApplicantAge() || age > maxApplicantAge()) {
      setToast("interest");
      return;
    }
    onSubmit({
      fullName: fullName.trim(),
      email: email.trim(),
      dob,
      track,
      skills,
      phone: mobile.trim() ? `${dialCountry.dial} ${mobile.trim()}` : undefined,
      nationality: nationality?.name,
      basedIn: basedIn?.name,
      canTravel: track === "in_person" ? canTravel : undefined,
      hasValidPassport: track === "in_person" ? hasValidPassport : undefined,
      turnstileToken,
    });
  };

  const handleInterested = async () => {
    if (interestBusy) return;
    setInterestBusy(true);
    try {
      const age = ageFromDob(dob);
      const res = await submitInterest({
        email: email.trim(),
        name: fullName.trim() || undefined,
        ageGroup: age < minApplicantAge() ? "under_19" : "19_plus",
        track: track ?? undefined,
        source: "apply_form",
        turnstileToken,
      });
      if (!res.ok) {
        setInterestBusy(false);
        return;
      }
      setToast(res.already ? "already" : "success");
      if (!res.already) window.setTimeout(() => router.push("/"), 3000);
    } catch (err) {
      console.error("[apply] interest failed", err);
      setInterestBusy(false);
    }
  };

  const handleResendLink = async () => {
    if (linkBusy || !turnstileReady) return;
    setLinkBusy(true);
    try {
      const res = await requestApplicationLink({ email: email.trim(), turnstileToken });
      setFollowup(res.ok ? "sent" : "failed");
    } catch (err) {
      console.error("[apply] resume link failed", err);
      setFollowup("failed");
    } finally {
      setLinkBusy(false);
      setTurnstileToken(null);
      setChallengeKey((k) => k + 1);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex h-dvh flex-col overflow-hidden bg-cream">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between px-4 py-2.5 desk:px-12 desk:py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="grid size-9 place-items-center rounded-full bg-white shadow-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/apply/arrow-left.svg" alt="" width={20} height={20} className="size-5" />
        </button>

        <div className="flex items-center rounded-full bg-white p-1">
          {(["en", "fr"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              aria-pressed={locale === code}
              className={`h-7 rounded-full px-3.5 text-[12px] font-semibold uppercase tracking-[0.04em] transition-colors ${
                locale === code ? "bg-black text-white" : "bg-transparent text-black/50"
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </header>

      {/* Card */}
      <main className="flex min-h-0 flex-1 items-center justify-center px-3 pb-2">
        <div className="flex max-h-full w-full max-w-[960px] flex-col overflow-hidden rounded-[36px] bg-white px-5 py-5 desk:rounded-[64px] desk:px-0 desk:py-8">
          <div className="mx-auto flex min-h-0 w-full max-w-[632px] flex-col overflow-y-auto">
            <h1 className="text-center text-[26px] leading-[0.9] tracking-[-1.04px] text-black desk:text-[48px] desk:tracking-[-1.92px]">
              More about you
            </h1>

            <div className="mt-5 flex flex-col gap-1.5 desk:mt-7 desk:gap-2">
              {/* Name + DOB */}
              <div className="flex flex-col gap-1.5 desk:flex-row desk:gap-2">
                <div className={`${FIELD} flex-1 pl-5 pr-6`}>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="*NAME"
                    aria-label="Full name"
                    className={`w-full bg-transparent text-[15px] text-black outline-none ${PLACEHOLDER}`}
                  />
                </div>
                <DateField value={dob} onChange={setDob} className="desk:w-[206px]" />
              </div>

              {/* Email + phone */}
              <div className="flex flex-col gap-1.5 desk:flex-row desk:gap-2">
                <div className={`${FIELD} flex-1 pl-5 pr-6`}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="*EMAIL"
                    aria-label="Email"
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
                    placeholder="MOBILE"
                    aria-label="Mobile number"
                    className={`w-full bg-transparent text-[15px] text-black outline-none ${PLACEHOLDER}`}
                  />
                </div>
              </div>

              {/* Nationality + based in */}
              <div className="flex flex-col gap-1.5 desk:flex-row desk:gap-2">
                <CountryDropdown variant="field" label="Nationality" value={nationality} onChange={setNationality} />
                <CountryDropdown variant="field" label="Currently based in" value={basedIn} onChange={setBasedIn} />
              </div>

              {/* Program radios */}
              <div className="mt-0.5 flex">
                <FormRadioCard label="Only program" selected={track === "online"} onSelect={() => setTrack("online")} />
                <FormRadioCard label="Travel to Antalya" selected={track === "in_person"} onSelect={() => setTrack("in_person")} />
              </div>

              {track === "in_person" ? (
                <div className="mt-6 flex flex-col gap-1.5 desk:mt-8 desk:gap-2">
                  <FormCheckRow
                    label="Can you travel out of the country you're located in"
                    checked={canTravel}
                    onToggle={() => setCanTravel((v) => !v)}
                  />
                  <FormCheckRow
                    label="Do you have a passport valid for six months after the dates of travel?"
                    checked={hasValidPassport}
                    onToggle={() => setHasValidPassport((v) => !v)}
                  />
                </div>
              ) : null}

              {error ? (
                <p role="alert" className="text-center text-[13px] text-magenta">
                  {error}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      {/* Continue / toasts */}
      <footer className="flex shrink-0 flex-col items-center gap-1.5 px-2.5 pb-2.5 pt-1">
        {shown === "interest" ? (
          <Toast
            variant="error"
            action={{ label: "I'm interested", onClick: handleInterested }}
            onClose={() => setToast(null)}
          >
            This program is only for 19-26 year old individuals. To stay updated
            on upcoming programs you&apos;ll be eligible for, click on the I&apos;m
            interested button.
          </Toast>
        ) : shown === "already" ? (
          <Toast variant="error" onClose={() => setToast(null)}>
            Your interest has already been recorded.
          </Toast>
        ) : shown === "success" ? (
          <Toast variant="success" onClose={() => setToast(null)}>
            Your interest has been recorded, stay tuned for future programs. We
            hope to see you very soon!
          </Toast>
        ) : shown === "existing" ? (
          <Toast
            variant="error"
            action={{ label: linkBusy ? "Sending…" : "Email me my link", onClick: handleResendLink }}
            onClose={() => setFollowup("closed")}
          >
            An application already exists for this email. We can send a
            single-use link to that address so you can continue where you left off.
          </Toast>
        ) : shown === "link-sent" ? (
          <Toast variant="success" onClose={() => setFollowup("closed")}>
            If that address has an application, a link to continue is on its way.
            It works once and expires in 30 minutes.
          </Toast>
        ) : shown === "link-failed" ? (
          <Toast variant="error" onClose={() => setFollowup("closed")}>
            We couldn&apos;t send the link just now. Please wait a moment and try again.
          </Toast>
        ) : null}

        <Turnstile key={challengeKey} onToken={setTurnstileToken} size="compact" />
        <ContinueButton
          label={submitting ? "One moment…" : "Continue"}
          disabled={!canSubmit || submitting || shown !== null}
          onClick={handleSubmit}
          className={shown ? "pointer-events-none opacity-60 blur-[6px]" : ""}
        />
      </footer>
    </div>,
    document.body,
  );
}
