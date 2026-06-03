"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  addPartnerGalleryImage,
  deletePartnerGalleryImage,
  getPartnerApplications,
  getPartnerProfile as getPartnerProfileApi,
  getPartnerProfileMedia,
  type PartnerProfileMediaItem,
  updatePartnerProfileImage,
} from "@/lib/api/partner";
import { getPartnerApprovalLabel, getLocalPartnerApprovalState, isPartnerApproved } from "@/lib/partnerApproval";
import { getPartnerProfile as getLocalPartnerProfile } from "@/lib/partnerAuth";
import { defaultPartnerProfile, type PartnerProfile } from "@/lib/partnerData";
import {
  MAX_PARTNER_GALLERY_IMAGES,
  deletePartnerProfileMediaByPath,
  uploadPartnerProfileMedia,
} from "@/lib/firebasePartnerProfileUpload";
import { FIXED_PLATFORM_PRICE_LABELS } from "@/lib/platformPricing";

type PartnerProfileMediaState = {
  profileImageUrl: string | null;
  profileImageStoragePath: string | null;
  resolvedProfileImageUrl: string | null;
  galleryImages: PartnerProfileMediaItem[];
};

type DisplayProfileDetails = {
  fullName: string;
  age: string;
  gender: string;
  religion: string;
  bornCity: string;
  nationality: string;
  school: string;
  college: string;
  qualification: string;
  languagesKnown: string[];
  communicationStyle: string[];
  hobbies: string[];
  profileTagline: string;
  aboutYourself: string;
  servicesOffered: string[];
  categories: string[];
};

const EMPTY_MEDIA_STATE: PartnerProfileMediaState = {
  profileImageUrl: null,
  profileImageStoragePath: null,
  resolvedProfileImageUrl: null,
  galleryImages: [],
};

