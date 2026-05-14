"use client";

import { CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PARTNER_FIREBASE_TOKEN_KEY } from "@/lib/auth/firebasePhoneAuth";
import { submitPartnerApplication } from "@/lib/api/partner";
import { isApiBaseUrlConfigured } from "@/lib/api/client";
import { IS_DEMO_MODE, IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { firebaseAuth } from "@/lib/firebase/client";
import {
  getPartnerDraft,
  getPartnerPhone,
  getPartnerProfile,
  isPartnerLoggedIn,
  savePartnerDraft,
  savePartnerProfile,
  setPartnerOnboardingComplete,
  setPartnerOnlineStatus,
  writeJSON,
  PARTNER_BOOKINGS_KEY,
  PARTNER_EARNINGS_KEY,
  PARTNER_MESSAGES_KEY,
  PARTNER_SESSIONS_KEY,
  PARTNER_SETTINGS_KEY,
} from "@/lib/partnerAuth";
import {
  defaultPartnerProfile,
  defaultPartnerSettings,
  demoPartnerBookings,
  demoPartnerEarnings,
  demoPartnerMessages,
  getPartnerInbox,
  getPartnerSessions,
  partnerCategoryOptions,
  partnerCommunicationStyleOptions,
  partnerHobbyOptions,
  partnerLanguageOptions,
  type PartnerProfile,
  type PartnerServiceType,
} from "@/lib/partnerData";

type OnboardingServiceType = Extract<PartnerServiceType, "Chat" | "Audio Call" | "Video Call">;
type OnboardingProfile = Omit<PartnerProfile, "servicesOffered"> & {
  servicesOffered: OnboardingServiceType[];
};
type ValidationErrors = Partial<Record<keyof OnboardingProfile | "base", string>>;

const stepTitles = [
  "Basic Details",
  "Education",
  "Languages & Style",
  "About Yourself",
  "Services & Pricing",
  "Safety & Review",
];

function toggleArrayValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function hasAnyValue(profile: PartnerProfile) {
  return Boolean(
    profile.fullName ||
      profile.age ||
      profile.school ||
      profile.languagesKnown.length ||
      profile.profileTagline,
  );
}

function sanitizeServices(services: string[]): OnboardingServiceType[] {
  const allowed: OnboardingServiceType[] = ["Chat", "Audio Call", "Video Call"];
  return services.filter((service): service is OnboardingServiceType =>
    allowed.includes(service as OnboardingServiceType),
  );
}

function toOnboardingProfile(source: PartnerProfile): OnboardingProfile {
  return {
    ...source,
    servicesOffered: sanitizeServices(source.servicesOffered as string[]),
  };
}

function toPartnerOnboardingPayload(profile: OnboardingProfile) {
  const safetyChecklist = [];
  if (profile.safetyPlatonicOnly) safetyChecklist.push("strictly platonic");
  if (profile.safetyRespectfulRules) safetyChecklist.push("respectful communication");
  if (profile.safetyNoOutsidePayments) safetyChecklist.push("no personal payment/contact sharing");
  if (profile.safetyReviewVerification) safetyChecklist.push("profile review and verification");

  return {
    fullName: profile.fullName.trim(),
    age: Number(profile.age) || 0,
    gender: String(profile.gender || ""),
    religion: profile.religion.trim() || undefined,
    bornCity: profile.bornCity.trim() || undefined,
    nationality: profile.nationality.trim() || undefined,
    school: profile.school.trim() || undefined,
    college: profile.college.trim() || undefined,
    qualification: profile.qualification.trim() || undefined,
    languagesKnown: profile.languagesKnown,
    communicationStyle: profile.communicationStyle,
    hobbies: profile.hobbies,
    profileTagline: profile.profileTagline.trim(),
    aboutYourself: profile.aboutYourself.trim(),
    servicesOffered: profile.servicesOffered,
    chatPrice: Number(profile.chatPricePerMinute) || 0,
    audioPrice: Number(profile.audioPricePerMinute) || 0,
    videoPrice: Number(profile.videoPricePerMinute) || 0,
    categories: profile.categories,
    safetyChecklist,
  };
}

export default function PartnerOnboardingPage() {
  const router = useRouter();
  const isEditMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("edit") === "true";
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<OnboardingProfile>(() => {
    if (IS_PRODUCTION_READY_MODE) {
      return toOnboardingProfile({ ...defaultPartnerProfile });
    }
    const saved = getPartnerProfile<PartnerProfile>(defaultPartnerProfile);
    const draft = getPartnerDraft<PartnerProfile>(defaultPartnerProfile);
    if (isEditMode) return toOnboardingProfile({ ...defaultPartnerProfile, ...saved });
    if (hasAnyValue(draft)) return toOnboardingProfile({ ...defaultPartnerProfile, ...draft });
    if (hasAnyValue(saved)) return toOnboardingProfile({ ...defaultPartnerProfile, ...saved });
    return toOnboardingProfile({ ...defaultPartnerProfile });
  });

  useEffect(() => {
    if (!isPartnerLoggedIn() || !getPartnerPhone()) {
      router.replace("/partner/login");
    }
  }, [router]);

  useEffect(() => {
    if (!IS_DEMO_MODE) return;
    savePartnerDraft(profile);
  }, [profile]);

  const summaryRows = useMemo(
    () => [
      { label: "Full Name", value: profile.fullName || "-" },
      { label: "Age", value: profile.age || "-" },
      { label: "Gender", value: profile.gender || "-" },
      { label: "Religion", value: profile.religion || "-" },
      { label: "Born City", value: profile.bornCity || "-" },
      { label: "Nationality", value: profile.nationality || "-" },
      { label: "School", value: profile.school || "-" },
      { label: "College", value: profile.college || "-" },
      { label: "Qualification", value: profile.qualification || "-" },
      { label: "Languages", value: profile.languagesKnown.join(", ") || "-" },
      { label: "Communication Style", value: profile.communicationStyle.join(", ") || "-" },
      { label: "Hobbies", value: profile.hobbies.join(", ") || "-" },
      { label: "Tagline", value: profile.profileTagline || "-" },
      { label: "About", value: profile.aboutYourself || "-" },
      { label: "Services", value: profile.servicesOffered.join(", ") || "-" },
      {
        label: "Pricing",
        value: `Chat ${profile.chatPricePerMinute || "0"}/min, Audio ${profile.audioPricePerMinute || "0"}/min, Video ${profile.videoPricePerMinute || "0"}/min`,
      },
      { label: "Categories", value: profile.categories.join(", ") || "-" },
    ],
    [profile],
  );

  const validateStep = (stepIndex: number): ValidationErrors => {
    const nextErrors: ValidationErrors = {};

    if (stepIndex === 0) {
      if (!profile.fullName.trim()) nextErrors.fullName = "Full Name is required.";
      if (!profile.age.trim()) nextErrors.age = "Age is required.";
      if (!profile.gender) nextErrors.gender = "Gender is required.";
      if (!profile.religion.trim()) nextErrors.religion = "Religion is required.";
      if (!profile.bornCity.trim()) nextErrors.bornCity = "Born City is required.";
      if (!profile.nationality.trim()) nextErrors.nationality = "Nationality is required.";
    }

    if (stepIndex === 1) {
      if (!profile.school.trim()) nextErrors.school = "School is required.";
      if (!profile.college.trim()) nextErrors.college = "College is required.";
      if (!profile.qualification.trim()) nextErrors.qualification = "Qualification is required.";
    }

    if (stepIndex === 2) {
      if (profile.languagesKnown.length === 0) nextErrors.languagesKnown = "Select at least one language.";
      if (profile.communicationStyle.length === 0) nextErrors.communicationStyle = "Select at least one style.";
      if (profile.hobbies.length === 0) nextErrors.hobbies = "Select at least one hobby.";
    }

    if (stepIndex === 3) {
      if (!profile.profileTagline.trim()) nextErrors.profileTagline = "Profile Tagline is required.";
      if (!profile.aboutYourself.trim()) nextErrors.aboutYourself = "About Yourself is required.";
      if (profile.aboutYourself.trim().length < 80) {
        nextErrors.aboutYourself = "About Yourself must be at least 80 characters.";
      }
    }

    if (stepIndex === 4) {
      if (profile.servicesOffered.length === 0) nextErrors.servicesOffered = "Select at least one service.";
      if (!profile.chatPricePerMinute.trim()) nextErrors.chatPricePerMinute = "Chat price is required.";
      if (!profile.audioPricePerMinute.trim()) nextErrors.audioPricePerMinute = "Audio price is required.";
      if (!profile.videoPricePerMinute.trim()) nextErrors.videoPricePerMinute = "Video price is required.";
      if (profile.categories.length === 0) nextErrors.categories = "Select at least one category.";
    }

    if (stepIndex === 5) {
      if (
        !profile.safetyPlatonicOnly ||
        !profile.safetyRespectfulRules ||
        !profile.safetyNoOutsidePayments ||
        !profile.safetyReviewVerification
      ) {
        nextErrors.base = "Please agree to all safety checklist items.";
      }
    }

    return nextErrors;
  };

  const handleContinue = () => {
    const stepErrors = validateStep(step);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    setStep((current) => Math.min(current + 1, stepTitles.length - 1));
  };

  const handleSubmit = () => {
    const stepErrors = validateStep(5);
    setErrors(stepErrors);
    setSubmitMessage("");
    if (Object.keys(stepErrors).length > 0) return;

    const finalProfile: OnboardingProfile = {
      ...profile,
      reviewStatus: "under_review",
    };

    if (IS_PRODUCTION_READY_MODE) {
      void (async () => {
        setIsSubmitting(true);
        if (!isApiBaseUrlConfigured()) {
          setErrors({ base: "Backend API URL is not configured. Please set NEXT_PUBLIC_API_BASE_URL." });
          setIsSubmitting(false);
          return;
        }
        if (!firebaseAuth?.currentUser) {
          setErrors({ base: "Please login again as a partner to submit your profile." });
          setIsSubmitting(false);
          return;
        }
        try {
          const freshToken = await firebaseAuth.currentUser.getIdToken(true);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(PARTNER_FIREBASE_TOKEN_KEY, freshToken);
          }
        } catch {
          setErrors({ base: "Please login again as a partner to submit your profile." });
          setIsSubmitting(false);
          return;
        }
        const payload = toPartnerOnboardingPayload(finalProfile);
        const response = await submitPartnerApplication(payload);
        if (response.error) {
          if (response.error.status === 401) {
            setErrors({ base: "Your login session expired. Please login again as a partner." });
            setIsSubmitting(false);
            return;
          }
          const statusLabel = response.error.status ?? "ERR";
          const message = response.error.message || "Unknown error";
          setErrors({ base: `Submit failed (${statusLabel}): ${message}` });
          setIsSubmitting(false);
          return;
        }
        setSubmitMessage("Your profile has been submitted for review.");
        setTimeout(() => {
          router.push("/partner/dashboard");
        }, 900);
        setIsSubmitting(false);
      })();
      return;
    }

    savePartnerProfile(finalProfile);
    savePartnerDraft(finalProfile);
    setPartnerOnboardingComplete(true);
    setPartnerOnlineStatus(false);

    writeJSON(PARTNER_MESSAGES_KEY, demoPartnerMessages);
    writeJSON(PARTNER_BOOKINGS_KEY, demoPartnerBookings);
    writeJSON(PARTNER_EARNINGS_KEY, demoPartnerEarnings);
    writeJSON(PARTNER_SETTINGS_KEY, defaultPartnerSettings);
    writeJSON(PARTNER_SESSIONS_KEY, getPartnerSessions());
    void getPartnerInbox();

    router.push("/partner/dashboard");
  };

  const renderChipGroup = (
    options: string[],
    values: string[],
    onToggle: (value: string) => void,
  ) => (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = values.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              selected
                ? "border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );

  return (
    <section className="min-h-screen bg-[#f8fafc]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[72px] w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="YoPartner" className="h-auto max-h-12 w-auto object-contain" />
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">YoPartner Companion</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-5">
          <p className="text-sm font-medium text-slate-500">
            Step {step + 1} of {stepTitles.length}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{stepTitles[step]}</h1>
          <div className="mt-4 h-2 rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#0ea5a6]"
              style={{ width: `${((step + 1) / stepTitles.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {step === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Full Name</p>
                <input
                  value={profile.fullName}
                  onChange={(event) => setProfile((current) => ({ ...current, fullName: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#2563eb]"
                />
                {errors.fullName ? <p className="mt-1 text-xs text-rose-600">{errors.fullName}</p> : null}
              </label>
              <label>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Age</p>
                <input
                  value={profile.age}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, age: event.target.value.replace(/[^\d]/g, "") }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#2563eb]"
                />
                {errors.age ? <p className="mt-1 text-xs text-rose-600">{errors.age}</p> : null}
              </label>
              <label>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Gender</p>
                <select
                  value={profile.gender}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      gender: event.target.value as PartnerProfile["gender"],
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#2563eb]"
                >
                  <option value="">Select gender</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                  <option>Prefer not to say</option>
                </select>
                {errors.gender ? <p className="mt-1 text-xs text-rose-600">{errors.gender}</p> : null}
              </label>
              <label>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Religion</p>
                <input
                  value={profile.religion}
                  onChange={(event) => setProfile((current) => ({ ...current, religion: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#2563eb]"
                />
                {errors.religion ? <p className="mt-1 text-xs text-rose-600">{errors.religion}</p> : null}
              </label>
              <label>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Born City</p>
                <input
                  value={profile.bornCity}
                  onChange={(event) => setProfile((current) => ({ ...current, bornCity: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#2563eb]"
                />
                {errors.bornCity ? <p className="mt-1 text-xs text-rose-600">{errors.bornCity}</p> : null}
              </label>
              <label>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Nationality</p>
                <input
                  value={profile.nationality}
                  onChange={(event) => setProfile((current) => ({ ...current, nationality: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#2563eb]"
                />
                {errors.nationality ? <p className="mt-1 text-xs text-rose-600">{errors.nationality}</p> : null}
              </label>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <p className="mb-1.5 text-sm font-medium text-slate-700">School</p>
                <input
                  value={profile.school}
                  onChange={(event) => setProfile((current) => ({ ...current, school: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#2563eb]"
                />
                {errors.school ? <p className="mt-1 text-xs text-rose-600">{errors.school}</p> : null}
              </label>
              <label>
                <p className="mb-1.5 text-sm font-medium text-slate-700">College</p>
                <input
                  value={profile.college}
                  onChange={(event) => setProfile((current) => ({ ...current, college: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#2563eb]"
                />
                {errors.college ? <p className="mt-1 text-xs text-rose-600">{errors.college}</p> : null}
              </label>
              <label className="sm:col-span-2">
                <p className="mb-1.5 text-sm font-medium text-slate-700">Qualification</p>
                <input
                  value={profile.qualification}
                  onChange={(event) => setProfile((current) => ({ ...current, qualification: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#2563eb]"
                />
                {errors.qualification ? <p className="mt-1 text-xs text-rose-600">{errors.qualification}</p> : null}
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Languages Known</p>
                {renderChipGroup(
                  partnerLanguageOptions,
                  profile.languagesKnown,
                  (value) =>
                    setProfile((current) => ({
                      ...current,
                      languagesKnown: toggleArrayValue(current.languagesKnown, value),
                    })),
                )}
                {errors.languagesKnown ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.languagesKnown}</p>
                ) : null}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Communication Style</p>
                {renderChipGroup(
                  partnerCommunicationStyleOptions,
                  profile.communicationStyle,
                  (value) =>
                    setProfile((current) => ({
                      ...current,
                      communicationStyle: toggleArrayValue(current.communicationStyle, value),
                    })),
                )}
                {errors.communicationStyle ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.communicationStyle}</p>
                ) : null}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Hobbies</p>
                {renderChipGroup(partnerHobbyOptions, profile.hobbies, (value) =>
                  setProfile((current) => ({
                    ...current,
                    hobbies: toggleArrayValue(current.hobbies, value),
                  })),
                )}
                {errors.hobbies ? <p className="mt-1 text-xs text-rose-600">{errors.hobbies}</p> : null}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <label>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Profile Tagline</p>
                <input
                  value={profile.profileTagline}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, profileTagline: event.target.value }))
                  }
                  placeholder="Calm conversations with a cheerful listener"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#2563eb]"
                />
                {errors.profileTagline ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.profileTagline}</p>
                ) : null}
              </label>
              <label>
                <p className="mb-1.5 text-sm font-medium text-slate-700">About Yourself</p>
                <textarea
                  value={profile.aboutYourself}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, aboutYourself: event.target.value }))
                  }
                  placeholder="Tell clients about your personality, how you support people, and what kind of conversations you enjoy."
                  className="min-h-40 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2563eb]"
                />
                <p className="mt-1 text-xs text-slate-500">
                  {profile.aboutYourself.trim().length} / 80 minimum characters
                </p>
                {errors.aboutYourself ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.aboutYourself}</p>
                ) : null}
              </label>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Services offered</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["Chat", "Audio Call", "Video Call"] as OnboardingServiceType[]).map(
                    (service) => (
                      <label
                        key={service}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2"
                      >
                        <input
                          type="checkbox"
                          checked={profile.servicesOffered.includes(service)}
                          onChange={() =>
                            setProfile((current) => ({
                              ...current,
                              servicesOffered: current.servicesOffered.includes(service)
                                ? current.servicesOffered.filter((item) => item !== service)
                                : [...current.servicesOffered, service],
                            }))
                          }
                        />
                        <span className="text-sm text-slate-700">{service}</span>
                      </label>
                    ),
                  )}
                </div>
                {errors.servicesOffered ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.servicesOffered}</p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <p className="mb-1.5 text-sm font-medium text-slate-700">Chat price per minute</p>
                  <input
                    value={profile.chatPricePerMinute}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, chatPricePerMinute: event.target.value }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#2563eb]"
                  />
                  {errors.chatPricePerMinute ? (
                    <p className="mt-1 text-xs text-rose-600">{errors.chatPricePerMinute}</p>
                  ) : null}
                </label>
                <label>
                  <p className="mb-1.5 text-sm font-medium text-slate-700">Audio price per minute</p>
                  <input
                    value={profile.audioPricePerMinute}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, audioPricePerMinute: event.target.value }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#2563eb]"
                  />
                  {errors.audioPricePerMinute ? (
                    <p className="mt-1 text-xs text-rose-600">{errors.audioPricePerMinute}</p>
                  ) : null}
                </label>
                <label>
                  <p className="mb-1.5 text-sm font-medium text-slate-700">Video price per minute</p>
                  <input
                    value={profile.videoPricePerMinute}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, videoPricePerMinute: event.target.value }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#2563eb]"
                  />
                  {errors.videoPricePerMinute ? (
                    <p className="mt-1 text-xs text-rose-600">{errors.videoPricePerMinute}</p>
                  ) : null}
                </label>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Categories</p>
                {renderChipGroup(partnerCategoryOptions, profile.categories, (value) =>
                  setProfile((current) => ({
                    ...current,
                    categories: toggleArrayValue(current.categories, value),
                  }))
                )}
                {errors.categories ? <p className="mt-1 text-xs text-rose-600">{errors.categories}</p> : null}
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Profile Summary</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {summaryRows.map((row) => (
                    <div key={row.label}>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{row.label}</p>
                      <p className="text-sm text-slate-800">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">Safety checklist</p>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={profile.safetyPlatonicOnly}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, safetyPlatonicOnly: event.target.checked }))
                    }
                  />
                  I understand YoPartner is strictly platonic.
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={profile.safetyRespectfulRules}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, safetyRespectfulRules: event.target.checked }))
                    }
                  />
                  I will follow respectful communication rules.
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={profile.safetyNoOutsidePayments}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, safetyNoOutsidePayments: event.target.checked }))
                    }
                  />
                  I will not share personal payment/contact details outside the platform.
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={profile.safetyReviewVerification}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, safetyReviewVerification: event.target.checked }))
                    }
                  />
                  I agree to profile review and verification.
                </label>

                {errors.base ? <p className="text-xs text-rose-600">{errors.base}</p> : null}
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
              disabled={step === 0}
              className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Back
            </button>

            {step < stepTitles.length - 1 ? (
              <button
                type="button"
                onClick={handleContinue}
                className="inline-flex h-10 items-center gap-1 rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#0ea5a6] px-4 text-sm font-semibold text-white"
              >
                Continue
                <ChevronRight size={16} />
              </button>
            ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center gap-1 rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#0ea5a6] px-4 text-sm font-semibold text-white"
                >
                  <ShieldCheck size={16} />
                  {isSubmitting ? "Submitting..." : "Submit for Review"}
                </button>
            )}
          </div>
          {submitMessage ? <p className="mt-3 text-sm font-medium text-emerald-700">{submitMessage}</p> : null}
        </div>

        {IS_DEMO_MODE ? (
          <p className="mt-3 inline-flex items-center gap-1 text-xs text-slate-500">
            <CheckCircle2 size={13} />
            Frontend demo onboarding only. Verification and approvals will be connected to backend later.
          </p>
        ) : null}
      </div>
    </section>
  );
}
