import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-[#f8fafc] px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-3 text-sm text-slate-600">
          The page you are looking for does not exist or may have moved.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Go Home
          </Link>
          <Link
            href="/connect-now"
            className="rounded-xl bg-gradient-to-r from-[#2563eb] to-[#0ea5a6] px-4 py-2 text-sm font-semibold text-white"
          >
            Connect Now
          </Link>
        </div>
      </div>
    </section>
  );
}
