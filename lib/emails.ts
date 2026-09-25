import emailCopy from "@/lib/translations/application-emails.json";
import type { ApplicationLocale } from "@/lib/locale";

// Branded transactional email shell, matching the Figma email frames
// (2237:16463 desktop, 2237:16490 mobile): scalloped photo header, cream body,
// a pink→orange gradient CTA pill, and a black footer with the swirl.
//
// Applicant-journey emails are localized; the top-of-funnel ones (waitlist,
// interest, nomination) are English for now.

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
const BANNER = process.env.EMAIL_HEADER_URL ?? `${SITE}/emails/email-banner-desktop.png`;
const SWIRL = `${SITE}/emails/email-footer-swirl.png`;

const CREAM = "#f4f1ea";
const INK = "#111111";
const MAGENTA = "#EC268F";
const ORANGE = "#FA8D2E";
const FONT = "Outfit, Arial, Helvetica, sans-serif";

const pick = <T>(language: ApplicationLocale, en: T, fr: T, es: T): T => language === "fr" ? fr : language === "es" ? es : en;

// Email-client-safe: table layout, inline styles, gradient button with a solid
// magenta fallback for clients that ignore CSS gradients (e.g. Outlook).
function render(language: ApplicationLocale, bodyParas: string[], cta: Cta | null): string {
  const year = new Date().getUTCFullYear();
  const signoff = pick(
    language,
    "Best regards,<br />The Climate Refugee Pavilion Team",
    "Cordialement,<br />L'équipe du Climate Refugee Pavilion",
    "Un cordial saludo,<br />El equipo del Climate Refugee Pavilion",
  );
  const tagline = pick(language, "Making climate mobility impossible to ignore", "Rendre la mobilité climatique impossible à ignorer", "Hacer que la movilidad climática sea imposible de ignorar");
  const rights = pick(language, "All rights reserved.", "Tous droits réservés.", "Todos los derechos reservados.");

  const paras = [...bodyParas, signoff]
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-family:${FONT};font-size:14px;line-height:1.2;letter-spacing:-0.56px;color:${INK}">${p}</p>`,
    )
    .join("");

  const button = cta
    ? `<table role="presentation" class="btn" align="center" width="240" cellpadding="0" cellspacing="0" style="width:240px;margin-top:32px;border-collapse:collapse">
         <tr><td align="center" bgcolor="${MAGENTA}" style="border-radius:500px;background:${MAGENTA};background-image:linear-gradient(90deg,${MAGENTA} 0%,${ORANGE} 100%)">
           <!--[if mso]>
           <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${cta.url}" style="height:45px;v-text-anchor:middle;width:240px;" arcsize="50%" fillcolor="${MAGENTA}" strokecolor="${MAGENTA}">
             <w:anchorlock/>
             <center style="color:#ffffff;font-family:${FONT};font-size:14px;font-weight:bold;letter-spacing:0.56px;text-transform:uppercase;">${cta.label}</center>
           </v:roundrect>
           <![endif]-->
           <!--[if !mso]><!-- -->
           <a class="btn-link" href="${cta.url}" style="display:block;padding:16px 28px;color:#ffffff;text-decoration:none;font-family:${FONT};font-size:14px;font-weight:600;line-height:0.9;letter-spacing:0.56px;text-transform:uppercase">${cta.label}</a>
           <!--<![endif]-->
         </td></tr>
       </table>`
    : "";

  return `<!doctype html>
<html lang="${language}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="color-scheme" content="light only" />
<style>
  @media only screen and (max-width:480px){
    .shell{width:100%!important}
    .header-pad{padding:44px 16px!important;text-align:center!important}
    .logo{margin:0 auto!important}
    .body-pad{padding:32px!important}
    .btn,.btn-link{width:100%!important}
    .btn{margin-top:16px!important}
  }
</style></head>
<body style="margin:0;padding:0;background:${CREAM}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${CREAM}">
    <tr><td align="center" style="padding:0">
      <table role="presentation" class="shell" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;border-collapse:collapse">
        <tr><td class="header-pad" height="120" valign="middle" background="${BANNER}" bgcolor="${CREAM}" style="height:120px;padding:44px 76px;background-color:${CREAM};background-image:url('${BANNER}');background-repeat:no-repeat;background-position:center center;background-size:cover">
          <a href="${SITE}" style="text-decoration:none">
            <img class="logo" src="${LOGO}" alt="Climate Refugee Pavilion" width="87" height="31" style="display:block;width:87px;height:31px;border:0;outline:none" />
          </a>
        </td></tr>
        <tr><td class="body-pad" style="background:${CREAM};padding:64px">
          ${paras}
          ${button}
        </td></tr>
        <tr><td background="${SWIRL}" bgcolor="#000000" height="120" valign="middle" align="center" style="height:120px;background-color:#000000;background-image:url('${SWIRL}');background-repeat:no-repeat;background-position:right center;background-size:auto 120px;border-radius:32px 32px 0 0;padding:24px 24px 16px;text-align:center">
          <p style="margin:0;font-family:${FONT};font-size:12px;font-weight:600;line-height:1.2;letter-spacing:0.48px;text-transform:uppercase;color:rgba(255,255,255,0.48)">${tagline}</p>
          <p style="margin:18px 0 0;font-family:${FONT};font-size:8px;line-height:1.2;color:#ffffff">© ${year} Climate Refugee Pavilion. ${rights}</p>
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
