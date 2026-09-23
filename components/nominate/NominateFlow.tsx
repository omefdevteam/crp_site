"use client";

import { useText } from "@/lib/ui-text";

import { useLanguage } from "../LanguageProvider";
import { localePath } from "@/lib/locale";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitNomination } from "@/lib/actions";
import { NomineeStep, type NomineeData } from "./NomineeStep";
import { NominatorStep, type NominatorData } from "./NominatorStep";
import { ThanksStep } from "./ThanksStep";

type Step = "nominee" | "nominator" | "thanks";

// Multi-step nomination: About the nominee → About you → Thank you.
export function NominateFlow({ onClose }: { onClose: () => void }) {
  const tr = useText();
  const router = useRouter();
  const { locale } = useLanguage();
  const [step, setStep] = useState<Step>("nominee");
  const [nominee, setNominee] = useState<NomineeData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNominatorSubmit = async (data: NominatorData) => {
    if (!nominee || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitNomination({
        ...nominee,
        ...data,
      });
      if (!res.ok) {
        setError(tr("Please check your details and try again."));
        setSubmitting(false);
        return;
      }
      setStep("thanks");
    } catch (err) {
      console.error("[nominate] submit failed", err);
      setError(tr("Something went wrong. Please try again."));
      setSubmitting(false);
    }
  };

  const handleExit = () => {
    onClose();
    router.push(localePath("/", locale));
  };

  if (step === "thanks") {
    return <ThanksStep onExit={handleExit} />;
  }

  if (step === "nominator") {
    return (
      <NominatorStep
        onBack={() => setStep("nominee")}
        onSubmit={handleNominatorSubmit}
        submitting={submitting}
        error={error}
      />
    );
  }

  return (
    <NomineeStep
      onBack={onClose}
      initial={nominee ?? undefined}
      onContinue={(data) => {
        setNominee(data);
        setStep("nominator");
      }}
    />
  );
}
