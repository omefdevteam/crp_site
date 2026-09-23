import emailCopy from "@/lib/translations/application-emails.json";
import type { ApplicationLocale } from "@/lib/locale";

// Branded transactional email shell, matching the Figma email design
// (2141:2438): dark header with the wordmark, cream body, a pink→orange
// gradient CTA pill, and the black footer with the tagline.
//
// The COPY below is DEMO placeholder for testing — replace the strings with the
// team's final wording. The structure/params stay the same, so callers and the
// design don't change. Applicant-journey emails are localized; the
// top-of-funnel ones (waitlist, interest, nomination) are English for now.

export type Email = { subject: string; html: string };

type Cta = { label: string; url: string };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);
}

// Absolute so it resolves in an email client, not against a relative path.
const SITE = process.env.APP_URL ?? "https://www.climaterefugeepavilion.org";
const LOGO = `${SITE}/CRP_iDentity_Monochromatic-HWhite.png`;
const SWIRL = `${SITE}/images/sponsors-swirl.png`;
// Exact Figma header banner (photo scallops + logo), committed at
// public/emails/email-header.png. EMAIL_HEADER_URL overrides it if hosted
// elsewhere (e.g. a CDN once off Vercel).
const HEADER_IMG = process.env.EMAIL_HEADER_URL ?? `${SITE}/emails/email-header.png`;

const CREAM = "#f0eee6";
const INK = "#111111";
const MAGENTA = "#EC268F";
const ORANGE = "#FA8D2E";
const FONT = "Arial, Helvetica, sans-serif";

const pick = <T>(language: ApplicationLocale, en: T, fr: T, es: T): T => language === "fr" ? fr : language === "es" ? es : en;

// Email-client-safe: table layout, inline styles, gradient button with a solid
// magenta fallback for clients that ignore CSS gradients (e.g. Outlook).
function render(language: ApplicationLocale, bodyParas: string[], cta: Cta | null): string {
  const year = new Date().getUTCFullYear();
  const signoff = pick(
    language,
    "Best regards,<br />The Climate Refugee Pavilion team",
    "Cordialement,<br />L'équipe du Climate Refugee Pavilion",
    "Un cordial saludo,<br />El equipo del Climate Refugee Pavilion",
  );
  const tagline = pick(language, "Making climate mobility impossible to ignore", "Rendre la mobilité climatique impossible à ignorer", "Hacer que la movilidad climática sea imposible de ignorar");
  const rights = pick(language, "All rights reserved.", "Tous droits réservés.", "Todos los derechos reservados.");

  const paras = [...bodyParas, signoff]
    .map(
      (p) =>
        `<p style="margin:0 0 18px;font-family:${FONT};font-size:16px;line-height:1.6;color:${INK}">${p}</p>`,
    )
    .join("");

  const header = HEADER_IMG
    ? `<tr><td style="padding:0;background:#0b1020" align="center">
         <a href="${SITE}" style="display:block;text-decoration:none">
           <img src="${HEADER_IMG}" alt="Climate Refugee Pavilion" width="600" style="width:100%;max-width:600px;height:auto;display:block;border:0;outline:none" />
         </a>
       </td></tr>`
    : `<tr><td style="background:#0b1020;padding:26px 32px" align="left">
         <a href="${SITE}" style="display:inline-block;text-decoration:none">
           <img src="${LOGO}" alt="Climate Refugee Pavilion" height="40" style="height:40px;width:auto;display:block;border:0;outline:none" />
         </a>
       </td></tr>`;

  // Bulletproof button: Outlook (Word engine) ignores gradients and
  // border-radius, so it gets a VML rounded rect filled solid magenta; every
  // other client gets the gradient pill.
  const button = cta
    ? `<tr><td align="center" style="background:${CREAM};padding:16px 32px 44px">
         <!--[if mso]>
         <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${cta.url}" style="height:52px;v-text-anchor:middle;width:260px;" arcsize="50%" fillcolor="${MAGENTA}" strokecolor="${MAGENTA}">
           <w:anchorlock/>
           <center style="color:#ffffff;font-family:${FONT};font-size:15px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">${cta.label}</center>
         </v:roundrect>
         <![endif]-->
         <!--[if !mso]><!-- -->
         <a href="${cta.url}" style="display:inline-block;background:${MAGENTA};background:linear-gradient(90deg,${MAGENTA} 0%,${ORANGE} 100%);color:#ffffff;text-decoration:none;font-family:${FONT};font-size:15px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;padding:17px 52px;border-radius:999px">${cta.label}</a>
         <!--<![endif]-->
       </td></tr>`
    : "";

  return `<!doctype html>
<html lang="${language}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="color-scheme" content="light only" /></head>
<body style="margin:0;padding:0;background:${CREAM}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${CREAM}">
    <tr><td align="center" style="padding:0">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;border-collapse:collapse">
        ${header}
        <tr><td style="background:${CREAM};padding:44px 32px 8px">
          ${paras}
        </td></tr>
        ${button}
        <tr><td background="${SWIRL}" bgcolor="#000000" style="background:#000000;background-image:url('${SWIRL}');background-position:right center;background-repeat:no-repeat;background-size:auto 150%;padding:34px 32px;text-align:center" align="center">
          <p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.4;letter-spacing:1px;text-transform:uppercase;color:#8a8a8a">${tagline}</p>
          <p style="margin:12px 0 0;font-family:${FONT};font-size:11px;color:#666666">© ${year} Climate Refugee Pavilion. ${rights}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function waitlistEmail(): Email {
  return {
    subject: "You're on the list",
    html: render(
      "en",
      ["Dear friend,", "Thanks for signing up. We'll email you with updates about the Climate Refugee Pavilion."],
      null,
    ),
  };
}

export function interestEmail(): Email {
  return {
    subject: "Thanks for your interest",
    html: render(
      "en",
      ["Dear friend,", "Thanks for expressing interest in the programme. We'll be in touch as opportunities open up for your group."],
      null,
    ),
  };
}

export function nominationEmail(nomineeName: string): Email {
  return {
    subject: "Thanks for your nomination",
    html: render(
      "en",
      ["Dear friend,", `Thanks for nominating ${escapeHtml(nomineeName)}. We'll reach out to them with the next steps.`],
      null,
    ),
  };
}

