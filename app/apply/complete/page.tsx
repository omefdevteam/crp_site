import Link from "next/link";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, parseLocale } from "@/lib/locale";

export default async function VerificationCompletePage() {
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const text = {
    en: ["Thank you for applying", "We are waiting for confirmation of your step from our provider. We will email you about the next steps for your application.", "Back to home"],
    fr: ["Merci pour votre candidature", "Nous attendons la confirmation de cette étape par notre prestataire. Nous vous contacterons par e-mail pour la suite.", "Retour à l’accueil"],
    es: ["Gracias por presentar tu solicitud", "Estamos esperando la confirmación de esta etapa por parte de nuestro proveedor. Te informaremos de los próximos pasos por correo.", "Volver al inicio"],
    pt: ["Obrigado pela sua candidatura", "Aguardamos a confirmação desta etapa pelo nosso prestador. Enviaremos os próximos passos por e-mail.", "Voltar ao início"],
  }[locale];
  // Provider query parameters are not proof of approval. Only the signed
  // webhook records the outcome; this page acknowledges the browser's return.
  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream px-6 py-16 text-black">
      <div className="max-w-xl rounded-[40px] bg-white p-8 text-center desk:p-12">
        <h1 className="text-3xl tracking-tight">
          {text[0]}
        </h1>
        <p className="mt-5 text-lg text-black/70">
          {text[1]}
        </p>
        <Link href={`/${locale}`} className="gradient-brand mt-8 inline-flex rounded-full px-8 py-4 font-semibold text-white">
          {text[2]}
        </Link>
      </div>
    </main>
  );
}
