"use client";

import { CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  PARTNER_FIREBASE_PHONE_KEY,
  clearPartnerStoredFirebaseToken,
  getPartnerStoredFirebaseToken,
  setPartnerStoredFirebaseToken,
} from "@/lib/auth/firebasePhoneAuth";
import { getPartnerApplications, getPartnerProfile as getPartnerProfileApi, submitPartnerApplication } from "@/lib/api/partner";
import { isApiBaseUrlConfigured } from "@/lib/api/client";
import { resolvePartnerLandingRoute, saveLocalPartnerApprovalState } from "@/lib/partnerApproval";
import { uploadPartnerKycFile, type PartnerKycUploadResult } from "@/lib/firebaseKycUpload";
import {
  AUDIO_RATE_PER_MIN,
  CHAT_RATE_PER_MIN,
  FIXED_PLATFORM_PRICE_LABELS,
  VIDEO_RATE_PER_MIN,
} from "@/lib/platformPricing";
import {
  completeClientDemoPartnerOnboarding,
  isClientDemoPartnerSession,
  isClientDemoPartnerSessionActive,
} from "@/lib/clientDemoData";
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

type OnboardingServiceType = Exclude<PartnerServiceType, "Home Visit">;
type OnboardingProfile = Omit<PartnerProfile, "servicesOffered"> & {
  servicesOffered: OnboardingServiceType[];
};
type ValidationErrors = Partial<Record<keyof OnboardingProfile | "base", string>>;
type KycUploadType = "selfie" | "aadhaar-front" | "aadhaar-back" | "pan";
type KycUploadState = {
  selfie: PartnerKycUploadResult | null;
  aadhaarFront: PartnerKycUploadResult | null;
  aadhaarBack: PartnerKycUploadResult | null;
  pan: PartnerKycUploadResult | null;
};
type LiveVideoState = {
  file: File | null;
  upload: PartnerKycUploadResult | null;
  objectUrl: string;
};

const stepTitles = [
  "Basic details",
  "Background",
  "Languages & comfort style",
  "About your support style",
  "Services & pricing",
  "KYC documents",
  "Live video verification",
  "Safety agreement",
];
const REQUIRED_DOCUMENTS_MESSAGE = "Please upload all required verification documents before submitting.";
const LIVE_VIDEO_REQUIRED_MESSAGE = "Please complete live video verification before submitting.";
const LIVE_VIDEO_UNSUPPORTED_MESSAGE =
  "Your browser does not support live video recording. Please try Chrome on Android or another supported browser.";
const CAMERA_PERMISSION_DENIED_MESSAGE =
  "Camera permission is blocked. Please allow Camera and Microphone from your browser site settings, then reload and try again.";
const CAMERA_ALREADY_IN_USE_MESSAGE =
  "Camera is already being used by another app. Close it and try again.";
const CAMERA_REQUIRES_HTTPS_MESSAGE =
  "Camera requires HTTPS. Please open YoPartner using https://yopartner.com.";
const CAMERA_PERMISSION_HELP_STEPS = [
  "Tap the lock/settings icon in your browser address bar.",
  "Open Site settings.",
  "Set Camera to Allow.",
  "Set Microphone to Allow.",
  "Reload this page.",
  "Tap Enable Camera again.",
];
const LIVE_VIDEO_MIN_SECONDS = 10;
const LIVE_VIDEO_MAX_SECONDS = 30;

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

function formatDocumentSelectionStatus(hasDocument: boolean) {
  return hasDocument ? "Selected" : "Pending";
}

function isValidPartnerAge(value: string) {
  const age = Number(value);
  return Number.isInteger(age) && age >= 18 && age <= 70;
}

function hasUploadedArtifact(upload: PartnerKycUploadResult | null) {
  return Boolean(upload?.fileName && upload.storagePath);
}

function hasLiveVideoArtifact(upload: PartnerKycUploadResult | null) {
  return hasUploadedArtifact(upload) && Boolean(upload?.storagePath.includes("/live-video/"));
}

function getLiveVideoMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const supportedTypes = [
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  return supportedTypes.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function getCameraErrorName(error: unknown) {
  return typeof error === "object" && error && "name" in error
    ? String((error as { name?: unknown }).name ?? "")
    : "";
}

function shouldRetryVideoOnly(error: unknown) {
  const name = getCameraErrorName(error);
  return ["NotFoundError", "OverconstrainedError", "ConstraintNotSatisfiedError"].includes(name);
}

function getCameraPermissionMessage(error: unknown) {
  const name = getCameraErrorName(error);
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return CAMERA_PERMISSION_DENIED_MESSAGE;
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return CAMERA_ALREADY_IN_USE_MESSAGE;
  }
  if (name === "SecurityError") {
    return CAMERA_REQUIRES_HTTPS_MESSAGE;
  }
  return "Camera and microphone permission is required to record live verification.";
}

function getLiveCameraErrorMessage(error: unknown) {
  const rawMessage = error instanceof Error ? error.message.trim() : "";
  if (rawMessage === LIVE_VIDEO_UNSUPPORTED_MESSAGE || rawMessage === CAMERA_REQUIRES_HTTPS_MESSAGE) {
    return rawMessage;
  }
  return getCameraPermissionMessage(error);
}

async function readBrowserPermissionState(name: "camera" | "microphone") {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) return "unsupported";
  try {
    const status = await navigator.permissions.query({ name: name as PermissionName });
    return status.state;
  } catch {
    return "unsupported";
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toOptionalString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function toOptionalStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toOptionalNumericString(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim().length > 0 && /^\d+$/.test(value.trim())) return value.trim();
  return "";
}

function mergeIfEmpty(currentValue: string, nextValue: string) {
  return currentValue.trim().length > 0 ? currentValue : nextValue;
}

function mergeArrayIfEmpty<T>(currentValue: T[], nextValue: T[]) {
  return currentValue.length > 0 ? currentValue : nextValue;
}

function toPartnerGender(value: unknown): PartnerProfile["gender"] {
  if (value === "Female" || value === "Male" || value === "Other" || value === "Prefer not to say") {
    return value;
  }
  return "";
}

