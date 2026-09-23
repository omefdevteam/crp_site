"use client";

import {
  type FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { startApplication } from "@/lib/actions";
import { Turnstile } from "./Turnstile";
import type { ApplicationLocale } from "@/lib/locale";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The popup is where the applicant picks their language, so its own labels are
// self-contained here (keyed by the toggle) rather than the site-wide copy.
const T: Record<ApplicationLocale, Record<string, string>> = {
  en: {
    title: "Apply",
    language: "Language",
    name: "Full name",
    email: "Email",
    dob: "Date of birth",
    submit: "Continue",
    sending: "One moment…",
    redirecting: "Taking you to your application…",
    invalid: "Please check your name, email, and date of birth.",
    turnstile: "Please complete the security check and try again.",
    ineligible: "You must be 19 or older to apply.",
    error: "Something went wrong. Please try again.",
    existing: "You have already applied. Please use the link in your original confirmation email to continue.",
    close: "Close",
    sent: "Check your email for the next step.",
  },
  es: {"title": "Presentar solicitud", "language": "Idioma", "name": "Nombre completo", "email": "Correo electrónico", "dob": "Fecha de nacimiento", "submit": "Continuar", "sending": "Un momento…", "redirecting": "Abriendo tu solicitud…", "invalid": "Revisa tu nombre, correo y fecha de nacimiento.", "turnstile": "Completa la verificación de seguridad y vuelve a intentarlo.", "ineligible": "Debes tener entre 19 y 26 años para presentar una solicitud.", "error": "Se ha producido un error. Vuelve a intentarlo.", "existing": "Ya has presentado una solicitud. Solicita un enlace nuevo para continuar.", "close": "Cerrar", "sent": "Revisa tu correo para confirmar tu dirección."},
  fr: {
    title: "Postuler",
    language: "Langue",
    name: "Nom complet",
    email: "E-mail",
    dob: "Date de naissance",
    submit: "Continuer",
    sending: "Un instant…",
    redirecting: "Redirection vers votre candidature…",
    invalid: "Veuillez vérifier votre nom, e-mail et date de naissance.",
    turnstile: "Veuillez compléter la vérification de sécurité et réessayer.",
    ineligible: "Vous devez avoir 19 ans ou plus pour postuler.",
    error: "Une erreur s'est produite. Veuillez réessayer.",
    existing: "Vous avez déjà postulé. Pour continuer, utilisez le lien dans votre e-mail de confirmation initial.",
    close: "Fermer",
    sent: "Consultez votre e-mail pour la prochaine étape.",
  },
};

type Phase = "idle" | "submitting" | "invalid" | "turnstile" | "ineligible" | "existing" | "error" | "sent";

type ApplyPopupProps = {
  // Mounted only while open, so each open starts from these fresh initializers.
  initialLanguage: ApplicationLocale;
  onClose: () => void;
};

export function ApplyPopup({ initialLanguage, onClose }: ApplyPopupProps) {
  const titleId = useId();
  const nameId = useId();
  const emailId = useId();
  const dobId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  const [language, setLanguage] = useState<ApplicationLocale>(initialLanguage);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  const t = T[language];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phase === "submitting" || !consent) return;
    if (!fullName.trim() || !EMAIL_RE.test(email.trim()) || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      setPhase("invalid");
      return;
    }

    setPhase("submitting");
    try {
      const result = await startApplication({
        fullName: fullName.trim(),
        email: email.trim(),
        dob,
        language,
        consent,
        turnstileToken,
      });
      if (!result.ok) {
        setPhase(
          result.reason === "ineligible"
            ? "ineligible"
            : result.reason === "turnstile"
              ? "turnstile"
              : result.reason === "existing"
                ? "existing"
              : "invalid",
        );
        return;
      }
      // The mailbox owner must confirm before continuing to VideoAsk.
      setPhase("sent");
    } catch (err) {
      console.error("[apply] submit failed", err);
      setPhase("error");
    }
  };

  const busy = phase === "submitting";
  const notice =
    phase === "invalid"
      ? t.invalid
      : phase === "turnstile"
        ? t.turnstile
        : phase === "ineligible"
          ? t.ineligible
          : phase === "error"
            ? t.error
            : phase === "existing"
              ? t.existing
            : null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t.close}
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex w-full max-w-[440px] flex-col gap-5 rounded-[32px] bg-ink p-6 text-white desk:p-8"
      >
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="text-[28px] leading-[0.9] tracking-[-0.04em]">
            {t.title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
              <path
                d="M5.5 5.5l13 13M18.5 5.5l-13 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {phase === "sent" ? (
          <p className="py-6 text-center text-[18px] leading-[1.2] text-white/90">
            {t.sent}
          </p>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/50">
                {t.language}
              </span>
              <div className="flex gap-2" role="group" aria-label={t.language}>
                {(["en", "fr", "es"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={language === code}
                    onClick={() => setLanguage(code)}
                    className={`h-11 flex-1 rounded-full text-[15px] font-semibold uppercase tracking-[0.06em] transition-colors ${
                      language === code
                        ? "bg-lime text-black"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {code === "en" ? "English" : "Français"}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/50">
                {t.name}
              </span>
              <input
                id={nameId}
                type="text"
                name="name"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 rounded-xl bg-white px-4 text-[16px] text-black outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/50">
                {t.email}
              </span>
              <input
                id={emailId}
                type="email"
                name="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl bg-white px-4 text-[16px] text-black outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/50">
                {t.dob}
              </span>
              <input
                id={dobId}
                type="date"
                name="dob"
                value={dob}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDob(e.target.value)}
                className="h-12 rounded-xl bg-white px-4 text-[16px] text-black outline-none"
              />
            </label>

            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
              {language === "es" ? "Acepto el tratamiento de mis datos para mi solicitud." : language === "fr" ? "J’accepte le traitement de mes données pour ma candidature." : "I consent to my data being processed for my application."}
            </label>
            <Turnstile onToken={setTurnstileToken} />

            {notice ? (
              <p role="alert" className="text-[14px] leading-[1.3] text-[#FF9BC7]">
                {notice}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy || !consent}
              className="gradient-brand mt-1 flex h-12 items-center justify-center rounded-full text-[16px] font-semibold uppercase tracking-[0.06em] text-white disabled:opacity-70"
            >
              {busy ? t.sending : t.submit}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
