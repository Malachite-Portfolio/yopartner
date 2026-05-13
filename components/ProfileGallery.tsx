import { ChevronLeft, ChevronRight } from "lucide-react";

type ProfileGalleryProps = {
  images: string[];
};

export function ProfileGallery({ images }: ProfileGalleryProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">Gallery</h3>
        <div className="flex items-center gap-2">
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600">
            <ChevronLeft size={16} />
          </button>
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {images.map((image, idx) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${image}-${idx}`}
            src={image}
            alt={`Gallery ${idx + 1}`}
            className="h-28 w-44 shrink-0 rounded-xl object-cover"
          />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {images.slice(0, 5).map((_, idx) => (
          <span
            key={idx}
            className={`h-2 w-2 rounded-full ${idx === 0 ? "bg-[#2563EB]" : "bg-slate-300"}`}
          />
        ))}
      </div>
    </section>
  );
}
