"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-[#f8fafc]">
        <section className="flex min-h-screen items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">Something went wrong</h1>
            <p className="mt-3 text-sm text-slate-600">
              Please try again. If the issue continues, return home and retry your flow.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="rounded-xl bg-gradient-to-r from-[#2563eb] to-[#0ea5a6] px-4 py-2 text-sm font-semibold text-white"
              >
                Go Home
              </Link>
            </div>
          </div>
        </section>
      </body>
    </html>
  );
}
