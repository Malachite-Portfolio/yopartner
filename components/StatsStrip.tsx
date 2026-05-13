import { stats } from "@/lib/data";

export function StatsStrip() {
  return (
    <section className="border-y border-line bg-surface/90">
      <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-7 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {stats.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-2xl font-semibold text-brand">{item.value}</p>
            <p className="text-sm text-muted">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}