function toStringValue(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeServiceLabel(service: string) {
  const normalized = service.trim().toUpperCase();
  if (normalized === "CHAT") return "Chat";
  if (normalized === "AUDIO") return "Audio Call";
  if (normalized === "VIDEO") return "Video Call";
  if (normalized === "HOME_VISIT") return "Home Visit";
  return service.trim();
}

function fromLocalProfile(localProfile: PartnerProfile): DisplayProfileDetails {
  return {
    fullName: localProfile.fullName,
    age: localProfile.age,
    gender: localProfile.gender,
    religion: localProfile.religion,
    bornCity: localProfile.bornCity,
    nationality: localProfile.nationality,
    school: localProfile.school,
    college: localProfile.college,
    qualification: localProfile.qualification,
    languagesKnown: localProfile.languagesKnown,
    communicationStyle: localProfile.communicationStyle,
    hobbies: localProfile.hobbies,
    profileTagline: localProfile.profileTagline,
    aboutYourself: localProfile.aboutYourself,
    servicesOffered: localProfile.servicesOffered,
    categories: localProfile.categories,
  };
}

function mergeDisplayProfile(
  base: DisplayProfileDetails,
  payload: { companion?: Record<string, unknown> | null; application?: Record<string, unknown> | null } | null,
) {
  const companion = payload?.companion ?? null;
  const application = payload?.application ?? null;
  const companionLanguages = toStringArray(companion?.languages);
  const companionServices = toStringArray(companion?.servicesOffered).map(normalizeServiceLabel);
  const applicationServices = toStringArray(application?.servicesOffered).map(normalizeServiceLabel);
  const companionCategory = toStringValue(companion?.category);

  return {
    fullName: toStringValue(application?.fullName) || toStringValue(companion?.displayName) || base.fullName,
    age:
      typeof application?.age === "number" && Number.isFinite(application.age)
        ? String(application.age)
        : toStringValue(application?.age) || base.age,
    gender: toStringValue(application?.gender) || base.gender,
    religion: toStringValue(application?.religion) || base.religion,
    bornCity: toStringValue(application?.bornCity) || base.bornCity,
    nationality: toStringValue(application?.nationality) || base.nationality,
    school: toStringValue(application?.school) || base.school,
    college: toStringValue(application?.college) || base.college,
    qualification: toStringValue(application?.qualification) || base.qualification,
    languagesKnown: toStringArray(application?.languagesKnown).length
      ? toStringArray(application?.languagesKnown)
      : companionLanguages.length
        ? companionLanguages
        : base.languagesKnown,
    communicationStyle: toStringArray(application?.communicationStyle).length
      ? toStringArray(application?.communicationStyle)
      : base.communicationStyle,
    hobbies: toStringArray(application?.hobbies).length ? toStringArray(application?.hobbies) : base.hobbies,
    profileTagline: toStringValue(application?.profileTagline) || toStringValue(companion?.tagline) || base.profileTagline,
    aboutYourself: toStringValue(application?.aboutYourself) || base.aboutYourself,
    servicesOffered: applicationServices.length ? applicationServices : companionServices.length ? companionServices : base.servicesOffered,
    categories: toStringArray(application?.categories).length
      ? toStringArray(application?.categories)
      : companionCategory
        ? [companionCategory]
        : base.categories,
  };
}

export default function PartnerProfilePage() {
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);
  const galleryImageInputRef = useRef<HTMLInputElement | null>(null);
  const [localProfile] = useState<PartnerProfile>(() => getLocalPartnerProfile<PartnerProfile>(defaultPartnerProfile));
  const [details, setDetails] = useState<DisplayProfileDetails>(() => fromLocalProfile(localProfile));
  const [media, setMedia] = useState<PartnerProfileMediaState>(EMPTY_MEDIA_STATE);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);
  const [deletingGalleryImagePath, setDeletingGalleryImagePath] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const approvalState = getLocalPartnerApprovalState();
  const isApproved = isPartnerApproved(approvalState);
  const labels = getPartnerApprovalLabel(approvalState);

  const canAddGalleryImage = media.galleryImages.length < MAX_PARTNER_GALLERY_IMAGES;
  const galleryCountLabel = useMemo(
    () => `${media.galleryImages.length}/${MAX_PARTNER_GALLERY_IMAGES}`,
    [media.galleryImages.length],
  );
  const previewImageUrl = media.profileImageUrl ?? media.resolvedProfileImageUrl ?? null;

  const rows = useMemo(
    () =>
      [
        ["Name", details.fullName],
        ["Age", details.age],
        ["Gender", details.gender],
        ["Religion", details.religion],
        ["Born City", details.bornCity],
        ["Nationality", details.nationality],
        ["School", details.school],
        ["College", details.college],
        ["Qualification", details.qualification],
        ["Languages Known", details.languagesKnown.join(", ")],
        ["Communication Style", details.communicationStyle.join(", ")],
        ["Hobbies", details.hobbies.join(", ")],
        ["Profile Tagline", details.profileTagline],
        ["About Yourself", details.aboutYourself],
        ["Services Offered", details.servicesOffered.join(", ")],
        [
          "Pricing",
          `Chat ${FIXED_PLATFORM_PRICE_LABELS.chat} | Audio ${FIXED_PLATFORM_PRICE_LABELS.audio} | Video ${FIXED_PLATFORM_PRICE_LABELS.video}`,
        ],
        ["Categories", details.categories.join(", ")],
      ] as const,
    [details],
  );

  useEffect(() => {
    const hydrateProfile = async () => {
      const [profileResponse, applicationsResponse] = await Promise.all([getPartnerProfileApi(), getPartnerApplications()]);
      const payloadFromProfile = profileResponse.data;
      const applicationPayload = (applicationsResponse.data as Record<string, unknown> | null)?.application as
        | Record<string, unknown>
        | null
        | undefined;
      const companionPayload =
        (payloadFromProfile?.companion as Record<string, unknown> | null | undefined) ??
        (applicationPayload?.companion as Record<string, unknown> | null | undefined) ??
        null;
      const merged = mergeDisplayProfile(fromLocalProfile(localProfile), {
        companion: companionPayload,
        application:
          (payloadFromProfile?.application as Record<string, unknown> | null | undefined) ??
          applicationPayload ??
          null,
      });
      setDetails(merged);
    };

    void hydrateProfile();
  }, [localProfile]);

  useEffect(() => {
    const loadMedia = async () => {
      setLoadingMedia(true);
      setErrorMessage("");
      const response = await getPartnerProfileMedia();
      if (response.error) {
        setErrorMessage(response.error.message || "Unable to load profile images right now.");
        setLoadingMedia(false);
        return;
      }
      setMedia((response.data as PartnerProfileMediaState | null) ?? EMPTY_MEDIA_STATE);
      setLoadingMedia(false);
    };

    void loadMedia();
  }, []);

  const handleProfileImageFile = async (file: File | null) => {
    if (!file || uploadingProfileImage) return;
    setSuccessMessage("");
    setErrorMessage("");
    setUploadingProfileImage(true);

    const previousStoragePath = media.profileImageStoragePath;
    try {
      const uploadResult = await uploadPartnerProfileMedia({ file, kind: "profile" });
      const saveResponse = await updatePartnerProfileImage({
        imageUrl: uploadResult.downloadUrl,
        storagePath: uploadResult.storagePath,
      });

      if (saveResponse.error || !saveResponse.data) {
        await deletePartnerProfileMediaByPath(uploadResult.storagePath);
        throw new Error(saveResponse.error?.message || "Unable to save profile image right now.");
      }

      setMedia((current) => ({
        ...current,
        profileImageUrl: saveResponse.data?.profileImageUrl ?? null,
        profileImageStoragePath: saveResponse.data?.profileImageStoragePath ?? null,
      }));
      setSuccessMessage("Profile image updated.");

      if (previousStoragePath && previousStoragePath !== uploadResult.storagePath) {
        await deletePartnerProfileMediaByPath(previousStoragePath);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to upload profile image right now.");
    } finally {
      setUploadingProfileImage(false);
      if (profileImageInputRef.current) {
        profileImageInputRef.current.value = "";
      }
    }
  };

  const handleGalleryImageFile = async (file: File | null) => {
    if (!file || uploadingGalleryImage) return;
    if (!canAddGalleryImage) {
      setErrorMessage(`You can upload up to ${MAX_PARTNER_GALLERY_IMAGES} gallery images.`);
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");
    setUploadingGalleryImage(true);

    try {
      const uploadResult = await uploadPartnerProfileMedia({ file, kind: "gallery" });
      const saveResponse = await addPartnerGalleryImage({
        imageUrl: uploadResult.downloadUrl,
        storagePath: uploadResult.storagePath,
      });

      if (saveResponse.error || !saveResponse.data) {
        await deletePartnerProfileMediaByPath(uploadResult.storagePath);
        throw new Error(saveResponse.error?.message || "Unable to save gallery image right now.");
      }

      setMedia((current) => ({
        ...current,
        galleryImages: saveResponse.data?.galleryImages ?? current.galleryImages,
      }));
      setSuccessMessage("Gallery image added.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to upload gallery image right now.");
    } finally {
      setUploadingGalleryImage(false);
      if (galleryImageInputRef.current) {
        galleryImageInputRef.current.value = "";
      }
    }
  };

  const handleDeleteGalleryImage = async (item: PartnerProfileMediaItem) => {
    if (!item.storagePath || deletingGalleryImagePath) return;
    setSuccessMessage("");
    setErrorMessage("");
    setDeletingGalleryImagePath(item.storagePath);

    const response = await deletePartnerGalleryImage({
      storagePath: item.storagePath,
      imageUrl: item.imageUrl,
    });
    if (response.error || !response.data) {
      setDeletingGalleryImagePath(null);
      setErrorMessage(response.error?.message || "Unable to delete gallery image right now.");
      return;
    }

    setMedia((current) => ({
      ...current,
      galleryImages: response.data?.galleryImages ?? [],
    }));
    setSuccessMessage("Gallery image removed.");
    setDeletingGalleryImagePath(null);
    await deletePartnerProfileMediaByPath(item.storagePath);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Profile</h2>
        <Link
          href="/partner/onboarding?edit=true"
          className="rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#0ea5a6] px-4 py-2 text-sm font-semibold text-white"
        >
          Edit Profile
        </Link>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-medium text-slate-500">Review Status</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                isApproved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {labels.kyc}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                isApproved ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
              }`}
            >
              {labels.review}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className={label === "About Yourself" ? "sm:col-span-2" : ""}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">{label}</p>
              <p className="mt-0.5 text-sm text-slate-800">{value || "-"}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Public Profile Photos</h3>
            <p className="text-xs text-slate-500">Manage your main profile image and gallery shown to users.</p>
          </div>
          <p className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
            Gallery {galleryCountLabel}
          </p>
        </div>

        {successMessage ? <p className="mt-3 text-xs font-medium text-emerald-700">{successMessage}</p> : null}
        {errorMessage ? <p className="mt-3 text-xs font-medium text-rose-600">{errorMessage}</p> : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Profile Picture</p>
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
              {previewImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewImageUrl} alt="Profile" className="h-44 w-full object-cover" />
              ) : (
                <div className="flex h-44 items-center justify-center text-xs font-medium text-slate-500">
                  No profile image yet
                </div>
              )}
            </div>
            <input
              ref={profileImageInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                void handleProfileImageFile(event.target.files?.[0] ?? null);
              }}
            />
            <button
              type="button"
              disabled={loadingMedia || uploadingProfileImage}
              onClick={() => profileImageInputRef.current?.click()}
              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploadingProfileImage ? "Uploading..." : previewImageUrl ? "Change profile photo" : "Upload profile photo"}
            </button>
            <p className="mt-2 text-[11px] text-slate-500">JPG, PNG, WEBP | max 5 MB</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Gallery</p>
            <input
              ref={galleryImageInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                void handleGalleryImageFile(event.target.files?.[0] ?? null);
              }}
            />

            {loadingMedia ? (
              <p className="mt-3 text-sm text-slate-500">Loading media...</p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {media.galleryImages.map((item) => (
                  <div key={item.storagePath || item.imageUrl} className="relative overflow-hidden rounded-lg border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt="Gallery" className="h-28 w-full object-cover sm:h-32" />
                    <button
                      type="button"
                      onClick={() => {
                        void handleDeleteGalleryImage(item);
                      }}
                      disabled={deletingGalleryImagePath === item.storagePath}
                      className="absolute right-2 top-2 rounded-md bg-black/65 px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-60"
                    >
                      {deletingGalleryImagePath === item.storagePath ? "Removing..." : "Delete"}
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  disabled={!canAddGalleryImage || uploadingGalleryImage}
                  onClick={() => galleryImageInputRef.current?.click()}
                  className="flex h-28 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-center text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:h-32"
                >
                  {uploadingGalleryImage ? "Uploading..." : canAddGalleryImage ? "Add photo" : "Gallery full"}
                </button>
              </div>
            )}

            <p className="mt-2 text-[11px] text-slate-500">
              Up to {MAX_PARTNER_GALLERY_IMAGES} images. These appear on your public partner profile.
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}
