import emailCopy from "@/lib/translations/application-emails.json";
import ackCopy from "@/lib/translations/acknowledgement-emails.json";
import { JSON_EMAILS, type EmailSources } from "@/lib/copy/sources";
import { appUrl } from "@/lib/config";
import { parseLocale, type ApplicationLocale, type Locale } from "@/lib/locale";

export const DECISION_PREVIEW_TOKEN = "00000000-0000-4000-8000-000000000000";

type DecisionStatus = "rejected" | "online_offered" | "accepted" | "interview_yes";

export function decisionLink(
  status: DecisionStatus,
  choice: { language: "en" | "fr" | "es"; switchToken: string | null; calendly: string | null },
): string | null {
  if (status === "online_offered" && choice.switchToken) {
    return `${appUrl()}/api/apply/switch-online?token=${encodeURIComponent(choice.switchToken)}&lang=${choice.language}`;
  }
  if (status === "accepted") return choice.calendly;
  return null;
}

export function previewDecisionEmail(
  status: DecisionStatus,
  applicant: { language: "en" | "fr" | "es" },
  sources: EmailSources,
  calendly: string | null,
): Email {
  const link = decisionLink(status, {
    language: applicant.language,
    switchToken: status === "online_offered" ? DECISION_PREVIEW_TOKEN : null,
    calendly,
  });
  return decisionEmail(status, link, applicant.language, sources);
}

// Branded transactional email shell, matching the Figma email frames
// (2308:7356 desktop, 2308:7383 mobile): scalloped photo header, cream body,
// a pink→orange gradient CTA pill, and a black footer with the swirl.
//
// Applicant-journey emails follow the application language (en/fr/es); the
// form acknowledgements (waitlist, interest, nomination, partner) follow the
// site language at submission (en/fr/es/pt), falling back to English.

export type Email = { subject: string; html: string };

type Cta = { label: string; url: string };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);
}

// Absolute so it resolves in an email client, not against a relative path.
const SITE = (process.env.APP_URL ?? "https://www.climaterefugeepavilion.org").replace(/\/+$/, "");
const LOGO = `${SITE}/emails/email-logo.png`;
const BANNER = process.env.EMAIL_HEADER_URL ?? `${SITE}/emails/email-banner-desktop.png`;
const SWIRL = `${SITE}/emails/email-footer-swirl.png`;
const SWIRL_MOBILE = `${SITE}/emails/email-footer-swirl-mobile.png`;

const CREAM = "#f4f1ea";
const INK = "#000000";
const MAGENTA = "#EC268F";
const ORANGE = "#FA8D2E";
const FONT = "Outfit, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const SMALL_FONT = "Geist, 'Helvetica Neue', Helvetica, Arial, sans-serif";
// Figma's button fill is a radial gradient anchored near the bottom-right
// (orange) fading out to magenta. Clients that drop radial-gradient keep the
// linear declaration before it; Outlook desktop gets the VML gradient fill.
const LINEAR = `linear-gradient(90deg,${MAGENTA} 0%,${ORANGE} 100%)`;
const RADIAL = `radial-gradient(194px 181px at 93.8% 83.4%,${ORANGE} 0%,#F77346 25%,#F35A5E 50%,#F04077 75%,${MAGENTA} 100%)`;

// Email-client-safe: table layout, inline styles, progressive gradient
// fallbacks (solid bgcolor → linear → radial; VML for Outlook desktop).
// Geometry follows Figma 2308:7356 (600px desktop) and 2308:7383 (320px mobile).
// A body block is a plain paragraph (string), or one of the few structured
// pieces the applicant confirmation email needs. Every string in a block is
// already HTML-safe (see appText/appLine); render only adds markup around it.
type Block =
  | string
  | { readonly kind: "heading"; readonly text: string }
  | { readonly kind: "lead"; readonly lead: string; readonly text: string }
  | { readonly kind: "list"; readonly items: readonly string[] };

