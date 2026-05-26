import { MessageSquare, Star, ThumbsUp } from "lucide-react";
import type { ConnectCompanion } from "@/lib/data";

type ProfileReviewsProps = {
  reviews: ConnectCompanion["reviews"];
  reviewsCount: number;
};

function getInitial(value: string) {
  const stripped = value.replace(/[^a-zA-Z0-9]/g, "");
  return (stripped[0] || "U").toUpperCase();
}

export function ProfileReviews({ reviews, reviewsCount }: ProfileReviewsProps) {
  return (
    <section className="rounded-[22px] border border-[#e6e2eb] bg-white p-5 shadow-[0_10px_35px_rgba(43,31,63,0.06)] sm:p-7">
      <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#201a2f]">
        <MessageSquare size={24} className="text-[#a45413]" />
        Reviews ({reviewsCount})
      </h2>

      {reviews.length === 0 ? (
        <div className="mt-5 rounded-xl border border-[#eee6f2] bg-[#fcfaff] px-4 py-6 text-sm font-medium text-[#7d7288]">
          No reviews yet.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {reviews.map((review, idx) => (
            <article key={`${review.phone}-${idx}`} className="rounded-xl border border-[#eee6f2] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5b2dd6] text-base font-semibold text-white">
                    {getInitial(review.phone)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#332d42]">{review.phone}</p>
                    <div className="mt-1 flex items-center gap-0.5 text-[#ad5b08]">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star
                          key={starIndex}
                          size={15}
                          fill={starIndex + 1 <= Math.round(review.rating) ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm font-medium text-[#8490a4]">{review.date}</p>
              </div>
              <p className="mt-4 text-[15px] leading-7 text-[#6a5d71]">&quot;{review.message}&quot;</p>
              {review.recommended ? (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <ThumbsUp size={13} />
                  Recommended
                </span>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
