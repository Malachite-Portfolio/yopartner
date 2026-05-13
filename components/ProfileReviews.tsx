import { Star } from "lucide-react";
import type { ConnectCompanion } from "@/lib/data";

type ProfileReviewsProps = {
  reviews: ConnectCompanion["reviews"];
  reviewsCount: number;
};

export function ProfileReviews({ reviews, reviewsCount }: ProfileReviewsProps) {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-[#f5f3ff] via-[#f8fafc] to-[#eef8ff] p-6 shadow-sm">
      <h3 className="text-2xl font-semibold text-slate-900">Reviews ({reviewsCount})</h3>

      <div className="mt-4 space-y-3">
        {reviews.map((review, idx) => (
          <article key={`${review.phone}-${idx}`} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{review.phone}</p>
              <p className="text-xs font-medium text-slate-500">{review.date}</p>
            </div>
            <div className="mt-1 flex items-center gap-0.5 text-[#F5BF1B]">
              {Array.from({ length: 5 }).map((_, starIndex) => (
                <Star
                  key={starIndex}
                  size={14}
                  fill={starIndex + 1 <= Math.round(review.rating) ? "currentColor" : "none"}
                />
              ))}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">{review.message}</p>
            {review.recommended && (
              <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Recommended
              </span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
