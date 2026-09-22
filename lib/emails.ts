import type { Locale } from "@/lib/locale";

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
const SITE = process.env.APP_URL ?? "https://climaterefugeepavilion.vercel.app";
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

const pick = <T>(language: Locale, en: T, fr: T): T => (language === "fr" ? fr : en);

// Email-client-safe: table layout, inline styles, gradient button with a solid
// magenta fallback for clients that ignore CSS gradients (e.g. Outlook).
function render(language: Locale, bodyParas: string[], cta: Cta | null): string {
  const year = new Date().getUTCFullYear();
  const signoff = pick(
    language,
    "Best regards,<br />The Climate Refugee Pavilion team",
    "Cordialement,<br />L'équipe du Climate Refugee Pavilion",
  );
  const tagline = "Making climate mobility impossible to ignore";

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
          <p style="margin:12px 0 0;font-family:${FONT};font-size:11px;color:#666666">© ${year} Climate Refugee Pavilion. All rights reserved.</p>
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

export function applicationEmail(name: string, link: string | null, language: Locale): Email {
  const intro = pick(
    language,
    `Dear ${escapeHtml(name)},`,
    `Bonjour ${escapeHtml(name)},`,
  );
  const invite = pick(
    language,
    "Thanks for applying to the Youth Ambassador programme. Your first step is a short video interview.",
    "Merci d'avoir postulé au programme Jeunes Ambassadeurs. Votre première étape est un court entretien vidéo.",
  );
  const noLink = pick(
    language,
    "We'll be in touch with your next step shortly.",
    "Nous vous contacterons bientôt pour la prochaine étape.",
  );
  return {
    subject: pick(language, "We got your application", "Nous avons reçu votre candidature"),
    html: render(
      language,
      [intro, link ? invite : noLink],
      link ? { label: pick(language, "Start Round 1", "Commencer le tour 1"), url: link } : null,
    ),
  };
}

// Sent on request to someone who already applied. The link carries a single-use
// token that signs them in for a short while and returns their current step.
export function resumeEmail(name: string, link: string, language: Locale): Email {
  return {
    subject: pick(language, "Continue your application", "Reprenez votre candidature"),
    html: render(
      language,
      [
        pick(language, `Dear ${escapeHtml(name)},`, `Bonjour ${escapeHtml(name)},`),
        pick(
          language,
          "You asked for a link to continue your application. This link works once and expires in 30 minutes. If you did not request it, you can ignore this email.",
          "Vous avez demandé un lien pour reprendre votre candidature. Ce lien ne fonctionne qu'une fois et expire dans 30 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
        ),
      ],
      { label: pick(language, "Continue application", "Reprendre ma candidature"), url: link },
    ),
  };
}

export function identityEmail(name: string, link: string, language: Locale): Email {
  return {
    subject: pick(language, "Verify your identity", "Vérifiez votre identité"),
    html: render(
      language,
      [
        pick(language, `Dear ${escapeHtml(name)},`, `Bonjour ${escapeHtml(name)},`),
        pick(
          language,
          "One quick step: please verify your identity to continue your application. It takes about two minutes.",
          "Une étape rapide : veuillez vérifier votre identité pour poursuivre votre candidature. Cela prend environ deux minutes.",
        ),
      ],
      { label: pick(language, "Verify identity", "Vérifier mon identité"), url: link },
    ),
  };
}

export function decisionEmail(
  status: "rejected" | "interview_no" | "interview_yes",
  link: string | null,
  language: Locale,
): Email {
  switch (status) {
    case "rejected":
      return {
        subject: pick(language, "Update on your application", "Mise à jour de votre candidature"),
        html: render(
          language,
          [
            pick(language, "Dear applicant,", "Cher candidat,"),
            pick(
              language,
              "Thank you for applying. After careful review we won't be moving forward this time, but there are other ways to stay involved and we hope you'll keep in touch.",
              "Merci d'avoir postulé. Après un examen attentif, nous ne poursuivrons pas votre candidature cette fois-ci, mais il existe d'autres façons de rester impliqué et nous espérons garder le contact.",
            ),
          ],
          null,
        ),
      };
    case "interview_no":
      return {
        subject: pick(language, "Join us online", "Rejoignez-nous en ligne"),
        html: render(
          language,
          [
            pick(language, "Dear applicant,", "Cher candidat,"),
            pick(
              language,
              "Thank you for interviewing with us. We'd love to have you take part in the programme online, and we'll share how to join shortly.",
              "Merci d'avoir passé l'entretien. Nous serions ravis de vous compter parmi les participants en ligne, et nous vous expliquerons bientôt comment nous rejoindre.",
            ),
          ],
          null,
        ),
      };
    case "interview_yes":
      return {
        subject: pick(language, "You're through — next step", "Félicitations — prochaine étape"),
        html: render(
          language,
          [
            pick(language, "Congratulations!", "Félicitations !"),
            link
              ? pick(
                  language,
                  "You've progressed to the next stage. Please complete your travel documents to continue.",
                  "Vous êtes passé à l'étape suivante. Veuillez compléter vos documents de voyage pour continuer.",
                )
              : pick(
                  language,
                  "You've progressed to the next stage. We'll email your next step shortly.",
                  "Vous êtes passé à l'étape suivante. Nous vous enverrons bientôt la prochaine étape.",
                ),
          ],
          link ? { label: pick(language, "Continue", "Continuer"), url: link } : null,
        ),
      };
  }
}
