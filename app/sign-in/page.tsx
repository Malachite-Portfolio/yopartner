export default function SignInPage() {
  return (
    <section className="mx-auto w-full max-w-md px-4 py-16 sm:px-6 lg:py-20">
      <article className="rounded-2xl border border-line bg-surface p-6 shadow-[0_8px_24px_rgba(24,86,115,0.12)] sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">Sign in to continue to YoPartner.</p>

        <form className="mt-6 space-y-4" action="#">
          <div>
            <label htmlFor="phone-number" className="mb-1 block text-sm font-medium text-foreground">
              Phone number
            </label>
            <input
              id="phone-number"
              type="tel"
              className="w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
              placeholder="Enter phone number"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-gradient-to-r from-brand to-brand-purple px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Continue
          </button>
        </form>

        <div className="my-6 h-px bg-line" />

        <p className="rounded-xl border border-brand/20 bg-brand-soft/55 px-4 py-3 text-sm text-muted">
          Demo note: Authentication will be added later.
        </p>
      </article>
    </section>
  );
}



