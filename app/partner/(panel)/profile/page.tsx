"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PARTNER_FIREBASE_UID_KEY, getCurrentFirebaseUser } from "@/lib/auth/firebasePhoneAuth";
import {
  addPartnerGalleryImage,
  deletePartnerGalleryImage,
  getPartnerProfileMedia,
  type PartnerProfileMediaItem,
  updatePartnerProfileImage,
} from "@/lib/api/partner";
import { getPartnerApprovalLabel, getLocalPartnerApprovalState, isPartnerApproved } from "@/lib/partnerApproval";
import { getPartnerProfile } from "@/lib/partnerAuth";
import { defaultPartnerProfile, type PartnerProfile } from "@/lib/partnerData";
import {
  MAX_PARTNER_GALLERY_IMAGES,
  deletePartnerProfileMediaByPath,
  uploadPartnerProfileMedia,
} from "@/lib/firebasePartnerProfileUpload";

type PartnerProfileMediaState = {
  profileImageUrl: string | null;
  profileImageStoragePath: string | null;
  galleryImages: PartnerProfileMediaItem[];
};

const EMPTY_MEDIA_STATE: PartnerProfileMediaState = {
  profileImageUrl: null,
  profileImageStoragePath: null,
  galleryImages: [],
};

function resolvePartnerUid() {
  if (typeof window === "undefined") return "";
  const storedUid = window.localStorage.getItem(PARTNER_FIREBASE_UID_KEY)?.trim();
  if (storedUid) return storedUid;
  return getCurrentFirebaseUser()?.uid ?? "";
}

export default function PartnerProfilePage() {
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);
  const galleryImageInputRef = useRef<HTMLInputElement | null>(null);
  const [media, setMedia] = useState<PartnerProfileMediaState>(EMPTY_MEDIA_STATE);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);
  const [deletingGalleryImagePath, setDeletingGalleryImagePath] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const profile = getPartnerProfile<PartnerProfile>(defaultPartnerProfile);
  const approvalState = getLocalPartnerApprovalState();
  const isApproved = isPartnerApproved(approvalState);
  const labels = getPartnerApprovalLabel(approvalState);

  const rows = [
    ["Name", profile.fullName],
    ["Age", profile.age],
    ["Gender", profile.gender],
    ["Religion", profile.religion],
    ["Born City", profile.bornCity],
    ["Nationality", profile.nationality],
    ["School", profile.school],
    ["College", profile.college],
    ["Qualification", profile.qualification],
    ["Languages Known", profile.languagesKnown.join(", ")],
    ["Communication Style", profile.communicationStyle.join(", ")],
    ["Hobbies", profile.hobbies.join(", ")],
    ["Profile Tagline", profile.profileTagline],
    ["About Yourself", profile.aboutYourself],
    ["Services Offered", profile.servicesOffered.join(", ")],
    [
      "Pricing",
      `Chat ${profile.chatPricePerMinute || "0"}/min | Audio ${profile.audioPricePerMinute || "0"}/min | Video ${profile.videoPricePerMinute || "0"}/min`,
    ],
    ["Categories", profile.categories.join(", ")],
  ] as const;

  const canAddGalleryImage = media.galleryImages.length < MAX_PARTNER_GALLERY_IMAGES;
  const galleryCountLabel = useMemo(
    () => `${media.galleryImages.length}/${MAX_PARTNER_GALLERY_IMAGES}`,
    [media.galleryImages.length],
  );

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
      setMedia(response.data ?? EMPTY_MEDIA_STATE);
      setLoadingMedia(false);
    };

    void loadMedia();
  }, []);

  const handleProfileImageFile = async (file: File | null) => {
    if (!file || uploadingProfileImage) return;
    setSuccessMessage("");
    setErrorMessage("");
    setUploadingProfileImage(true);
    const uid = resolvePartnerUid();
    if (!uid) {
      setUploadingProfileImage(false);
      setErrorMessage("Your partner login session could not be verified. Please login again.");
      return;
    }

    const previousStoragePath = media.profileImageStoragePath;
    try {
      const uploadResult = await uploadPartnerProfileMedia({ file, uid, kind: "profile" });
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
    const uid = resolvePartnerUid();
    if (!uid) {
      setUploadingGalleryImage(false);
      setErrorMessage("Your partner login session could not be verified. Please login again.");
      return;
    }

    try {
      const uploadResult = await uploadPartnerProfileMedia({ file, uid, kind: "gallery" });
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
              {media.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media.profileImageUrl} alt="Profile" className="h-44 w-full object-cover" />
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
              {uploadingProfileImage ? "Uploading..." : media.profileImageUrl ? "Change profile photo" : "Upload profile photo"}
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
              Up to {MAX_PARTNER_GALLERY_IMAGES} images. These appear on your public companion profile.
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}