const TEXT_STYLE = `font-family:${FONT};font-size:14px;font-weight:400;line-height:1.2;letter-spacing:-0.56px;color:${INK}`;

function renderBlock(block: Block, bottom: number): string {
  if (typeof block === "string") {
    return `<p style="margin:0 0 ${bottom}px;${TEXT_STYLE}">${block}</p>`;
  }
  if (block.kind === "heading") {
    return `<p style="margin:0 0 ${bottom}px;font-family:${FONT};font-size:14px;font-weight:600;line-height:1.2;letter-spacing:0.56px;text-transform:uppercase;color:${INK}">${block.text}</p>`;
  }
  if (block.kind === "lead") {
    return `<p style="margin:0 0 ${bottom}px;${TEXT_STYLE}"><strong style="font-weight:600">${block.lead}</strong> ${block.text}</p>`;
  }
  // A table, not <ul>: Outlook and Gmail disagree on list indents and bullets.
  const rows = block.items
    .map(
      (item, i, all) =>
        `<tr><td width="18" valign="top" style="width:18px;padding:0 0 ${i === all.length - 1 ? 0 : 6}px;font-family:${FONT};font-size:14px;font-weight:600;line-height:1.2;color:${MAGENTA}">&#8226;</td><td valign="top" style="padding:0 0 ${i === all.length - 1 ? 0 : 6}px;${TEXT_STYLE}">${item}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 ${bottom}px">${rows}</table>`;
}

function render(language: Locale, bodyParas: Block[], cta: Cta | null, shell: { signoff: string; tagline: string; rights: string }, after: readonly string[] = []): string {
  const year = new Date().getUTCFullYear();
  const { signoff, tagline, rights } = shell;

  // Figma separates paragraphs with an empty 14px/1.2 line (16.8px). A line
  // that introduces a list sits closer to it.
  const paras = [...bodyParas, signoff]
    .map((p, i, all) => {
      const next = all[i + 1];
      const bottom = i === all.length - 1 ? 0 : typeof next !== "string" && next?.kind === "list" ? 10 : 17;
      return renderBlock(p, bottom);
    })
    .join("");

  // Small, muted lines under the button (e.g. "If you did not apply...").
  const footnotes = after
    .map((p) => `<p style="margin:32px 0 0;font-family:${FONT};font-size:12px;font-weight:400;line-height:1.3;letter-spacing:-0.24px;color:#6b6b6b">${p}</p>`)
    .join("");

  const button = cta
    ? `<table role="presentation" class="btn" align="center" width="240" cellpadding="0" cellspacing="0" border="0" style="width:240px;margin:48px auto 0;border-collapse:separate">
         <tr><td class="btn-cell" align="center" height="45" bgcolor="${MAGENTA}" style="height:45px;border-radius:500px;background-color:${MAGENTA};background-image:${LINEAR};background-image:${RADIAL};mso-padding-alt:0">
           <!--[if mso]>
           <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${cta.url}" style="height:45px;v-text-anchor:middle;width:240px;" arcsize="50%" stroked="f" fillcolor="${MAGENTA}">
             <v:fill type="gradient" color="${MAGENTA}" color2="${ORANGE}" angle="90" />
             <w:anchorlock/>
             <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.56px;text-transform:uppercase;">${cta.label}</center>
           </v:roundrect>
           <![endif]-->
           <!--[if !mso]><!-- -->
           <a class="btn-link" href="${cta.url}" style="display:block;box-sizing:border-box;width:240px;padding:16px 28px;border-radius:500px;color:#ffffff;text-decoration:none;text-align:center;font-family:${FONT};font-size:14px;font-weight:600;line-height:13px;mso-line-height-rule:exactly;letter-spacing:0.56px;text-transform:uppercase">${cta.label}</a>
           <!--<![endif]-->
         </td></tr>
       </table>`
    : "";

  return `<!doctype html>
<html lang="${language}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="color-scheme" content="light only" /><meta name="supported-color-schemes" content="light" />
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600&amp;family=Geist:wght@400&amp;display=swap" rel="stylesheet" />
<style>
  body{margin:0!important;padding:0!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  @media only screen and (max-width:480px){
    .shell{width:100%!important;max-width:320px!important}
    .header-pad{padding:44px 16px!important;text-align:center!important;background-position:-200px 0!important}
    .logo{margin:0 auto!important}
    .body-pad{padding:32px!important}
    .btn{width:100%!important;margin-top:32px!important}
    .btn-link{width:100%!important}
    .footer{background-image:url('${SWIRL_MOBILE}')!important;padding-top:46px!important}
    .tagline{line-height:1.2!important;max-width:207px!important}
    .copy{margin-top:20px!important}
  }
</style></head>
<body style="margin:0;padding:0;background:${CREAM}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CREAM}" style="border-collapse:collapse;background:${CREAM}">
    <tr><td align="center" style="padding:0">
      <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table role="presentation" class="shell" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;border-collapse:collapse">
        <tr><td class="header-pad" height="120" valign="middle" background="${BANNER}" bgcolor="${CREAM}" style="height:120px;box-sizing:border-box;padding:44px 80px 45px 76px;background-color:${CREAM};background-image:url('${BANNER}');background-repeat:no-repeat;background-position:-60px 0;background-size:720px 120px">
          <!--[if gte mso 9]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:120px;"><v:fill type="frame" src="${BANNER}" color="${CREAM}" /><v:textbox inset="76px,44px,0,0"><![endif]-->
          <a href="${SITE}" style="text-decoration:none;display:inline-block">
            <img class="logo" src="${LOGO}" alt="Climate Refugee Pavilion" width="88" height="31" style="display:block;width:88px;height:31px;border:0;outline:none" />
          </a>
          <!--[if gte mso 9]></v:textbox></v:rect><![endif]-->
        </td></tr>
        <tr><td class="body-pad" bgcolor="${CREAM}" style="background:${CREAM};padding:64px">
          ${paras}
          ${button}${footnotes}
        </td></tr>
        <tr><td class="footer" background="${SWIRL}" bgcolor="#000000" height="120" valign="top" align="center" style="height:120px;box-sizing:border-box;background-color:#000000;background-image:url('${SWIRL}');background-repeat:no-repeat;background-position:right top;background-size:auto 120px;border-radius:32px 32px 0 0;padding:55px 16px 0;text-align:center">
          <p class="tagline" style="margin:0 auto;font-family:${FONT};font-size:12px;font-weight:600;line-height:0.9;letter-spacing:0.48px;text-transform:uppercase;color:#ffffff;color:rgba(255,255,255,0.48)">${tagline}</p>
          <p class="copy" style="margin:29px 0 0;font-family:${SMALL_FONT};font-size:8px;line-height:10px;color:#ffffff">© ${year} Climate Refugee Pavilion. ${rights}</p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body></html>`;
}

// Bundled strings stay trusted HTML. An override is escaped, and its newlines
// become breaks, because the editor stores the readable form.
function piece(bundled: string, bag: Readonly<Record<string, string>> | undefined, key: string, format: "subject" | "body"): string {
  if (!bag || !Object.hasOwn(bag, key)) return bundled;
  const value = bag[key] ?? "";
  if (format === "subject") return value.replace(/[\r\n]/g, "");
  return escapeHtml(value).replaceAll("\n", "<br />");
}

function sourcesOf(sources: EmailSources | undefined): EmailSources {
  return sources ?? JSON_EMAILS;
}

function shellFor(locale: Locale, sources: EmailSources | undefined) {
  const bundled = ackCopy[locale];
  const bag = sourcesOf(sources).ack[locale];
  return {
    signoff: piece(bundled.signoff, bag, "signoff", "body"),
    tagline: piece(bundled.tagline, bag, "tagline", "body"),
    rights: piece(bundled.rights, bag, "rights", "body"),
  };
}

function ackLine(locale: string | null | undefined, sources: EmailSources | undefined, key: keyof (typeof ackCopy)["en"], format: "subject" | "body"): string {
  const language = parseLocale(locale);
  return piece(ackCopy[language][key], sourcesOf(sources).ack[language], key, format);
}

type AppKey = keyof (typeof emailCopy)["en"];

function appLine(language: ApplicationLocale, sources: EmailSources | undefined, key: AppKey, format: "subject" | "body"): string {
  return piece(emailCopy[language][key], sourcesOf(sources).app[language], key, format);
}

// Like appLine, but the bundled string is escaped too. Used by the newer,
// structured copy so the template never trusts any of its text.
function appText(language: ApplicationLocale, sources: EmailSources | undefined, key: AppKey): string {
  return piece(escapeHtml(emailCopy[language][key]), sourcesOf(sources).app[language], key, "body");
}

export function waitlistEmail(locale: string | null | undefined, sources: EmailSources): Email {
  const language = parseLocale(locale);
  return {
    subject: ackLine(locale, sources, "waitlistSubject", "subject"),
    html: render(language, [ackLine(locale, sources, "friend", "body"), ackLine(locale, sources, "waitlist", "body")], null, shellFor(language, sources)),
  };
}

export function interestEmail(locale: string | null | undefined, name: string | null | undefined, sources: EmailSources): Email {
  const language = parseLocale(locale);
  const greeting = ackLine(locale, sources, "greeting", "body");
  const hello = name ? greeting.replace("{name}", escapeHtml(name)) : ackLine(locale, sources, "friend", "body");
  return {
    subject: ackLine(locale, sources, "interestSubject", "subject"),
    html: render(language, [hello, ackLine(locale, sources, "interest", "body")], null, shellFor(language, sources)),
  };
}

export function nominationEmail(nomineeName: string, locale: string | null | undefined, nominatorName: string | null | undefined, sources: EmailSources): Email {
  const language = parseLocale(locale);
  const greeting = ackLine(locale, sources, "greeting", "body");
  const hello = nominatorName ? greeting.replace("{name}", escapeHtml(nominatorName)) : ackLine(locale, sources, "friend", "body");
  const body = ackLine(locale, sources, "nomination", "body").replace("{nominee}", escapeHtml(nomineeName));
  return {
    subject: ackLine(locale, sources, "nominationSubject", "subject"),
    html: render(language, [hello, body], null, shellFor(language, sources)),
  };
}

export function partnerEmail(name: string, locale: string | null | undefined, sources: EmailSources): Email {
  const language = parseLocale(locale);
  const greeting = ackLine(locale, sources, "greeting", "body").replace("{name}", escapeHtml(name));
  return {
    subject: ackLine(locale, sources, "partnerSubject", "subject"),
    html: render(language, [greeting, ackLine(locale, sources, "partner", "body")], null, shellFor(language, sources)),
  };
}

export const CONTACT_EMAIL_TEMPLATE = "contact";

export function contactEmail(name: string, locale: string | null | undefined, sources: EmailSources): Email {
  const language = parseLocale(locale);
  const greeting = ackLine(locale, sources, "greeting", "body").replace("{name}", escapeHtml(name));
  return {
    subject: ackLine(locale, sources, "contactSubject", "subject"),
    html: render(language, [greeting, ackLine(locale, sources, "contact", "body")], null, shellFor(language, sources)),
  };
}

export function applicationEmail(name: string, link: string | null, language: ApplicationLocale, sources: EmailSources): Email {
  const greeting = appLine(language, sources, "greeting", "body").replace("{name}", escapeHtml(name));
  const subject = appLine(language, sources, "applicationSubject", "subject");
  if (!link) return { subject, html: render(language, [greeting, appLine(language, sources, "waiting", "body")], null, shellFor(language, sources)) };
  const text = (key: AppKey) => appText(language, sources, key);
  const body: Block[] = [
    greeting,
    text("confirmIntro"),
    { kind: "heading", text: text("expectHeading") },
    { kind: "lead", lead: text("videoStep"), text: text("videoIntro") },
    { kind: "list", items: [text("videoTipQuiet"), text("videoTipLight"), text("videoTipDevice"), text("videoTipInternet")] },
    { kind: "lead", lead: text("identityStep"), text: text("identityIntro") },
    text("confirmClosing"),
  ];
  const button = { label: appLine(language, sources, "confirmButton", "body"), url: link };
  return { subject, html: render(language, body, button, shellFor(language, sources), [text("confirmIgnore")]) };
}

export function resumeEmail(name: string, link: string, language: ApplicationLocale, sources: EmailSources): Email {
  const greeting = appLine(language, sources, "greeting", "body").replace("{name}", escapeHtml(name));
  return {
    subject: appLine(language, sources, "resumeSubject", "subject"),
    html: render(language, [greeting, appLine(language, sources, "resume", "body")], { label: appLine(language, sources, "continue", "body"), url: link }, shellFor(language, sources)),
  };
}

export function identityEmail(name: string, link: string, language: ApplicationLocale, sources: EmailSources): Email {
  const greeting = appLine(language, sources, "greeting", "body").replace("{name}", escapeHtml(name));
  return {
    subject: appLine(language, sources, "identitySubject", "subject"),
    html: render(language, [greeting, appLine(language, sources, "identity", "body")], { label: appLine(language, sources, "identityButton", "body"), url: link }, shellFor(language, sources)),
  };
}

export function receivedEmail(name: string, language: ApplicationLocale, sources: EmailSources = JSON_EMAILS): Email {
  const greeting = appLine(language, sources, "greeting", "body").replace("{name}", escapeHtml(name));
  return {
    subject: appLine(language, sources, "receivedSubject", "subject"),
    html: render(language, [greeting, appLine(language, sources, "received", "body")], null, shellFor(language, sources)),
  };
}

export function identityRetryEmail(name: string, link: string, language: ApplicationLocale, sources: EmailSources): Email {
  const greeting = appLine(language, sources, "greeting", "body").replace("{name}", escapeHtml(name));
  return {
    subject: appLine(language, sources, "retrySubject", "subject"),
    html: render(language, [greeting, appLine(language, sources, "retry", "body")], { label: appLine(language, sources, "identityButton", "body"), url: link }, shellFor(language, sources)),
  };
}

const STAFF_ROLE = { admin: "Admin", editor: "Editor", reviewer: "Reviewer" } as const;

// Staff sign-in and invite mail. The link, its host, and the 15-minute expiry
// are chosen by the caller. This only wraps that link in the branded shell.
export function staffSignInEmail(link: string, role: keyof typeof STAFF_ROLE | null): Email {
  const roleName = role ? STAFF_ROLE[role] : "";
  const lines = [
    roleName ? `You are invited as ${roleName}.` : "Sign in to the admin.",
    "This link works once and expires in 15 minutes.",
    `Button not working? Copy this link into your browser: ${escapeHtml(link)}`,
    "Didn't request this? Ignore this email.",
  ];
  const subject = roleName ? "You're invited to Climate Refugee Pavilion" : "Sign in to Climate Refugee Pavilion";
  return { subject, html: render("en", lines, { label: "Sign in", url: link }, shellFor("en", undefined)) };
}

export function decisionEmail(
  status: "rejected" | "online_offered" | "accepted" | "interview_yes",
  link: string | null,
  language: ApplicationLocale,
  sources: EmailSources,
): Email {
  const shell = shellFor(language, sources);
  const applicant = appLine(language, sources, "applicant", "body");
  if (status === "rejected") return { subject: appLine(language, sources, "rejectedSubject", "subject"), html: render(language, [applicant, appLine(language, sources, "rejected", "body")], null, shell) };
  if (status === "online_offered") {
    const button = link ? { label: appLine(language, sources, "onlineButton", "body"), url: link } : null;
    return { subject: appLine(language, sources, "onlineSubject", "subject"), html: render(language, [applicant, appLine(language, sources, "online", "body")], button, shell) };
  }
  if (status === "accepted") {
    const congratulations = appLine(language, sources, "congratulations", "body");
    if (!link) return { subject: appLine(language, sources, "acceptedSubject", "subject"), html: render(language, [congratulations, appLine(language, sources, "interviewManual", "body")], null, shell) };
    return { subject: appLine(language, sources, "interviewSubject", "subject"), html: render(language, [congratulations, appLine(language, sources, "interview", "body")], { label: appLine(language, sources, "interviewButton", "body"), url: link }, shell) };
  }
  return { subject: appLine(language, sources, "selectedSubject", "subject"), html: render(language, [appLine(language, sources, "congratulations", "body"), appLine(language, sources, "selected", "body")], null, shell) };
}

// Ambassador mail. Bundled here in all four site languages; these strings are
// not in the copy desk yet. Every value is plain text and is escaped below.
const AMBASSADOR_MAIL = {
  en: {
    welcomeSubject: "Welcome, Ambassador",
    welcomeHello: "Hi {name},",
    welcomeBody: "You're now a Climate Refugee Pavilion Ambassador. You have your own Ambassador space on our website, where you can share stories from where you are. Once our team approves a story, it appears on the globe on our home page.",
    welcomeHow: "To sign in, open the link below and enter this email address. We'll send you a sign-in link each time.",
    welcomeCta: "Open my space",
    signInSubject: "Your Ambassador sign-in link",
    signInBody: "Use the button below to sign in to your Ambassador space.",
    signInExpiry: "This link works once and expires in 15 minutes.",
    copyLink: "Button not working? Copy this link into your browser:",
    ignore: "Didn't request this? You can ignore this email.",
    signInCta: "Sign in",
  },
  fr: {
    welcomeSubject: "Bienvenue, Ambassadeur·rice",
    welcomeHello: "Bonjour {name},",
    welcomeBody: "Vous êtes désormais Ambassadeur·rice du Climate Refugee Pavilion. Vous disposez de votre propre espace Ambassadeur sur notre site, où vous pouvez partager des histoires depuis l'endroit où vous vous trouvez. Une fois qu'une histoire est approuvée par notre équipe, elle apparaît sur le globe de notre page d'accueil.",
    welcomeHow: "Pour vous connecter, ouvrez le lien ci-dessous et saisissez cette adresse e-mail. Nous vous enverrons un lien de connexion à chaque fois.",
    welcomeCta: "Ouvrir mon espace",
    signInSubject: "Votre lien de connexion Ambassadeur",
    signInBody: "Utilisez le bouton ci-dessous pour vous connecter à votre espace Ambassadeur.",
    signInExpiry: "Ce lien ne fonctionne qu'une fois et expire dans 15 minutes.",
    copyLink: "Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :",
    ignore: "Vous n'avez rien demandé ? Vous pouvez ignorer cet e-mail.",
    signInCta: "Se connecter",
  },
  es: {
    welcomeSubject: "Bienvenido/a, Embajador/a",
    welcomeHello: "Hola {name}:",
    welcomeBody: "Ya eres Embajador/a del Climate Refugee Pavilion. Tienes tu propio espacio de Embajador/a en nuestra web, donde puedes compartir historias desde donde estás. Cuando nuestro equipo aprueba una historia, aparece en el globo de nuestra página de inicio.",
    welcomeHow: "Para entrar, abre el enlace de abajo e introduce esta dirección de correo. Te enviaremos un enlace de acceso cada vez.",
    welcomeCta: "Abrir mi espacio",
    signInSubject: "Tu enlace de acceso de Embajador/a",
    signInBody: "Usa el botón de abajo para entrar en tu espacio de Embajador/a.",
    signInExpiry: "Este enlace funciona una sola vez y caduca en 15 minutos.",
    copyLink: "¿El botón no funciona? Copia este enlace en tu navegador:",
    ignore: "¿No lo has pedido? Puedes ignorar este correo.",
    signInCta: "Entrar",
  },
  pt: {
    welcomeSubject: "Boas-vindas, Embaixador/a",
    welcomeHello: "Olá {name},",
    welcomeBody: "Agora você é Embaixador/a do Climate Refugee Pavilion. Você tem seu próprio espaço de Embaixador/a no nosso site, onde pode compartilhar histórias de onde está. Quando nossa equipe aprova uma história, ela aparece no globo da nossa página inicial.",
    welcomeHow: "Para entrar, abra o link abaixo e digite este endereço de e-mail. Enviaremos um link de acesso a cada vez.",
    welcomeCta: "Abrir meu espaço",
    signInSubject: "Seu link de acesso de Embaixador/a",
    signInBody: "Use o botão abaixo para entrar no seu espaço de Embaixador/a.",
    signInExpiry: "Este link funciona uma única vez e expira em 15 minutos.",
    copyLink: "O botão não funciona? Copie este link no seu navegador:",
    ignore: "Não pediu isto? Pode ignorar este e-mail.",
    signInCta: "Entrar",
  },
} as const satisfies Record<Locale, Record<string, string>>;

// Sent once, when an applicant becomes an Ambassador. It carries no sign-in
// code: the link opens the sign-in page, which mails a fresh 15-minute link.
// So the queued job never stores a credential.
export function ambassadorWelcomeEmail(locale: string | null | undefined, name: string, signInUrl: string): Email {
  const language = parseLocale(locale);
  const t = AMBASSADOR_MAIL[language];
  const lines = [
    escapeHtml(t.welcomeHello.replace("{name}", name)),
    escapeHtml(t.welcomeBody),
    escapeHtml(t.welcomeHow),
  ];
  return {
    subject: t.welcomeSubject,
    html: render(language, lines, { label: escapeHtml(t.welcomeCta), url: escapeHtml(signInUrl) }, shellFor(language, undefined)),
  };
}

export function ambassadorSignInEmail(locale: string | null | undefined, link: string): Email {
  const language = parseLocale(locale);
  const t = AMBASSADOR_MAIL[language];
  const lines = [
    escapeHtml(t.signInBody),
    escapeHtml(t.signInExpiry),
    `${escapeHtml(t.copyLink)} ${escapeHtml(link)}`,
    escapeHtml(t.ignore),
  ];
  return {
    subject: t.signInSubject,
    html: render(language, lines, { label: escapeHtml(t.signInCta), url: escapeHtml(link) }, shellFor(language, undefined)),
  };
}

// Story review outcomes. The title and the reviewer's reason are the
// Ambassador's and staff's own words, so both are escaped.
const STORY_MAIL = {
  en: {
    approvedSubject: "Your story is on the globe",
    hello: "Hi {name},",
    approvedBody: "Good news: our team approved “{title}”. It's now on the globe on our home page, at the place you chose.",
    approvedMore: "Thank you for sharing it. You can withdraw it from your Ambassador space at any time.",
    approvedCta: "See the globe",
    changesSubject: "Your story needs a few changes",
    changesBody: "Our team read “{title}” and would like a few changes before it goes on the globe.",
    takedownSubject: "Your story has been taken off the globe",
    takedownBody: "Our team has taken “{title}” off the globe for now.",
    note: "Their note:",
    changesMore: "You can edit the story in your Ambassador space and send it again.",
    changesCta: "Open my story",
  },
  fr: {
    approvedSubject: "Votre histoire est sur le globe",
    hello: "Bonjour {name},",
    approvedBody: "Bonne nouvelle : notre équipe a approuvé « {title} ». Elle est désormais sur le globe de notre page d'accueil, à l'endroit choisi.",
    approvedMore: "Merci de l'avoir partagée. Vous pouvez la retirer à tout moment depuis votre espace Ambassadeur.",
    approvedCta: "Voir le globe",
    changesSubject: "Votre histoire demande quelques modifications",
    changesBody: "Notre équipe a lu « {title} » et souhaite quelques modifications avant de la publier sur le globe.",
    takedownSubject: "Votre histoire a été retirée du globe",
    takedownBody: "Notre équipe a retiré « {title} » du globe pour le moment.",
    note: "Sa note :",
    changesMore: "Vous pouvez modifier l'histoire dans votre espace Ambassadeur et la renvoyer.",
    changesCta: "Ouvrir mon histoire",
  },
  es: {
    approvedSubject: "Tu historia está en el globo",
    hello: "Hola {name}:",
    approvedBody: "Buenas noticias: nuestro equipo aprobó «{title}». Ya está en el globo de nuestra página de inicio, en el lugar que elegiste.",
    approvedMore: "Gracias por compartirla. Puedes retirarla desde tu espacio de Embajador/a cuando quieras.",
    approvedCta: "Ver el globo",
    changesSubject: "Tu historia necesita algunos cambios",
    changesBody: "Nuestro equipo leyó «{title}» y quiere pedirte algunos cambios antes de publicarla en el globo.",
    takedownSubject: "Hemos quitado tu historia del globo",
    takedownBody: "Nuestro equipo ha quitado «{title}» del globo por ahora.",
    note: "Su nota:",
    changesMore: "Puedes editar la historia en tu espacio de Embajador/a y enviarla de nuevo.",
    changesCta: "Abrir mi historia",
  },
  pt: {
    approvedSubject: "Sua história está no globo",
    hello: "Olá {name},",
    approvedBody: "Boa notícia: nossa equipe aprovou “{title}”. Ela já está no globo da nossa página inicial, no lugar que você escolheu.",
    approvedMore: "Obrigado por compartilhar. Você pode retirá-la do seu espaço de Embaixador/a quando quiser.",
    approvedCta: "Ver o globo",
    changesSubject: "Sua história precisa de algumas alterações",
    changesBody: "Nossa equipe leu “{title}” e gostaria de algumas alterações antes de publicá-la no globo.",
    takedownSubject: "Sua história foi retirada do globo",
    takedownBody: "Nossa equipe retirou “{title}” do globo por enquanto.",
    note: "A nota da equipe:",
    changesMore: "Você pode editar a história no seu espaço de Embaixador/a e enviá-la novamente.",
    changesCta: "Abrir minha história",
  },
} as const satisfies Record<Locale, Record<string, string>>;

function fill(template: string, values: Record<string, string>): string {
  // Escape the template and the values separately, then join them, so a
  // value can never add markup.
  return template.split(/(\{[a-z]+\})/).map((part) => {
    const key = part.match(/^\{([a-z]+)\}$/)?.[1];
    return key && Object.hasOwn(values, key) ? escapeHtml(values[key]!) : escapeHtml(part);
  }).join("");
}

export function storyApprovedEmail(locale: string | null | undefined, name: string, title: string, globeUrl: string): Email {
  const language = parseLocale(locale);
  const t = STORY_MAIL[language];
  const lines = [fill(t.hello, { name }), fill(t.approvedBody, { title }), escapeHtml(t.approvedMore)];
  return {
    subject: t.approvedSubject,
    html: render(language, lines, { label: escapeHtml(t.approvedCta), url: escapeHtml(`${globeUrl}#platform`) }, shellFor(language, undefined)),
  };
}

export function storyChangesEmail(
  locale: string | null | undefined,
  name: string,
  title: string,
  reason: string,
  takenDown: boolean,
  storyUrl: string,
): Email {
  const language = parseLocale(locale);
  const t = STORY_MAIL[language];
  const lines: Block[] = [
    fill(t.hello, { name }),
    fill(takenDown ? t.takedownBody : t.changesBody, { title }),
    { kind: "lead", lead: escapeHtml(t.note), text: escapeHtml(reason).replaceAll("\n", "<br />") },
    escapeHtml(t.changesMore),
  ];
  return {
    subject: takenDown ? t.takedownSubject : t.changesSubject,
    html: render(language, lines, { label: escapeHtml(t.changesCta), url: escapeHtml(storyUrl) }, shellFor(language, undefined)),
  };
}