export function applicationEmail(name: string, link: string | null, language: ApplicationLocale): Email {
  const copy = emailCopy[language];
  return { subject: copy.applicationSubject, html: render(language, [copy.greeting.replace("{name}", escapeHtml(name)), link ? copy.confirm : copy.waiting], link ? { label: copy.confirmButton, url: link } : null) };
}
export function resumeEmail(name: string, link: string, language: ApplicationLocale): Email {
  const copy = emailCopy[language];
  return { subject: copy.resumeSubject, html: render(language, [copy.greeting.replace("{name}", escapeHtml(name)), copy.resume], { label: copy.continue, url: link }) };
}
export function identityEmail(name: string, link: string, language: ApplicationLocale): Email {
  const copy = emailCopy[language];
  return { subject: copy.identitySubject, html: render(language, [copy.greeting.replace("{name}", escapeHtml(name)), copy.identity], { label: copy.identityButton, url: link }) };
}
export function decisionEmail(status: "rejected" | "interview_no" | "interview_yes", link: string | null, language: ApplicationLocale): Email {
  const copy = emailCopy[language];
  if (status === "rejected") return { subject: copy.rejectedSubject, html: render(language, [copy.applicant, copy.rejected], null) };
  if (status === "interview_no") return { subject: copy.onlineSubject, html: render(language, [copy.applicant, copy.online], null) };
  return { subject: copy.nextSubject, html: render(language, [copy.congratulations, link ? copy.documents : copy.next], link ? { label: copy.continue, url: link } : null) };
}

export function captureConfirmationEmail(link: string, kind: "waitlist" | "interest"): Email {
  return { subject: "Confirm your email request", html: render("en", [
    kind === "waitlist" ? "Confirm that you want to subscribe to Pavilion updates." : "Confirm that you want to save the interests you submitted to Pavilion.",
    "The link expires in 30 minutes. If you did not request this change, ignore this email; your existing preferences will stay unchanged.",
  ], { label: "Confirm request", url: link }) };
}
