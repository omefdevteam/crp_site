"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ExpressInterestPopup } from "../ExpressInterestPopup";
import { ApplyFlow } from "../apply/ApplyFlow";
import { NominateFlow } from "../nominate/NominateFlow";
import { useApplyFlowEnabled } from "@/lib/applyFlowGate";
import { useLanguage } from "../LanguageProvider";
import { useText } from "@/lib/ui-text";
import { APPLY_DRAFT, NOMINATE_DRAFT } from "@/lib/formDraft";
import { useDraftOpen } from "@/lib/useFormDraft";

export const BAR =
  "gradient-brand pointer-events-auto flex w-full max-w-[632px] items-center justify-center rounded-full px-6 py-6 shadow-[0_0_5.45px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] active:scale-[0.98] desk:h-[80px] desk:px-8 desk:py-0 desk:shadow-[0_8px_28px_rgba(236,38,143,0.35)]";
export const LABEL =
  "text-[20px] font-medium leading-[0.9] tracking-[-0.8px] text-white desk:font-semibold desk:uppercase desk:tracking-[0.8px]";

/**
 * The /programs bottom bar, with its mode read from ?intent= in the browser.
 *
 * /programs is a prerendered (cached) page, so its HTML can't know the query
 * string. The cached HTML therefore holds the Suspense fallback below, which
 * never names a mode, and the real bar replaces it once the browser knows the
 * URL. That way the first paint can't say "Apply" on ?intent=nominate (or the
 * reverse).
 */
export function ProgramApplyBarFromUrl() {
  return (
    <Suspense fallback={<ProgramApplyBarPlaceholder />}>
      <ProgramApplyBarForIntent />
    </Suspense>
  );
}

function ProgramApplyBarForIntent() {
  const intent = useSearchParams().get("intent");
  return <ProgramApplyBar mode={intent === "nominate" ? "nominate" : "apply"} />;
}

// Production without the apply-flow flag: both modes say "Express interest",
// so the cached HTML can show it straight away. Everywhere else (previews, or
// the flag on) the label depends on the mode, so the placeholder keeps the
// button's size but shows no label until the real bar takes over. These are
// build-time constants, identical on the server and in the browser.
const ALWAYS_EXPRESS_INTEREST =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production" && process.env.NEXT_PUBLIC_ENABLE_APPLY_FLOW !== "true";

function ProgramApplyBarPlaceholder() {
  const { copy } = useLanguage();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-2 desk:p-[10px]">
      <button
        id="apply"
        type="button"
        disabled
        aria-busy={!ALWAYS_EXPRESS_INTEREST}
        aria-label={ALWAYS_EXPRESS_INTEREST ? copy.a11y.expressInterest : undefined}
        className={BAR}
      >
        <span className={ALWAYS_EXPRESS_INTEREST ? LABEL : `${LABEL} invisible`} aria-hidden={!ALWAYS_EXPRESS_INTEREST}>
          {copy.apply.interest}
        </span>
      </button>
    </div>
  );
}

/** Floating CTA pinned to the bottom of the viewport. */
export function ProgramApplyBar({ mode = "apply" }: { mode?: "apply" | "nominate" }) {
  const { copy } = useLanguage();
  const nominate = mode === "nominate";
  const applyFlow = useApplyFlowEnabled();
  // With the full flow, an open form (and its typed answers) survives a language switch.
  const [open, setOpen] = useDraftOpen(nominate ? NOMINATE_DRAFT : APPLY_DRAFT, applyFlow);
  const tr = useText();
  // Figma labels the bar "Apply" when it opens ApplyFlow; the production
  // ExpressInterestPopup path (and nominate mode) keep "Express interest".
  const applyLabel = applyFlow && !nominate;
  // Same gate, nominate mode: the bar opens NominateFlow, so it says "Nominate".
  const nominateLabel = applyFlow && nominate;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-2 desk:p-[10px]">
        <button
          id="apply"
          type="button"
          onClick={() => setOpen(true)}
          aria-label={applyLabel ? tr("Apply") : nominateLabel ? tr("Nominate") : copy.a11y.expressInterest}
          className={BAR}
        >
          <span className={LABEL}>
            {applyLabel ? tr("Apply") : nominateLabel ? tr("Nominate") : copy.apply.interest}
          </span>
        </button>
      </div>

      {applyFlow ? (
        open ? (
          nominate ? <NominateFlow onClose={() => setOpen(false)} /> : <ApplyFlow onClose={() => setOpen(false)} />
        ) : null
      ) : (
        <ExpressInterestPopup
          open={open}
          ageGroup="19_26"
          source={nominate ? "nominate_express_19_26" : "apply_express_19_26"}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
