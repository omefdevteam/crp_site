"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startApplication } from "@/lib/actions";
import { useLanguage } from "../LanguageProvider";
import { TermsStep } from "./TermsStep";
import { SkillsStep } from "./SkillsStep";
import { AboutStep, type AboutData } from "./AboutStep";
import { RedirectingStep } from "./RedirectingStep";

type Step = "terms" | "skills" | "about" | "redirecting" | "redirecting-home";

// Terms → skills → more about you → redirect into Round 1.
export function ApplyFlow({ onClose }: { onClose: () => void }) {
  const { locale } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState<Step>("terms");
  const [skills, setSkills] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState(false);

  const handleSubmit = async (data: AboutData) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setExisting(false);
    try {
      const result = await startApplication({ ...data, language: locale });
      if (!result.ok) {
        if (result.reason === "ineligible") {
          setStep("redirecting-home");
          window.setTimeout(() => router.push("/"), 2500);
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
            ? "Please complete the security check and try again."
            : result.reason === "rate_limited"
              ? "Too many attempts from this connection. Please wait a little while and try again."
            : "Please check your details and try again.",
        );
        setSubmitting(false);
        return;
      }
      setStep("redirecting");
      if (result.round1Url) {
        window.location.assign(result.round1Url);
      } else {
        // No form URL configured: the confirmation email carries the next step.
        window.setTimeout(() => router.push("/"), 2500);
      }
    } catch (err) {
      console.error("[apply] submit failed", err);
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (step === "terms") {
    return <TermsStep onAccept={() => setStep("skills")} onClose={onClose} />;
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
  if (step === "redirecting-home") {
    return <RedirectingStep message="Redirecting you to the homepage" />;
  }
  return <RedirectingStep message="Redirecting you to VideoAsk" />;
}