function toOnboardingServices(value: unknown): OnboardingServiceType[] {
  return toOptionalStringArray(value)
    .map((item) => {
      const normalized = item.toUpperCase();
      if (normalized === "CHAT") return "Chat";
      if (normalized === "AUDIO") return "Audio Call";
      if (normalized === "VIDEO") return "Video Call";
      if (item === "Chat" || item === "Audio Call" || item === "Video Call") return item;
      return "";
    })
    .filter((item): item is OnboardingServiceType => Boolean(item));
}

function mergeWithBackendProfile(
  current: OnboardingProfile,
  companionInput: Record<string, unknown> | null,
  applicationInput: Record<string, unknown> | null,
) {
  const companion = companionInput ?? {};
  const application = applicationInput ?? {};
  const applicationServices = toOnboardingServices(application.servicesOffered);
  const companionServices = toOnboardingServices(companion.servicesOffered);
  const categoryFromCompanion = toOptionalString(companion.category);

  return {
    ...current,
    fullName: mergeIfEmpty(current.fullName, toOptionalString(application.fullName) || toOptionalString(companion.displayName)),
    age: mergeIfEmpty(current.age, toOptionalNumericString(application.age)),
    gender: current.gender || toPartnerGender(application.gender),
    religion: mergeIfEmpty(current.religion, toOptionalString(application.religion)),
    bornCity: mergeIfEmpty(current.bornCity, toOptionalString(application.bornCity) || toOptionalString(companion.city)),
    nationality: mergeIfEmpty(current.nationality, toOptionalString(application.nationality)),
    school: mergeIfEmpty(current.school, toOptionalString(application.school)),
    college: mergeIfEmpty(current.college, toOptionalString(application.college)),
    qualification: mergeIfEmpty(current.qualification, toOptionalString(application.qualification)),
    languagesKnown: mergeArrayIfEmpty(
      current.languagesKnown,
      toOptionalStringArray(application.languagesKnown).length
        ? toOptionalStringArray(application.languagesKnown)
        : toOptionalStringArray(companion.languages),
    ),
    communicationStyle: mergeArrayIfEmpty(current.communicationStyle, toOptionalStringArray(application.communicationStyle)),
    hobbies: mergeArrayIfEmpty(current.hobbies, toOptionalStringArray(application.hobbies)),
    profileTagline: mergeIfEmpty(
      current.profileTagline,
      toOptionalString(application.profileTagline) || toOptionalString(companion.tagline),
    ),
    aboutYourself: mergeIfEmpty(current.aboutYourself, toOptionalString(application.aboutYourself)),
    servicesOffered: mergeArrayIfEmpty(
      current.servicesOffered,
      applicationServices.length ? applicationServices : companionServices,
    ),
    chatPricePerMinute: mergeIfEmpty(
      current.chatPricePerMinute,
      toOptionalNumericString(application.chatPrice) || toOptionalNumericString(companion.chatPrice),
    ),
    audioPricePerMinute: mergeIfEmpty(
      current.audioPricePerMinute,
      toOptionalNumericString(application.audioPrice) || toOptionalNumericString(companion.audioPrice),
    ),
    videoPricePerMinute: mergeIfEmpty(
      current.videoPricePerMinute,
      toOptionalNumericString(application.videoPrice) || toOptionalNumericString(companion.videoPrice),
    ),
    categories: mergeArrayIfEmpty(
      current.categories,
      toOptionalStringArray(application.categories).length
        ? toOptionalStringArray(application.categories)
        : categoryFromCompanion
          ? [categoryFromCompanion]
          : [],
    ),
    selfieFileName: mergeIfEmpty(current.selfieFileName, toOptionalString(application.selfieFileName)),
    aadhaarFrontFileName: mergeIfEmpty(current.aadhaarFrontFileName, toOptionalString(application.aadhaarFrontFileName)),
    aadhaarBackFileName: mergeIfEmpty(current.aadhaarBackFileName, toOptionalString(application.aadhaarBackFileName)),
    panFileName: mergeIfEmpty(current.panFileName, toOptionalString(application.panFileName)),
    aadhaarFileName: mergeIfEmpty(
      current.aadhaarFileName,
      toOptionalString(application.aadhaarFrontFileName) || toOptionalString(application.aadhaarBackFileName),
    ),
  };
}

function toOnboardingProfile(source: PartnerProfile): OnboardingProfile {
  return {
    ...source,
    servicesOffered: sanitizeServices(source.servicesOffered as string[]),
  };
}

function toPartnerOnboardingPayload(
  profile: OnboardingProfile,
  uploads: KycUploadState,
  liveVideoUpload: PartnerKycUploadResult | null,
) {
  const backendSupportedServices = profile.servicesOffered
    .map((service) => {
      if (service === "Chat") return "Chat";
      if (service === "Audio Call") return "Audio Call";
      return "Video Call";
    });
  const safetyChecklist = [];
  if (profile.safetyPlatonicOnly) safetyChecklist.push("strictly platonic");
  if (profile.safetyRespectfulRules) safetyChecklist.push("respectful communication");
  if (profile.safetyNoOutsidePayments) safetyChecklist.push("no personal payment/contact sharing");
  if (profile.safetyReviewVerification) safetyChecklist.push("profile review and verification");

  const selfieUploaded = Boolean(uploads.selfie?.downloadUrl || uploads.selfie?.storagePath || uploads.selfie?.fileName);
  const aadhaarFrontUploaded = Boolean(
    uploads.aadhaarFront?.downloadUrl || uploads.aadhaarFront?.storagePath || uploads.aadhaarFront?.fileName,
  );
  const aadhaarBackUploaded = Boolean(
    uploads.aadhaarBack?.downloadUrl || uploads.aadhaarBack?.storagePath || uploads.aadhaarBack?.fileName,
  );
  const panUploaded = Boolean(uploads.pan?.downloadUrl || uploads.pan?.storagePath || uploads.pan?.fileName);
  const liveVideoUploaded = Boolean(
    liveVideoUpload?.downloadUrl || liveVideoUpload?.storagePath || liveVideoUpload?.fileName,
  );

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
    servicesOffered: backendSupportedServices,
    chatPrice: CHAT_RATE_PER_MIN,
    audioPrice: AUDIO_RATE_PER_MIN,
    videoPrice: VIDEO_RATE_PER_MIN,
    homeVisitRequested: false,
    categories: profile.categories,
    safetyChecklist,
    selfieUploaded,
    selfieFileName: uploads.selfie?.fileName || undefined,
    selfieStoragePath: uploads.selfie?.storagePath || undefined,
    selfieUrl: uploads.selfie?.downloadUrl || undefined,
    aadhaarFrontUploaded,
    aadhaarFrontFileName: uploads.aadhaarFront?.fileName || undefined,
    aadhaarFrontStoragePath: uploads.aadhaarFront?.storagePath || undefined,
    aadhaarFrontUrl: uploads.aadhaarFront?.downloadUrl || undefined,
    aadhaarBackUploaded,
    aadhaarBackFileName: uploads.aadhaarBack?.fileName || undefined,
    aadhaarBackStoragePath: uploads.aadhaarBack?.storagePath || undefined,
    aadhaarBackUrl: uploads.aadhaarBack?.downloadUrl || undefined,
    panUploaded,
    panFileName: uploads.pan?.fileName || undefined,
    panStoragePath: uploads.pan?.storagePath || undefined,
    panUrl: uploads.pan?.downloadUrl || undefined,
    liveVerificationName: profile.fullName.trim(),
    liveVerificationAge: Number(profile.age) || 0,
    liveVerificationHobbies: profile.hobbies.join(", "),
    liveVideoUploaded,
    liveVideoFileName: liveVideoUpload?.fileName || undefined,
    liveVideoStoragePath: liveVideoUpload?.storagePath || undefined,
    aadhaarFileName:
      uploads.aadhaarFront?.fileName ||
      uploads.aadhaarBack?.fileName ||
      profile.aadhaarFileName ||
      undefined,
  };
}

