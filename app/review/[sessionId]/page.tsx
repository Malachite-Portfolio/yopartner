"use client";

import { MessageCircleHeart, Star } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { submitSessionReview } from "@/lib/api/reviews";
import { getSessionById, type SessionRecord } from "@/lib/api/sessions";
import { getUserAuthTokenWithRestore } from "@/lib/auth/userAuth";

const MIN_FEEDBACK_LENGTH = 20;

function toLoginUrl(returnUrl: string) {
  return `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
}

function isReviewableSession(session: SessionRecord | null) {
  if (!session) return false;
  const serviceType = session.serviceType ?? session.type;
  return serviceType === "CHAT" && (session.status === "ENDED" || session.status === "COMPLETED");
}

export default function SessionReviewPage() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId ?? "";
  const queryCompanionId = searchParams.get("companionId") ?? "";
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [companionId, setCompanionId] = useState(queryCompanionId);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitIsError, setSubmitIsError] = useState(false);

  const currentPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `/review/${sessionId}?${query}` : `/review/${sessionId}`;
  }, [searchParams, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;

    const loadSession = async () => {
      setLoading(true);
      setPageError("");

      const token = await getUserAuthTokenWithRestore();
      if (!token) {
        router.replace(toLoginUrl(currentPath));
        return;
      }

      const response = await getSessionById(sessionId);
      if (!active) return;

      if (response.error?.status === 401) {
        router.replace(toLoginUrl(currentPath));
        return;
      }

      if (!response.data) {
        setPageError(response.error?.message || "We could not find this session.");
        setLoading(false);
        return;
      }

      if (!isReviewableSession(response.data)) {
        setPageError("This session is not ready for review yet.");
        setLoading(false);
        return;
      }

      setSession(response.data);
      setCompanionId(response.data.companionId);
      setLoading(false);
    };

    void loadSession();
    return () => {
      active = false;
    };
  }, [currentPath, router, sessionId]);

  const companionName = session?.companion?.name ?? "your companion";
  const feedbackLength = feedback.trim().length;

  const validate = () => {
    const nextRatingError = rating ? "" : "Please select a rating.";
    const nextFeedbackError =
      feedbackLength >= MIN_FEEDBACK_LENGTH ? "" : "Please write at least 20 characters about your experience.";
    setRatingError(nextRatingError);
    setFeedbackError(nextFeedbackError);
    return !nextRatingError && !nextFeedbackError;
  };

  const handleSubmit = async () => {
    if (!sessionId || !companionId || submitting) return;
    setSubmitMessage("");
    setSubmitIsError(false);
    if (!validate()) return;

    setSubmitting(true);
    const response = await submitSessionReview({
      sessionId,
      companionId,
      rating,
      feedback: feedback.trim(),
    });
    setSubmitting(false);

    if (!response.data) {
      const message = response.error?.message || "Unable to submit feedback right now.";
      setSubmitMessage(message);
      setSubmitIsError(true);
      return;
    }

    setSubmitMessage("Thank you for sharing your feedback.");
    setSubmitIsError(false);
    window.setTimeout(() => {
      router.replace("/connect-now");
    }, 900);
  };

  const skip = () => {
    router.replace("/connect-now");
  };

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#edf7f5] p-4">
        <div className="w-full max-w-md rounded-2xl border border-[#d5ece7] bg-white p-6 text-center text-sm font-medium text-slate-600 shadow-sm">
          Preparing your feedback screen...
        </div>
      </main>
    );
  }

  if (pageError) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#edf7f5] p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-amber-800">{pageError}</p>
          <button
            type="button"
            onClick={() => router.replace("/connect-now")}
            className="mt-5 rounded-xl bg-[#12313f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f4758]"
          >
            Back to Connect
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[linear-gradient(135deg,#eefaf6_0%,#eef7ff_48%,#f7f3ff_100%)] px-4 py-8 text-[#12212f]">
      <section className="w-full max-w-[480px] rounded-[28px] border border-white/80 bg-white px-5 py-7 text-center shadow-[0_24px_70px_rgba(15,46,62,0.14)] sm:px-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d9f7f0] text-[#0f766e] shadow-inner">
          <MessageCircleHeart size={30} strokeWidth={1.8} />
        </div>

        <h1 className="mt-5 text-2xl font-semibold text-[#102535] sm:text-3xl">Rate your YoPartner companion</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Your opinion helps us improve.</p>

        <div className="mt-7 rounded-2xl bg-[#f8fbfb] p-4">
          <p className="text-sm font-semibold text-slate-700">How was your session with {companionName}?</p>
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`Rate ${value} out of 5`}
                onClick={() => {
                  setRating(value);
                  setRatingError("");
                }}
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition ${
                  value <= rating ? "text-[#f5b51b]" : "text-slate-300 hover:text-[#f5b51b]"
                }`}
              >
                <Star size={30} fill={value <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm font-semibold text-[#0f766e]">{rating ? `${rating} / 5` : "Select a rating"}</p>
          {ratingError ? <p className="mt-2 text-xs font-medium text-rose-600">{ratingError}</p> : null}
        </div>

        <div className="mt-5 text-left">
          <label htmlFor="feedback" className="text-sm font-semibold text-slate-700">
            Feedback
          </label>
          <textarea
            id="feedback"
            value={feedback}
            onChange={(event) => {
              setFeedback(event.target.value);
              if (event.target.value.trim().length >= MIN_FEEDBACK_LENGTH) setFeedbackError("");
            }}
            placeholder="Please describe your experience..."
            rows={5}
            className="mt-2 w-full resize-none rounded-2xl border border-[#d7e8e5] bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0f766e] focus:ring-4 focus:ring-[#d9f7f0]"
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-xs">
            <span className={feedbackError ? "font-medium text-rose-600" : "text-slate-500"}>
              {feedbackError || "Minimum 20 characters"}
            </span>
            <span className={feedbackLength >= MIN_FEEDBACK_LENGTH ? "font-semibold text-[#0f766e]" : "text-slate-500"}>
              {feedbackLength} / 20
            </span>
          </div>
        </div>

        {submitMessage ? (
          <p
            className={`mt-4 rounded-xl px-3 py-2 text-sm font-medium ${
              submitIsError ? "bg-rose-50 text-rose-700" : "bg-[#eefaf6] text-[#0f766e]"
            }`}
          >
            {submitMessage}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={submitting}
          className="mt-6 w-full rounded-2xl bg-[#102535] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(16,37,53,0.22)] transition hover:bg-[#1f4758] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </button>

        <button
          type="button"
          onClick={skip}
          className="mt-4 text-sm font-semibold text-slate-500 transition hover:text-[#0f766e]"
        >
          Skip for now
        </button>
      </section>
    </main>
  );
}
