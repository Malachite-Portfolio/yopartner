import { Play } from "lucide-react";
import type { ClientDiary } from "@/lib/data";

type ClientDiaryCardProps = {
  diary: ClientDiary;
  onPreview: (diary: ClientDiary) => void;
};

export function ClientDiaryCard({ diary, onPreview }: ClientDiaryCardProps) {
  return (
    <article className="yp-hover-lift group relative h-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm sm:h-[290px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={diary.image}
        alt={diary.title}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

      <span className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ef4444] text-white shadow-md">
        <Play size={16} fill="currentColor" className="ml-0.5" />
      </span>

      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <h3 className="text-xl font-semibold leading-tight">{diary.title}</h3>
        {diary.subtitle ? <p className="mt-1 text-sm text-white/90">{diary.subtitle}</p> : null}
      </div>

      <button
        type="button"
        onClick={() => onPreview(diary)}
        className="absolute inset-0 cursor-pointer"
        aria-label={`Open story preview for ${diary.title}`}
      />
    </article>
  );
}
