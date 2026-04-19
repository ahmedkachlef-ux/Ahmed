import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold">404</h1>
      <p className="mt-2 text-ink-300">
        Cette ressource n'existe pas ou a été supprimée.
      </p>
      <Link href="/" className="mt-6 text-brand-300 hover:text-brand-200">
        ← Retour à l'accueil
      </Link>
    </div>
  );
}