async function waitForFirebaseUser(timeoutMs = 8000) {
  if (typeof window === "undefined") return null;
  const auth = firebaseAuth;
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;

  return new Promise<User | null>((resolve) => {
    let settled = false;
    let pendingUnsubscribe = false;
    let unsubscribe: (() => void) | null = null;
    const timeout = window.setTimeout(() => finish(null), timeoutMs);

    const finish = (user: User | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      if (unsubscribe) {
        unsubscribe();
      } else {
        pendingUnsubscribe = true;
      }
      resolve(user);
    };

    unsubscribe = onAuthStateChanged(auth, (user) => finish(user));
    if (pendingUnsubscribe) unsubscribe();
  });
}

export default function PartnerOnboardingPage() {
  const router = useRouter();
  const isDemoPartnerSession = isClientDemoPartnerSessionActive();
  const [isEditMode, setIsEditMode] = useState<boolean | null>(null);
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
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState<File | null>(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [kycUploads, setKycUploads] = useState<KycUploadState>({
    selfie: null,
    aadhaarFront: null,
    aadhaarBack: null,
    pan: null,
  });
  const [liveVideo, setLiveVideo] = useState<LiveVideoState>({
    file: null,
    upload: null,
    objectUrl: "",
  });
  const [isRecordingLiveVideo, setIsRecordingLiveVideo] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isEnablingCamera, setIsEnablingCamera] = useState(false);
  const [isVideoOnlyRecording, setIsVideoOnlyRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState("");
  const [permissionCheckMessage, setPermissionCheckMessage] = useState("");
  const liveStreamVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const liveVideoChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef(0);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingStopTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsEditMode(new URLSearchParams(window.location.search).get("edit") === "true");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isPartnerLoggedIn() || !getPartnerPhone()) {
      router.replace("/partner/login");
    }
  }, [router]);

  useEffect(() => {
    if (!IS_PRODUCTION_READY_MODE) return;
    if (isEditMode === null) return;

    let active = true;
    const hydrateExistingApplication = async () => {
      const landing = await resolvePartnerLandingRoute();
      if (!active) return;
      if ((landing.route === "/partner/dashboard" && !isEditMode) || landing.route === "/partner/application-status") {
        router.replace(landing.route);
        return;
      }

      const [profileResponse, applicationsResponse] = await Promise.all([getPartnerProfileApi(), getPartnerApplications()]);
      if (!active) return;

      const profilePayload = asRecord(profileResponse.data);
      const applicationsPayload = asRecord(applicationsResponse.data);
      const applicationFromProfile = asRecord(profilePayload.application);
      const applicationFromApplications = asRecord(applicationsPayload.application);
      const companionFromProfile = asRecord(profilePayload.companion);
      const companionFromApplication = asRecord(applicationFromApplications.companion);

      const application = Object.keys(applicationFromProfile).length > 0 ? applicationFromProfile : applicationFromApplications;
      const companion = Object.keys(companionFromProfile).length > 0 ? companionFromProfile : companionFromApplication;

      if (Object.keys(application).length === 0 && Object.keys(companion).length === 0) return;
      setProfile((current) => mergeWithBackendProfile(current, companion, application));
    };

    void hydrateExistingApplication();
    return () => {
      active = false;
    };
  }, [isEditMode, router]);

  useEffect(() => {
    if (!IS_DEMO_MODE) return;
    savePartnerDraft(profile);
  }, [profile]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
      if (recordingStopTimerRef.current) window.clearTimeout(recordingStopTimerRef.current);
      liveStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (liveVideo.objectUrl) URL.revokeObjectURL(liveVideo.objectUrl);
    };
  }, [liveVideo.objectUrl]);

  useEffect(() => {
    if (liveStreamVideoRef.current && liveStreamRef.current) {
      liveStreamVideoRef.current.srcObject = liveStreamRef.current;
    }
  }, [isCameraEnabled, isRecordingLiveVideo]);

  const requiredDocumentsSelected = Boolean(
    (selfieFile || kycUploads.selfie) &&
      (aadhaarFrontFile || kycUploads.aadhaarFront) &&
      (aadhaarBackFile || kycUploads.aadhaarBack) &&
      (panFile || kycUploads.pan),
  );
  const liveVerificationScript = `My name is ${profile.fullName || "[name]"}. I am ${
    profile.age || "[age]"
  } years old. I am applying to become a YoPartner partner. My hobbies are ${
    profile.hobbies.length > 0 ? profile.hobbies.join(", ") : "[hobbies]"
  }. I agree to follow YoPartner safety and respectful communication rules.`;

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
        value: `Chat ${FIXED_PLATFORM_PRICE_LABELS.chat}, Audio ${FIXED_PLATFORM_PRICE_LABELS.audio}, Video ${FIXED_PLATFORM_PRICE_LABELS.video}`,
      },
      { label: "Categories", value: profile.categories.join(", ") || "-" },
      {
        label: "Selfie",
        value: formatDocumentSelectionStatus(Boolean(selfieFile || kycUploads.selfie || profile.selfieFileName)),
      },
      {
        label: "Aadhaar Front",
        value: formatDocumentSelectionStatus(
          Boolean(aadhaarFrontFile || kycUploads.aadhaarFront || profile.aadhaarFrontFileName),
        ),
      },
      {
        label: "Aadhaar Back",
        value: formatDocumentSelectionStatus(
          Boolean(aadhaarBackFile || kycUploads.aadhaarBack || profile.aadhaarBackFileName),
        ),
      },
      {
        label: "PAN",
        value: formatDocumentSelectionStatus(Boolean(panFile || kycUploads.pan || profile.panFileName)),
      },
      {
        label: "Live video",
        value: formatDocumentSelectionStatus(Boolean(liveVideo.file || liveVideo.upload)),
      },
    ],
    [aadhaarBackFile, aadhaarFrontFile, kycUploads, liveVideo.file, liveVideo.upload, panFile, profile, selfieFile],
  );

  const validateStep = (stepIndex: number): ValidationErrors => {
    const nextErrors: ValidationErrors = {};

    if (stepIndex === 0) {
      if (!profile.fullName.trim()) nextErrors.fullName = "Full Name is required.";
      if (profile.fullName.trim() && profile.fullName.trim().length < 2) {
        nextErrors.fullName = "Full Name must be at least 2 characters.";
      }
      if (!profile.age.trim()) nextErrors.age = "Age is required.";
      if (profile.age.trim() && !isValidPartnerAge(profile.age)) {
        nextErrors.age = "Age must be a number between 18 and 70.";
      }
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
      if (profile.profileTagline.trim() && profile.profileTagline.trim().length < 6) {
        nextErrors.profileTagline = "Profile Tagline must be at least 6 characters.";
      }
      if (!profile.aboutYourself.trim()) nextErrors.aboutYourself = "About Yourself is required.";
      if (profile.aboutYourself.trim().length < 80) {
        nextErrors.aboutYourself = "About Yourself must be at least 80 characters.";
      }
    }

    if (stepIndex === 4) {
      if (profile.servicesOffered.length === 0) nextErrors.servicesOffered = "Select at least one service.";
      if (profile.categories.length === 0) nextErrors.categories = "Select at least one category.";
    }

    if (stepIndex === 5 && !requiredDocumentsSelected) {
      nextErrors.base = REQUIRED_DOCUMENTS_MESSAGE;
    }

    if (stepIndex === 6) {
      if (!profile.fullName.trim()) nextErrors.fullName = "Full Name is required.";
      if (!profile.age.trim()) nextErrors.age = "Age is required.";
      if (profile.age.trim() && !isValidPartnerAge(profile.age)) {
        nextErrors.age = "Age must be a number between 18 and 70.";
      }
      if (profile.hobbies.length === 0) nextErrors.hobbies = "Select at least one hobby.";
      if (!liveVideo.file && !liveVideo.upload) {
        nextErrors.base = LIVE_VIDEO_REQUIRED_MESSAGE;
      }
    }

    if (stepIndex === 7) {
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

  const findFirstSubmitValidationError = () => {
    for (let stepIndex = 0; stepIndex < stepTitles.length; stepIndex += 1) {
      const stepErrors = validateStep(stepIndex);
      if (Object.keys(stepErrors).length > 0) {
        return { stepIndex, stepErrors };
      }
    }
    return null;
  };

  const getSubmitErrorStep = (message: string) => {
    const normalized = message.toLowerCase();
    if (
      normalized.includes("full name") ||
      normalized.includes("age") ||
      normalized.includes("gender") ||
      normalized.includes("religion") ||
      normalized.includes("born city") ||
      normalized.includes("nationality")
    ) return 0;
    if (
      normalized.includes("school") ||
      normalized.includes("college") ||
      normalized.includes("qualification")
    ) return 1;
    if (
      normalized.includes("language") ||
      normalized.includes("communication") ||
      normalized.includes("hobbies")
    ) return 2;
    if (
      normalized.includes("profile tagline") ||
      normalized.includes("about yourself")
    ) return 3;
    if (normalized.includes("service") || normalized.includes("categor")) return 4;
    if (normalized.includes("document") || normalized.includes("aadhaar") || normalized.includes("pan") || normalized.includes("selfie")) return 5;
    if (normalized.includes("live video") || normalized.includes("live verification")) return 6;
    if (normalized.includes("safety")) return 7;
    return null;
  };

  const getSubmitErrorMessage = (error: NonNullable<Awaited<ReturnType<typeof submitPartnerApplication>>["error"]>) => {
    const details = asRecord(error.details);
    const validationErrors = Array.isArray(details.validationErrors) ? details.validationErrors : [];
    const firstValidationError = asRecord(validationErrors[0]);
    const label = toOptionalString(firstValidationError.label);
    const validationMessage = toOptionalString(firstValidationError.message);
    if (label && validationMessage) return `${label}: ${validationMessage}`;
    return error.message || "Unknown error";
  };

  const validateUploadedArtifacts = (
    uploads: KycUploadState,
    liveVideoUpload: PartnerKycUploadResult | null,
  ) => {
    if (!hasUploadedArtifact(uploads.selfie)) {
      return { stepIndex: 5, message: "Selfie upload path is missing. Please reselect and upload your selfie." };
    }
    if (!hasUploadedArtifact(uploads.aadhaarFront)) {
      return { stepIndex: 5, message: "Aadhaar Front upload path is missing. Please reselect and upload Aadhaar Front." };
    }
    if (!hasUploadedArtifact(uploads.aadhaarBack)) {
      return { stepIndex: 5, message: "Aadhaar Back upload path is missing. Please reselect and upload Aadhaar Back." };
    }
    if (!hasUploadedArtifact(uploads.pan)) {
      return { stepIndex: 5, message: "PAN upload path is missing. Please reselect and upload PAN." };
    }
    if (!hasLiveVideoArtifact(liveVideoUpload)) {
      return { stepIndex: 6, message: "Live video upload path is missing. Please record and upload live verification again." };
    }
    return null;
  };

  const stopLiveRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const clearRecordingTimers = () => {
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (recordingStopTimerRef.current) {
      window.clearTimeout(recordingStopTimerRef.current);
      recordingStopTimerRef.current = null;
    }
  };

  const stopLiveStream = () => {
    liveStreamRef.current?.getTracks().forEach((track) => track.stop());
    liveStreamRef.current = null;
    if (liveStreamVideoRef.current) {
      liveStreamVideoRef.current.srcObject = null;
    }
    setIsCameraEnabled(false);
    setIsVideoOnlyRecording(false);
  };

  const requestLiveCameraStream = async () => {
    if (typeof window === "undefined") {
      throw new Error(LIVE_VIDEO_UNSUPPORTED_MESSAGE);
    }
    if (window.isSecureContext === false) {
      throw new Error(CAMERA_REQUIRES_HTTPS_MESSAGE);
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(LIVE_VIDEO_UNSUPPORTED_MESSAGE);
    }

    try {
      setIsVideoOnlyRecording(false);
      return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (error) {
      if (!shouldRetryVideoOnly(error)) throw error;
      const videoOnlyStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setIsVideoOnlyRecording(true);
      return videoOnlyStream;
    }
  };

  const handleEnableCamera = async () => {
    setRecordingError("");
    setPermissionCheckMessage("");
    setErrors({});
    setIsEnablingCamera(true);
    stopLiveStream();
    try {
      const stream = await requestLiveCameraStream();
      liveStreamRef.current = stream;
      setIsCameraEnabled(true);
      if (liveStreamVideoRef.current) {
        liveStreamVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      stopLiveStream();
      setRecordingError(getLiveCameraErrorMessage(error));
    } finally {
      setIsEnablingCamera(false);
    }
  };

  const handleCheckCameraPermission = async () => {
    setPermissionCheckMessage("");
    const [cameraState, microphoneState] = await Promise.all([
      readBrowserPermissionState("camera"),
      readBrowserPermissionState("microphone"),
    ]);
    if (cameraState === "unsupported" && microphoneState === "unsupported") {
      setPermissionCheckMessage("This browser does not expose permission status here. Use browser site settings, then reload and retry.");
      return;
    }
    setPermissionCheckMessage(`Camera: ${cameraState}. Microphone: ${microphoneState}.`);
  };

  const handleStartLiveRecording = async () => {
    setRecordingError("");
    setPermissionCheckMessage("");
    setErrors({});
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      setRecordingError(LIVE_VIDEO_UNSUPPORTED_MESSAGE);
      return;
    }
    let stream = liveStreamRef.current;
    if (!stream || stream.getTracks().every((track) => track.readyState === "ended")) {
      try {
        stream = await requestLiveCameraStream();
        liveStreamRef.current = stream;
        setIsCameraEnabled(true);
      } catch (error) {
        setRecordingError(getLiveCameraErrorMessage(error));
        stopLiveStream();
        return;
      }
    }

    const mimeType = getLiveVideoMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch {
      setRecordingError(LIVE_VIDEO_UNSUPPORTED_MESSAGE);
      return;
    }

    try {
      liveVideoChunksRef.current = [];
      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();
      setRecordingSeconds(0);
      setIsRecordingLiveVideo(true);
      setLiveVideo((current) => {
        if (current.objectUrl) URL.revokeObjectURL(current.objectUrl);
        return { file: null, upload: null, objectUrl: "" };
      });

      if (liveStreamVideoRef.current) {
        liveStreamVideoRef.current.srcObject = stream;
      }

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) liveVideoChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        clearRecordingTimers();
        setIsRecordingLiveVideo(false);
        stopLiveStream();
        const seconds = Math.round((Date.now() - recordingStartedAtRef.current) / 1000);
        setRecordingSeconds(seconds);
        if (seconds < LIVE_VIDEO_MIN_SECONDS) {
          setRecordingError(`Please record at least ${LIVE_VIDEO_MIN_SECONDS} seconds for live verification.`);
          return;
        }
        const blobType = recorder.mimeType || "video/webm";
        const blob = new Blob(liveVideoChunksRef.current, { type: blobType });
        const extension = blobType.includes("mp4") ? "mp4" : "webm";
        const file = new File([blob], `live-verification-${Date.now()}.${extension}`, { type: blobType });
        setLiveVideo((current) => {
          if (current.objectUrl) URL.revokeObjectURL(current.objectUrl);
          return {
            file,
            upload: null,
            objectUrl: URL.createObjectURL(blob),
          };
        });
        setRecordingError("");
      };

      recorder.start();
      recordingTimerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartedAtRef.current) / 1000);
        setRecordingSeconds(elapsed);
      }, 250);
      recordingStopTimerRef.current = window.setTimeout(stopLiveRecording, LIVE_VIDEO_MAX_SECONDS * 1000);
    } catch (error) {
      clearRecordingTimers();
      stopLiveStream();
      setIsRecordingLiveVideo(false);
      setRecordingError(getCameraPermissionMessage(error));
    }
  };

  const handleRemoveLiveVideo = () => {
    stopLiveStream();
    setLiveVideo((current) => {
      if (current.objectUrl) URL.revokeObjectURL(current.objectUrl);
      return { file: null, upload: null, objectUrl: "" };
    });
    setRecordingSeconds(0);
    setRecordingError("");
  };

  const handleContinue = () => {
    const stepErrors = validateStep(step);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    setStep((current) => Math.min(current + 1, stepTitles.length - 1));
  };

  const handleSubmit = () => {
    const firstValidationError = findFirstSubmitValidationError();
    setSubmitMessage("");
    if (firstValidationError) {
      setErrors(firstValidationError.stepErrors);
      setStep(firstValidationError.stepIndex);
      return;
    }
    if (!requiredDocumentsSelected) {
      setErrors({ base: REQUIRED_DOCUMENTS_MESSAGE });
      setStep(5);
      return;
    }
    if (!liveVideo.file && !liveVideo.upload) {
      setErrors({ base: LIVE_VIDEO_REQUIRED_MESSAGE });
      setStep(6);
      return;
    }

    const finalProfile: OnboardingProfile = {
      ...profile,
      reviewStatus: "under_review",
    };

    if (IS_DEMO_MODE && isClientDemoPartnerSession(getPartnerPhone())) {
      setIsSubmitting(true);
      completeClientDemoPartnerOnboarding(finalProfile);
      setSubmitMessage("Your profile has been submitted for review.");
      window.setTimeout(() => {
        setIsSubmitting(false);
        router.push("/partner/dashboard");
      }, 900);
      return;
    }

    if (IS_PRODUCTION_READY_MODE) {
      void (async () => {
        setIsSubmitting(true);
        if (!isApiBaseUrlConfigured()) {
          setErrors({ base: "Backend API URL is not configured. Please set NEXT_PUBLIC_API_BASE_URL." });
          setIsSubmitting(false);
          return;
        }
        let hadTokenBeforeSubmit = Boolean(getPartnerStoredFirebaseToken());
        const user = await waitForFirebaseUser();
        if (user) {
          try {
            const freshToken = await user.getIdToken(true);
            if (process.env.NODE_ENV !== "production") {
              const tokenResult = await user.getIdTokenResult();
              const tokenAud = String(tokenResult.claims.aud ?? "");
              const firebaseProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
              if (tokenAud && firebaseProject && tokenAud !== firebaseProject) {
                console.warn("[partner onboarding] Firebase project mismatch detected", {
                  tokenProject: tokenAud,
                  frontendProject: firebaseProject,
                });
              }
            }
            setPartnerStoredFirebaseToken(freshToken);
            hadTokenBeforeSubmit = true;
          } catch {
            setErrors({ base: "Your login session could not be verified. Please login again as a partner." });
            setIsSubmitting(false);
            router.replace("/partner/login?reason=session-expired");
            return;
          }
        } else {
          setErrors({ base: "Your login session could not be verified. Please login again as a partner." });
          setIsSubmitting(false);
          router.replace("/partner/login?reason=session-expired");
          return;
        }
        const uid = user.uid;
        let nextUploads: KycUploadState = { ...kycUploads };
        let nextLiveVideoUpload = liveVideo.upload;
        try {
          const uploadIfSelected = async (file: File | null, type: KycUploadType) => {
            if (!file) return null;
            return uploadPartnerKycFile({ file, uid, type });
          };

          const [selfieUpload, aadhaarFrontUpload, aadhaarBackUpload, panUpload] = await Promise.all([
            uploadIfSelected(selfieFile, "selfie"),
            uploadIfSelected(aadhaarFrontFile, "aadhaar-front"),
            uploadIfSelected(aadhaarBackFile, "aadhaar-back"),
            uploadIfSelected(panFile, "pan"),
          ]);

          if (selfieUpload) nextUploads = { ...nextUploads, selfie: selfieUpload };
          if (aadhaarFrontUpload) nextUploads = { ...nextUploads, aadhaarFront: aadhaarFrontUpload };
          if (aadhaarBackUpload) nextUploads = { ...nextUploads, aadhaarBack: aadhaarBackUpload };
          if (panUpload) nextUploads = { ...nextUploads, pan: panUpload };
          if (liveVideo.file) {
            nextLiveVideoUpload = await uploadPartnerKycFile({
              file: liveVideo.file,
              uid,
              type: "live-video",
            });
          }

          setKycUploads(nextUploads);
          setLiveVideo((current) => ({
            ...current,
            file: null,
            upload: nextLiveVideoUpload,
          }));
          setSelfieFile(null);
          setAadhaarFrontFile(null);
          setAadhaarBackFile(null);
          setPanFile(null);
        } catch (uploadError) {
          const uploadMessage =
            uploadError instanceof Error && uploadError.message
              ? uploadError.message
              : "Could not upload verification documents. Please try again.";
          setErrors({ base: uploadMessage || "Could not upload verification documents. Please try again." });
          setIsSubmitting(false);
          return;
        }

        const uploadValidationError = validateUploadedArtifacts(nextUploads, nextLiveVideoUpload);
        if (uploadValidationError) {
          setErrors({ base: uploadValidationError.message });
          setStep(uploadValidationError.stepIndex);
          setIsSubmitting(false);
          return;
        }

        const payload = toPartnerOnboardingPayload(finalProfile, nextUploads, nextLiveVideoUpload);
        if (process.env.NODE_ENV !== "production") {
          console.info("[partner onboarding] submit payload", payload);
        }
        const response = await submitPartnerApplication(payload);
        if (response.error) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[partner onboarding] submit response body", response.error.details ?? response.error);
          }
          if (response.error.status === 401) {
            clearPartnerStoredFirebaseToken();
            if (typeof window !== "undefined") {
              window.localStorage.removeItem(PARTNER_FIREBASE_PHONE_KEY);
            }
            if (process.env.NODE_ENV !== "production") {
              console.warn("[partner onboarding] submit returned 401", { hadTokenBeforeSubmit });
            }
            setErrors({ base: "Your login session could not be verified. Please login again as a partner." });
            setIsSubmitting(false);
            router.replace("/partner/login?reason=session-expired");
            return;
          }
          const statusLabel = response.error.status ?? "ERR";
          const message = getSubmitErrorMessage(response.error);
          const submitErrorStep = getSubmitErrorStep(message);
          if (submitErrorStep !== null) {
            setStep(submitErrorStep);
          }
          setErrors({ base: `Submit failed (${statusLabel}): ${message}` });
          setIsSubmitting(false);
          return;
        }
        const savedProfile: OnboardingProfile = {
          ...finalProfile,
          selfieFileName: nextUploads.selfie?.fileName || finalProfile.selfieFileName,
          aadhaarFrontFileName: nextUploads.aadhaarFront?.fileName || finalProfile.aadhaarFrontFileName,
          aadhaarBackFileName: nextUploads.aadhaarBack?.fileName || finalProfile.aadhaarBackFileName,
          aadhaarFileName:
            nextUploads.aadhaarFront?.fileName ||
            nextUploads.aadhaarBack?.fileName ||
            finalProfile.aadhaarFileName,
          panFileName: nextUploads.pan?.fileName || finalProfile.panFileName,
        };
        setProfile(savedProfile);
        saveLocalPartnerApprovalState({
          applicationStatus: "UNDER_REVIEW",
          kycStatus: "PENDING",
          verificationStatus: "PENDING",
          companionStatus: "UNDER_REVIEW",
          reviewStatus: "under_review",
        });
        setPartnerOnboardingComplete(true);
        setPartnerOnlineStatus(false);
        savePartnerProfile(savedProfile);
        savePartnerDraft(savedProfile);
        setSubmitMessage("Your profile has been submitted for review.");
        window.setTimeout(() => {
          router.push("/partner/application-status");
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
                ? "border-[#0f766e] bg-[#eef8f5] text-[#0f766e]"
                : "border-slate-200 bg-white text-slate-700 hover:bg-[#f7fbf8]"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );

  return (
    <section className="min-h-screen bg-[#fffdf8]">
      <div className="border-b border-[#dceae5] bg-[#fffdf8]">
        <div className="mx-auto flex h-[72px] w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="YoPartner" className="h-auto max-h-12 w-auto object-contain" />
          </Link>
          <p className="text-xs font-semibold uppercase text-slate-500">YoPartner Partner</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 rounded-3xl border border-[#dceae5] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase text-[#0f766e]">Become a YoPartner partner</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Help people feel heard through safe, respectful conversations.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            This application helps our safety team understand your background, communication style, KYC readiness, and platform boundaries.
          </p>
        </div>

        <div className="mb-5">
          <p className="text-sm font-medium text-slate-500">
            Step {step + 1} of {stepTitles.length}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">{stepTitles[step]}</h2>
          <div className="mt-4 h-2 rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[#0f766e]"
              style={{ width: `${((step + 1) / stepTitles.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-[#dceae5] bg-white p-5 shadow-sm sm:p-6">
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
                {[
                  ["Chat", FIXED_PLATFORM_PRICE_LABELS.chat],
                  ["Audio call", FIXED_PLATFORM_PRICE_LABELS.audio],
                  ["Video call", FIXED_PLATFORM_PRICE_LABELS.video],
                ].map(([label, price]) => (
                  <div key={label} className="rounded-xl border border-slate-200 px-3 py-3">
                    <p className="text-sm font-medium text-slate-700">{label}</p>
                    <p className="mt-1 text-base font-semibold text-slate-950">{price}</p>
                  </div>
                ))}
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
                <h3 className="text-sm font-semibold text-slate-900">Verification Documents</h3>
                <p className="mt-1 text-xs text-slate-600">
                  Documents are reviewed securely by the YoPartner verification team.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Selfie, Aadhaar front, Aadhaar back, and PAN are required. Allowed formats: JPG, PNG, WEBP, PDF. Maximum 5 MB per document.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-800">Selfie photo</p>
                  <p className="mt-1 text-xs text-slate-500">Upload a clear selfie image for profile verification.</p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      setSelfieFile(file ?? null);
                      setKycUploads((current) => ({ ...current, selfie: null }));
                      setProfile((current) => ({ ...current, selfieFileName: file?.name ?? current.selfieFileName }));
                    }}
                    className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
                  />
                  <p className="mt-2 text-xs text-slate-600">
                    Selected: {selfieFile?.name || kycUploads.selfie?.fileName || profile.selfieFileName || "Pending"}
                  </p>
                  {selfieFile || profile.selfieFileName ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelfieFile(null);
                        setKycUploads((current) => ({ ...current, selfie: null }));
                        setProfile((current) => ({ ...current, selfieFileName: "" }));
                      }}
                      className="mt-2 text-xs font-semibold text-rose-600"
                    >
                      Remove file
                    </button>
                  ) : null}
                </label>

                <label className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-800">Aadhaar front</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Upload Aadhaar front image or PDF.
                  </p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      setAadhaarFrontFile(file ?? null);
                      setKycUploads((current) => ({ ...current, aadhaarFront: null }));
                      setProfile((current) => ({
                        ...current,
                        aadhaarFrontFileName: file?.name ?? current.aadhaarFrontFileName,
                        aadhaarFileName: file?.name ?? current.aadhaarFileName,
                      }));
                    }}
                    className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
                  />
                  <p className="mt-2 text-xs text-slate-600">
                    Selected: {aadhaarFrontFile?.name || kycUploads.aadhaarFront?.fileName || profile.aadhaarFrontFileName || "Pending"}
                  </p>
                  {aadhaarFrontFile || profile.aadhaarFrontFileName ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAadhaarFrontFile(null);
                        setKycUploads((current) => ({ ...current, aadhaarFront: null }));
                        setProfile((current) => ({ ...current, aadhaarFrontFileName: "" }));
                      }}
                      className="mt-2 text-xs font-semibold text-rose-600"
                    >
                      Remove file
                    </button>
                  ) : null}
                </label>

                <label className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-800">Aadhaar back</p>
                  <p className="mt-1 text-xs text-slate-500">Upload Aadhaar back image or PDF.</p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      setAadhaarBackFile(file ?? null);
                      setKycUploads((current) => ({ ...current, aadhaarBack: null }));
                      setProfile((current) => ({
                        ...current,
                        aadhaarBackFileName: file?.name ?? current.aadhaarBackFileName,
                        aadhaarFileName: file?.name ?? current.aadhaarFileName,
                      }));
                    }}
                    className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
                  />
                  <p className="mt-2 text-xs text-slate-600">
                    Selected: {aadhaarBackFile?.name || kycUploads.aadhaarBack?.fileName || profile.aadhaarBackFileName || "Pending"}
                  </p>
                  {aadhaarBackFile || profile.aadhaarBackFileName ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAadhaarBackFile(null);
                        setKycUploads((current) => ({ ...current, aadhaarBack: null }));
                        setProfile((current) => ({ ...current, aadhaarBackFileName: "" }));
                      }}
                      className="mt-2 text-xs font-semibold text-rose-600"
                    >
                      Remove file
                    </button>
                  ) : null}
                </label>

                <label className="rounded-xl border border-slate-200 p-3 sm:col-span-2">
                  <p className="text-sm font-medium text-slate-800">PAN card</p>
                  <p className="mt-1 text-xs text-slate-500">Upload PAN card scan or PDF for verification review.</p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      setPanFile(file ?? null);
                      setKycUploads((current) => ({ ...current, pan: null }));
                      setProfile((current) => ({ ...current, panFileName: file?.name ?? current.panFileName }));
                    }}
                    className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
                  />
                  <p className="mt-2 text-xs text-slate-600">
                    Selected: {panFile?.name || kycUploads.pan?.fileName || profile.panFileName || "Pending"}
                  </p>
                  {panFile || profile.panFileName ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPanFile(null);
                        setKycUploads((current) => ({ ...current, pan: null }));
                        setProfile((current) => ({ ...current, panFileName: "" }));
                      }}
                      className="mt-2 text-xs font-semibold text-rose-600"
                    >
                      Remove file
                    </button>
                  ) : null}
                </label>
              </div>
              {errors.base ? <p className="text-xs font-medium text-rose-600">{errors.base}</p> : null}
            </div>
          ) : null}

          {step === 6 ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Live Video Verification</h3>
                <p className="mt-1 text-xs text-slate-600">
                  Record a short live video inside this flow. Keep it between {LIVE_VIDEO_MIN_SECONDS} and {LIVE_VIDEO_MAX_SECONDS} seconds.
                </p>
              </div>

              <div className="rounded-xl border border-[#dceae5] bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Read this script while recording</p>
                <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  {liveVerificationScript}
                </p>
                <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                  <p><span className="font-semibold text-slate-800">Name:</span> {profile.fullName || "Missing"}</p>
                  <p><span className="font-semibold text-slate-800">Age:</span> {profile.age || "Missing"}</p>
                  <p><span className="font-semibold text-slate-800">Hobbies:</span> {profile.hobbies.join(", ") || "Missing"}</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="rounded-xl border border-slate-200 bg-slate-950 p-3">
                  {isCameraEnabled || isRecordingLiveVideo ? (
                    <video
                      ref={liveStreamVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="aspect-video w-full rounded-lg bg-black object-cover"
                    />
                  ) : liveVideo.objectUrl ? (
                    <video
                      src={liveVideo.objectUrl}
                      controls
                      controlsList="nodownload"
                      playsInline
                      className="aspect-video w-full rounded-lg bg-black object-cover"
                    />
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-slate-900 px-4 text-center text-sm text-white/70">
                      Your recorded verification video preview will appear here.
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {isRecordingLiveVideo
                      ? `Recording ${recordingSeconds}s`
                      : liveVideo.file || liveVideo.upload
                        ? "Video recorded"
                        : isCameraEnabled
                          ? "Camera enabled"
                          : "Camera permission required"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Tap Enable Camera first. Your browser will ask for camera and microphone permission.
                  </p>
                  {isVideoOnlyRecording ? (
                    <p className="mt-2 text-xs font-medium text-amber-700">
                      Microphone was unavailable, so video-only recording is enabled.
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-col gap-2">
                    {!isRecordingLiveVideo && !isCameraEnabled ? (
                      <button
                        type="button"
                        onClick={() => {
                          void handleEnableCamera();
                        }}
                        disabled={isEnablingCamera}
                        className="h-10 rounded-xl bg-[#0f766e] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isEnablingCamera
                          ? "Enabling Camera..."
                          : recordingError
                            ? "Retry Camera"
                            : liveVideo.file || liveVideo.upload
                              ? "Re-record"
                              : "Enable Camera"}
                      </button>
                    ) : null}
                    {!isRecordingLiveVideo && isCameraEnabled ? (
                      <button
                        type="button"
                        onClick={() => {
                          void handleStartLiveRecording();
                        }}
                        className="h-10 rounded-xl bg-[#0f766e] px-4 text-sm font-semibold text-white"
                      >
                        Start Recording
                      </button>
                    ) : null}
                    {isRecordingLiveVideo ? (
                      <button
                        type="button"
                        onClick={stopLiveRecording}
                        className="h-10 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white"
                      >
                        Stop Recording
                      </button>
                    ) : null}
                    {liveVideo.file || liveVideo.upload ? (
                      <button
                        type="button"
                        onClick={handleRemoveLiveVideo}
                        className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
                      >
                        Remove Video
                      </button>
                    ) : null}
                  </div>
                  {recordingError ? (
                    <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700">
                      <p className="font-semibold">{recordingError}</p>
                      {recordingError === CAMERA_PERMISSION_DENIED_MESSAGE ? (
                        <ol className="mt-2 list-decimal space-y-1 pl-4">
                          {CAMERA_PERMISSION_HELP_STEPS.map((stepItem) => (
                            <li key={stepItem}>{stepItem}</li>
                          ))}
                        </ol>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          void handleCheckCameraPermission();
                        }}
                        className="mt-3 h-9 rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700"
                      >
                        Check permission again
                      </button>
                      {permissionCheckMessage ? (
                        <p className="mt-2 font-medium text-rose-700">{permissionCheckMessage}</p>
                      ) : null}
                    </div>
                  ) : null}
                  {errors.base ? <p className="mt-3 text-xs font-medium text-rose-600">{errors.base}</p> : null}
                </div>
              </div>
            </div>
          ) : null}

          {step === 7 ? (
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
                {!liveVideo.file && !liveVideo.upload ? (
                  <button
                    type="button"
                    onClick={() => {
                      setErrors({ base: LIVE_VIDEO_REQUIRED_MESSAGE });
                      setStep(6);
                    }}
                    className="mt-2 inline-flex h-10 items-center rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700"
                  >
                    Go to Live Video Verification
                  </button>
                ) : null}
              </div>

              {isDemoPartnerSession ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-800">Demo verification status</p>
                  <div className="mt-2 grid gap-1 text-xs text-emerald-700 sm:grid-cols-2">
                    <p>Selfie: Verified</p>
                    <p>Aadhaar: Verified</p>
                    <p>PAN: Verified</p>
                    <p>Overall: Verified</p>
                  </div>
                </div>
              ) : null}
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
                className="inline-flex h-10 items-center gap-1 rounded-full bg-[#0f766e] px-4 text-sm font-semibold text-white"
              >
                Continue
                <ChevronRight size={16} />
              </button>
            ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center gap-1 rounded-full bg-[#0f766e] px-4 text-sm font-semibold text-white"
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
