import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-gray-300 mb-4">404</h1>
      <p className="text-gray-600 mb-6">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="text-spark-blue font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-spark-blue rounded">
        ← Back to Help Center
      </Link>
    </div>
  );
}
