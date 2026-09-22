import Link from "next/link";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, parseLocale } from "@/lib/locale";

export default async function VerificationCompletePage() {
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const french = locale === "fr";
  // Provider query parameters are not proof of approval. Only the signed
  // webhook records the outcome; this page acknowledges the browser's return.
  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream px-6 py-16 text-black">
      <div className="max-w-xl rounded-[40px] bg-white p-8 text-center desk:p-12">
        <h1 className="text-3xl tracking-tight">
          {french ? "Merci pour votre candidature" : "Thank you for applying"}
        </h1>
        <p className="mt-5 text-lg text-black/70">
          {french
            ? "Votre étape de vérification est terminée. Nous vous contacterons par e-mail pour la suite de votre candidature."
            : "You have returned from the verification step. We will contact you by email about the next steps for your application."}
        </p>
        <Link href="/" className="gradient-brand mt-8 inline-flex rounded-full px-8 py-4 font-semibold text-white">
          {french ? "Retour à l’accueil" : "Back to home"}
        </Link>
      </div>
    </main>
  );
}
