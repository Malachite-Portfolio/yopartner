"use client";

import { BadgeCheck, Camera, Lock, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getCurrentUserProfile, updateCurrentUserProfile } from "@/lib/api/users";
import { consumeStoredPostLoginRedirect } from "@/lib/auth/onboarding";
import { restoreUserAuthSessionFromFirebase } from "@/lib/auth/userAuth";
import { uploadUserProfilePhoto } from "@/lib/firebaseUserProfileUpload";
import { shouldTrackCompleteRegistration, trackMetaPixel } from "@/lib/metaPixel";

type FormState = {
  name: string;
  email: string;
  age: string;
  gender: string;
};

const defaultForm: FormState = {
  name: "",
  email: "",
  age: "25",
  gender: "",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function UserOnboardingProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarFileName, setAvatarFileName] = useState<string>("");
  const [uploadedProfileImageUrl, setUploadedProfileImageUrl] = useState<string>("");
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const wasProfileIncompleteRef = useRef(false);
  const registrationTrackedRef = useRef(false);

  const ageValue = useMemo(() => {
    const parsed = Number(form.age);
    if (!Number.isFinite(parsed)) return 18;
    return Math.max(18, Math.min(70, parsed));
  }, [form.age]);

  const canSubmit = useMemo(() => {
    const name = form.name.trim();
    const email = form.email.trim();
    const age = Number(form.age);
    return (
      name.length >= 2 &&
      email.length > 0 &&
      isValidEmail(email) &&
      Number.isFinite(age) &&
      age >= 18 &&
      Boolean(uploadedProfileImageUrl) &&
      !isUploadingAvatar
    );
  }, [form, uploadedProfileImageUrl, isUploadingAvatar]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  useEffect(() => {
    let active = true;

    void (async () => {
      const restored = await restoreUserAuthSessionFromFirebase(false);
      if (!active) return;

      if (!restored.loggedIn) {
        router.replace("/login");
        return;
      }

      const profileResult = await getCurrentUserProfile();
      if (!active) return;

      if (profileResult.error) {
        setError(profileResult.error.message || "Unable to load your profile details right now.");
        setLoading(false);
        return;
      }

      if (profileResult.data?.profileComplete) {
        router.replace(consumeStoredPostLoginRedirect() || "/connect-now");
        return;
      }

      wasProfileIncompleteRef.current = true;
      const existing = profileResult.data?.user;
      setForm({
        name: existing?.name ?? "",
        email: existing?.email ?? "",
        age: existing?.age ? String(existing.age) : "25",
        gender: existing?.gender ?? "",
      });
      setUploadedProfileImageUrl(existing?.profileImageUrl ?? "");
      setAvatarPreviewUrl(existing?.profileImageUrl ?? null);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [router]);

  const onAvatarChange = async (file: File | null) => {
    if (!file) return;

    setError("");
    setMessage("");

    const nextPreviewUrl = URL.createObjectURL(file);
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    setLocalPreviewUrl(nextPreviewUrl);
    setAvatarPreviewUrl(nextPreviewUrl);
    setAvatarFileName(file.name);

    setIsUploadingAvatar(true);

    try {
      const uploadResult = await uploadUserProfilePhoto(file);
      setUploadedProfileImageUrl(uploadResult.downloadUrl);
      setMessage("Profile photo uploaded successfully.");
    } catch (uploadError) {
      setUploadedProfileImageUrl("");
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload profile photo right now.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async () => {
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    const trimmedGender = form.gender.trim();
    const parsedAge = Number(form.age);

    if (trimmedName.length < 2) {
      setError("Full name is required.");
      return;
    }

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!Number.isFinite(parsedAge) || parsedAge < 18) {
      setError("Age must be 18 or above.");
      return;
    }

    if (isUploadingAvatar) {
      setError("Please wait for profile photo upload to finish.");
      return;
    }

    if (!uploadedProfileImageUrl) {
      setError("Please upload a profile photo.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const result = await updateCurrentUserProfile({
      name: trimmedName,
      email: trimmedEmail,
      age: Math.round(parsedAge),
      gender: trimmedGender || undefined,
      profileImageUrl: uploadedProfileImageUrl,
    });

    if (result.error) {
      setSaving(false);
      setError(result.error.message || "Unable to save profile. Please try again.");
      return;
    }

    setMessage("Profile saved. Redirecting...");

    if (shouldTrackCompleteRegistration(wasProfileIncompleteRef.current, registrationTrackedRef.current)) {
      registrationTrackedRef.current = true;
      trackMetaPixel("CompleteRegistration", { status: "registered" });
      await new Promise((resolve) => window.setTimeout(resolve, 200));
    }

    router.push(consumeStoredPostLoginRedirect() || "/connect-now");
  };

  if (loading) {
    return <section className="min-h-screen bg-[#f4fbf7]" />;
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#f4fbf7] px-4 py-10">
      <div className="w-full max-w-[520px] rounded-3xl border border-[#dceee6] bg-[#fffefb] p-6 shadow-[0_20px_65px_-40px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="YoPartner" className="mx-auto h-auto max-h-11 w-auto object-contain" />
          <div className="mt-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#267f71]">
            <span className="rounded-full bg-[#d9f2ea] px-2 py-1">Step 3</span>
            <div className="h-1 flex-1 rounded-full bg-[#e4f4ee]">
              <div className="h-1 w-full rounded-full bg-[#1d8a76]" />
            </div>
            <span>3</span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-[#16382f]">Tell us about yourself</h1>
          <p className="mt-2 text-sm text-[#5b7269]">Complete your profile to start trusted conversations.</p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative inline-flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[#cfe4db] bg-[#f2fbf7]"
            >
              {avatarPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreviewUrl} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                <Camera size={22} className="text-[#2f6f61]" />
              )}
              <span className="absolute inset-0 hidden items-center justify-center bg-[#00000055] text-xs font-semibold text-white group-hover:flex">
                Change
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                void onAvatarChange(event.target.files?.[0] ?? null);
              }}
            />
            <p className="text-xs text-[#5b7269]">Profile photo / avatar (required)</p>
            {avatarFileName ? <p className="text-[11px] text-[#567468]">Selected: {avatarFileName}</p> : null}
            {isUploadingAvatar ? <p className="text-[11px] text-[#127e6d]">Uploading photo...</p> : null}
          </div>

          <label className="block">
            <p className="mb-1.5 text-sm font-medium text-[#305247]">Full Name</p>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Enter full name"
              className="h-12 w-full rounded-2xl border border-[#d2e7de] bg-[#f8fcfa] px-3 text-sm text-slate-800 outline-none"
            />
          </label>

          <label className="block">
            <p className="mb-1.5 text-sm font-medium text-[#305247]">Email</p>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="name@example.com"
              className="h-12 w-full rounded-2xl border border-[#d2e7de] bg-[#f8fcfa] px-3 text-sm text-slate-800 outline-none"
              required
            />
          </label>

          <label className="block">
            <p className="mb-1.5 text-sm font-medium text-[#305247]">Age</p>
            <div className="rounded-2xl border border-[#d2e7de] bg-[#f8fcfa] px-3 py-3">
              <input
                type="range"
                min={18}
                max={70}
                value={ageValue}
                onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))}
                className="w-full accent-[#127e6d]"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-[#4f6c61]">
                <span>18</span>
                <input
                  type="number"
                  min={18}
                  max={99}
                  value={form.age}
                  onChange={(event) => setForm((current) => ({ ...current, age: event.target.value.replace(/[^0-9]/g, "") }))}
                  className="h-8 w-16 rounded-lg border border-[#d2e7de] bg-white px-2 text-right text-sm"
                />
              </div>
            </div>
          </label>

          <label className="block">
            <p className="mb-1.5 text-sm font-medium text-[#305247]">Gender (optional)</p>
            <select
              value={form.gender}
              onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-[#d2e7de] bg-[#f8fcfa] px-3 text-sm text-slate-800 outline-none"
            >
              <option value="">Select gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </label>

          <p className="rounded-2xl border border-[#d8ebe3] bg-[#f4faf7] px-3 py-2 text-xs text-[#4e6a60]">
            Your information is private and used to personalize your YoPartner experience.
          </p>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || saving || isUploadingAvatar}
            className="h-12 w-full rounded-2xl bg-[#127e6d] text-sm font-semibold text-white transition hover:bg-[#0f6e5f] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isUploadingAvatar ? "Uploading photo..." : saving ? "Saving..." : "Complete Profile"}
          </button>

          {message ? <p className="text-xs font-medium text-emerald-700">{message}</p> : null}
          {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#d8ebe3] bg-[#f7fcfa] p-3 text-[11px] font-medium text-[#3d5e53]">
            <p className="inline-flex items-center gap-1">
              <ShieldCheck size={13} className="text-[#1b8d7a]" />
              Secure
            </p>
            <p className="inline-flex items-center gap-1">
              <Lock size={13} className="text-[#1b8d7a]" />
              Private
            </p>
            <p className="inline-flex items-center gap-1">
              <BadgeCheck size={13} className="text-[#1b8d7a]" />
              Trusted
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
