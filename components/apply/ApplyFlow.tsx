"use client";

import { useText } from "@/lib/ui-text";

import { localePath } from "@/lib/locale";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { startApplication } from "@/lib/actions";
import { useLanguage } from "../LanguageProvider";
import { TermsStep } from "./TermsStep";
import { SkillsStep } from "./SkillsStep";
import { AboutStep, type AboutData } from "./AboutStep";
import { RedirectingStep } from "./RedirectingStep";

type Step = "terms" | "skills" | "about" | "redirecting" | "redirecting-home" | "check-email";

// Terms → skills → application details → email ownership confirmation.
export function ApplyFlow({ onClose }: { onClose: () => void }) {
  const tr = useText();
  const { locale } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState<Step>("terms");
  const [skills, setSkills] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState(false);
  const [consent, setConsent] = useState(false);

  const handleSubmit = async (data: AboutData) => {
    if (submitting || !consent) return;
    setSubmitting(true);
    setError(null);
    setExisting(false);
    try {
      const result = await startApplication({ ...data, consent, language: data.language });
      if (!result.ok) {
        if (result.reason === "ineligible") {
          setStep("redirecting-home");
          window.setTimeout(() => router.push(localePath("/", locale)), 2500);
          return;
        }
        if (result.reason === "existing") {
          // Knowing the address proves nothing; offer to email the owner a
          // single-use link instead of showing them anything.
          setExisting(true);
          setSubmitting(false);
          return;
        }
        setError(
          result.reason === "turnstile"
            ? tr("Please complete the security check and try again.")
            : result.reason === "rate_limited"
              ? tr("Too many attempts from this connection. Please wait a little while and try again.")
            : tr("Please check your details and try again."),
        );
        setSubmitting(false);
        return;
      }
      setStep("check-email");
    } catch (err) {
      console.error("[apply] submit failed", err);
      setError(tr("Something went wrong. Please try again."));
      setSubmitting(false);
    }
  };

  if (step === "terms") {
    return <TermsStep onAccept={() => { setConsent(true); setStep("skills"); }} onClose={onClose} />;
  }
  if (step === "skills") {
    return (
      <SkillsStep
        selected={skills}
        onChange={setSkills}
        onBack={() => setStep("terms")}
        onContinue={() => setStep("about")}
      />
    );
  }
  if (step === "about") {
    return (
      <AboutStep
        skills={skills}
        onBack={() => setStep("skills")}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
        existing={existing}
      />
    );
  }
  if (step === "check-email") {
    return <RedirectingStep message={tr("Check your email to confirm your address and begin.")} onClose={onClose} />;
  }
  if (step === "redirecting-home") {
    return <RedirectingStep message={tr("Redirecting you to the homepage")} />;
  }
  return <RedirectingStep message={tr("Redirecting you to VideoAsk")} />;
}
