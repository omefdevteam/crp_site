import Link from "next/link";
export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const { result } = await searchParams;
  const confirmed = result === "confirmed";
  return <main className="grid min-h-dvh place-items-center bg-cream p-8 text-black"><div className="max-w-lg rounded-[32px] bg-white p-10 text-center">
    <h1 className="text-3xl">{confirmed ? "Request confirmed" : "Link expired or already used"}</h1>
    <p className="mt-5">{confirmed ? "Your preferences have been saved. / Vos préférences ont été enregistrées." : "Please submit the form again for a new confirmation email. / Veuillez soumettre à nouveau le formulaire."}</p>
    <Link href="/" className="mt-8 inline-block rounded-full bg-black px-6 py-3 text-white">Home / Accueil</Link>
  </div></main>;
}
