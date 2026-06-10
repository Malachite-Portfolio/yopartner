export function CallBrowserWarning({ dark = false }: { dark?: boolean }) {
  return (
    <p
      className={`w-full rounded-lg border px-3 py-2 text-center text-xs ${
        dark
          ? "border-amber-300/50 bg-black/35 text-amber-100"
          : "border-amber-200 bg-amber-50/90 text-amber-800"
      }`}
    >
      Please keep this call screen open. Some phones may pause browser calls when the screen is locked.
    </p>
  );
}
