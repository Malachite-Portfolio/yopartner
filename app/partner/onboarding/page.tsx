"use client";

import { CheckCircle2, ChevronLeft, ChevronRight, Copy, HelpCircle, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  clearPartnerStoredFirebaseToken,
  setPartnerStoredFirebaseToken,
} from "@/lib/auth/firebasePhoneAuth";
import { getPartnerApplications, getPartnerProfile as getPartnerProfileApi, submitPartnerApplication } from "@/lib/api/partner";
import { isApiBaseUrlConfigured } from "@/lib/api/client";
import { resolvePartnerLandingRoute, saveLocalPartnerApprovalState } from "@/lib/partnerApproval";
import { uploadPartnerKycFile, type PartnerKycUploadResult } from "@/lib/firebaseKycUpload";
import {
  AUDIO_RATE_PER_MIN,
  CHAT_RATE_PER_MIN,
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
type KycUploadType = "selfie" | "aadhaar-front" | "aadhaar-back";
type KycUploadState = {
  selfie: PartnerKycUploadResult | null;
  aadhaarFront: PartnerKycUploadResult | null;
  aadhaarBack: PartnerKycUploadResult | null;
};
type KycUploadKey = keyof KycUploadState;
type UploadStatus = "pending" | "selected" | "uploading" | "uploaded" | "error";
type UploadProgress = {
  status: UploadStatus;
  error: string;
};
type KycUploadProgressState = Record<KycUploadKey, UploadProgress>;
type LiveVideoState = {
  file: File | null;
  upload: PartnerKycUploadResult | null;
  objectUrl: string;
};
type BrowserPermissionState = PermissionState | "unsupported";
type CameraErrorKind =
  | "permission"
  | "not-found"
  | "not-readable"
  | "security"
  | "overconstrained"
  | "unsupported"
  | "unknown";
type BrowserEnvironment = {
  permissionGuide: "ios-safari" | "android-chrome" | "other";
  isInAppBrowser: boolean;
};

const stepTitles = [
  "Basic details",
  "Languages & comfort style",
  "About your support style",
  "Services & pricing",
  "KYC documents",
  "Live video verification",
  "Safety agreement",
];
const REQUIRED_DOCUMENTS_MESSAGE = "Please upload all required verification documents before submitting.";
const PARTNER_SUBMIT_SESSION_EXPIRED_MESSAGE = "Your login session expired. Please login again to submit.";
const UPLOAD_NOT_COMPLETED_MESSAGE = "Upload not completed, please re-upload.";
const VIDEO_FORMAT_NOT_SUPPORTED_MESSAGE = "Video format not supported. Please record again or upload MP4/MOV.";
const LIVE_VIDEO_UNSUPPORTED_MESSAGE =
  "Your browser does not support recording. Please use Chrome on Android or Safari on iPhone.";
const CAMERA_PERMISSION_DENIED_MESSAGE =
  "Camera or microphone permission is blocked. Allow both permissions in your browser settings, then refresh and tap Retry Camera.";
const CAMERA_NOT_FOUND_MESSAGE =
  "No camera or microphone was found. Check that this device has working camera and microphone access, then try again.";
const CAMERA_ALREADY_IN_USE_MESSAGE =
  "Camera or microphone is already being used by another app. Close the other app and try again.";
const CAMERA_REQUIRES_HTTPS_MESSAGE =
  "Camera access is blocked in this browser context. Open YoPartner securely in Safari or Chrome using https://yopartner.com.";
const CAMERA_CONSTRAINTS_MESSAGE =
  "This device does not support the requested camera settings. Try another camera, browser, or device.";
const IN_APP_BROWSER_WARNING =
  "Please open this page in Chrome or Safari.";
const IOS_PERMISSION_HELP_STEPS = [
  "Open iPhone Settings -> Safari -> Camera -> Allow",
  "Open iPhone Settings -> Safari -> Microphone -> Allow",
  "Then reopen YoPartner and tap Retry Camera.",
];
const ANDROID_PERMISSION_HELP_STEPS = [
  "Tap the lock/settings icon near the address bar",
  "Open Site settings",
  "Set Camera and Microphone to Allow",
  "Reload this page and tap Retry Camera.",
];
const OTHER_PERMISSION_HELP_STEPS = [
  "Open this browser's site settings for YoPartner.",
  "Set Camera and Microphone to Allow.",
  "Refresh this page and tap Retry Camera.",
];
const LIVE_VIDEO_MIN_SECONDS = 10;
const LIVE_VIDEO_MAX_SECONDS = 20;
const QUALIFICATION_OPTIONS = ["10th Pass", "12th Pass", "Graduate", "Other"];
const LIVE_VIDEO_ALLOWED_MIME_TYPES = new Set([
  "video/webm",
  "video/mp4",
  "video/quicktime",
  "video/x-m4v",
  "video/3gpp",
  "video/3gpp2",
]);
const LIVE_VIDEO_ALLOWED_EXTENSIONS = [".webm", ".mp4", ".mov", ".m4v", ".3gp", ".3gpp"];
const ONBOARDING_REVIEW_PRICE_LABELS = {
  chat: "₹2.5/message",
  audio: "₹18/min",
  video: "₹24/min",
} as const;

function toggleArrayValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function hasAnyValue(profile: PartnerProfile) {
  return Boolean(
    profile.fullName ||
      profile.age ||
      profile.qualification ||
      profile.languagesKnown.length ||
      profile.aboutYourself,
  );
}

function sanitizeServices(services: string[]): OnboardingServiceType[] {
  const allowed: OnboardingServiceType[] = ["Chat", "Audio Call", "Video Call"];
  return services.filter((service): service is OnboardingServiceType =>
    allowed.includes(service as OnboardingServiceType),
  );
}

function formatDocumentSelectionStatus(status: UploadStatus) {
  if (status === "uploading") return "Uploading...";
  if (status === "uploaded") return "Uploaded";
  if (status === "selected") return "Selected";
  if (status === "error") return "Error";
  return "Pending";
}

function UploadStatusBadge({ status }: { status: UploadStatus }) {
  const styles: Record<UploadStatus, string> = {
    pending: "border-slate-200 bg-slate-100 text-slate-600",
    selected: "border-amber-200 bg-amber-50 text-amber-700",
    uploading: "border-sky-200 bg-sky-50 text-sky-700",
    uploaded: "border-emerald-200 bg-emerald-50 text-emerald-700",
    error: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {formatDocumentSelectionStatus(status)}
    </span>
  );
}

function isValidPartnerAge(value: string) {
  const age = Number(value);
  return Number.isInteger(age) && age >= 18 && age <= 70;
}

function hasUploadedArtifact(upload: PartnerKycUploadResult | null) {
  return Boolean(upload?.storagePath?.trim());
}

function hasLiveVideoArtifact(upload: PartnerKycUploadResult | null) {
  return hasUploadedArtifact(upload) && Boolean(upload?.storagePath.includes("/live-video/"));
}

function formatUploadSelectionStatus(
  file: File | null,
  upload: PartnerKycUploadResult | null,
  legacyFileName?: string,
) {
  if (hasUploadedArtifact(upload)) return upload?.fileName || "Uploaded file";
  if (file) return file.name;
  if (legacyFileName?.trim()) return `${legacyFileName} - ${UPLOAD_NOT_COMPLETED_MESSAGE}`;
  return "No file selected";
}

function getLiveVideoMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const supportedTypes = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  return supportedTypes.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

function isSupportedLiveVideoFile(file: File) {
  const mimeType = file.type.toLowerCase().split(";")[0];
  const extension = getFileExtension(file.name);
  return LIVE_VIDEO_ALLOWED_MIME_TYPES.has(mimeType) || LIVE_VIDEO_ALLOWED_EXTENSIONS.includes(extension);
}

function normalizeLiveVideoForUpload(file: File) {
  if (!isSupportedLiveVideoFile(file)) {
    throw new Error(VIDEO_FORMAT_NOT_SUPPORTED_MESSAGE);
  }

  const mimeType = file.type.toLowerCase();
  if (mimeType.startsWith("video/webm") || mimeType.startsWith("video/mp4")) {
    return file;
  }

  return new File([file], file.name || `live-verification-${Date.now()}.mp4`, {
    type: "video/mp4",
    lastModified: file.lastModified,
  });
}

function toFriendlyUploadError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "Live verification video must be WEBM or MP4.") {
      return VIDEO_FORMAT_NOT_SUPPORTED_MESSAGE;
    }
    if (error.message.trim()) return error.message;
  }
  return "Could not upload verification documents. Please try again.";
}

function getCameraErrorName(error: unknown) {
  return typeof error === "object" && error && "name" in error
    ? String((error as { name?: unknown }).name ?? "")
    : "";
}

function getCameraErrorDetails(error: unknown): { kind: CameraErrorKind; message: string } {
  const name = getCameraErrorName(error);
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return { kind: "permission", message: CAMERA_PERMISSION_DENIED_MESSAGE };
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return { kind: "not-found", message: CAMERA_NOT_FOUND_MESSAGE };
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return { kind: "not-readable", message: CAMERA_ALREADY_IN_USE_MESSAGE };
  }
  if (name === "SecurityError") {
    return { kind: "security", message: CAMERA_REQUIRES_HTTPS_MESSAGE };
  }
  if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
    return { kind: "overconstrained", message: CAMERA_CONSTRAINTS_MESSAGE };
  }
  return {
    kind: "unknown",
    message: "Camera and microphone could not start. Check browser permissions and try again.",
  };
}

function getLiveCameraErrorDetails(error: unknown) {
  const rawMessage = error instanceof Error ? error.message.trim() : "";
  if (rawMessage === LIVE_VIDEO_UNSUPPORTED_MESSAGE) {
    return { kind: "unsupported" as const, message: rawMessage };
  }
  if (rawMessage === CAMERA_REQUIRES_HTTPS_MESSAGE) {
    return { kind: "security" as const, message: rawMessage };
  }
  return getCameraErrorDetails(error);
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

function detectBrowserEnvironment(): BrowserEnvironment {
  if (typeof navigator === "undefined") {
    return { permissionGuide: "other", isInAppBrowser: false };
  }

  const userAgent = navigator.userAgent;
  const isIos =
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);
  const isAndroidChrome = /Android/i.test(userAgent) && /Chrome|CriOS/i.test(userAgent);
  const isInAppBrowser =
    /FBAN|FBAV|Instagram|WhatsApp|Line\/|; wv\)|\bwv\b|WebView|GSA\//i.test(userAgent);

  return {
    permissionGuide: isIos && isSafari ? "ios-safari" : isAndroidChrome ? "android-chrome" : "other",
    isInAppBrowser,
  };
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

function toExistingUpload(application: Record<string, unknown>, key: string): PartnerKycUploadResult | null {
  const fileName = toOptionalString(application[`${key}FileName`]);
  const storagePath = toOptionalString(application[`${key}StoragePath`]);
  const downloadUrl = toOptionalString(application[`${key}Url`]);

  if (!storagePath) return null;
  return {
    fileName: fileName || storagePath.split("/").pop() || "uploaded-file",
    storagePath,
    downloadUrl,
    contentType: "",
    size: 0,
  };
}

function toExistingLiveVideoUpload(application: Record<string, unknown>): PartnerKycUploadResult | null {
  const fileName = toOptionalString(application.liveVideoFileName);
  const storagePath = toOptionalString(application.liveVideoStoragePath);
  const uploaded = Boolean(application.liveVideoUploaded);

  if (!uploaded && !storagePath && !fileName) return null;
  return {
    fileName: fileName || storagePath.split("/").pop() || "live-verification-video",
    storagePath,
    downloadUrl: "",
    contentType: "video/webm",
    size: 0,
  };
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
  return {
    ...current,
    fullName: mergeIfEmpty(current.fullName, toOptionalString(application.fullName) || toOptionalString(companion.displayName)),
    age: mergeIfEmpty(current.age, toOptionalNumericString(application.age)),
    gender: current.gender || toPartnerGender(application.gender),
    qualification: mergeIfEmpty(current.qualification, toOptionalString(application.qualification)),
    languagesKnown: mergeArrayIfEmpty(
      current.languagesKnown,
      toOptionalStringArray(application.languagesKnown).length
        ? toOptionalStringArray(application.languagesKnown)
        : toOptionalStringArray(companion.languages),
    ).slice(0, 3),
    communicationStyle: mergeArrayIfEmpty(
      current.communicationStyle,
      toOptionalStringArray(application.communicationStyle),
    ).slice(0, 1),
    hobbies: mergeArrayIfEmpty(current.hobbies, toOptionalStringArray(application.hobbies)).slice(0, 5),
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
    selfieFileName: mergeIfEmpty(current.selfieFileName, toOptionalString(application.selfieFileName)),
    aadhaarFrontFileName: mergeIfEmpty(current.aadhaarFrontFileName, toOptionalString(application.aadhaarFrontFileName)),
    aadhaarBackFileName: mergeIfEmpty(current.aadhaarBackFileName, toOptionalString(application.aadhaarBackFileName)),
    aadhaarFileName: mergeIfEmpty(
      current.aadhaarFileName,
      toOptionalString(application.aadhaarFrontFileName) || toOptionalString(application.aadhaarBackFileName),
    ),
  };
}

function toOnboardingProfile(source: PartnerProfile): OnboardingProfile {
  return {
    ...source,
    languagesKnown: source.languagesKnown.slice(0, 3),
    communicationStyle: source.communicationStyle.slice(0, 1),
    hobbies: source.hobbies.slice(0, 5),
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

  const selfieUploaded = hasUploadedArtifact(uploads.selfie);
  const aadhaarFrontUploaded = hasUploadedArtifact(uploads.aadhaarFront);
  const aadhaarBackUploaded = hasUploadedArtifact(uploads.aadhaarBack);
  const liveVideoUploaded = hasLiveVideoArtifact(liveVideoUpload);

  return {
    fullName: profile.fullName.trim(),
    age: Number(profile.age) || 0,
    gender: String(profile.gender || ""),
    qualification: profile.qualification.trim() || undefined,
    languagesKnown: profile.languagesKnown.slice(0, 3),
    communicationStyle: profile.communicationStyle.slice(0, 1),
    hobbies: profile.hobbies.slice(0, 5),
    aboutYourself: profile.aboutYourself.trim(),
    servicesOffered: backendSupportedServices,
    chatPrice: CHAT_RATE_PER_MIN,
    audioPrice: AUDIO_RATE_PER_MIN,
    videoPrice: VIDEO_RATE_PER_MIN,
    homeVisitRequested: false,
    safetyChecklist,
    selfieUploaded,
    selfieFileName: selfieUploaded ? uploads.selfie?.fileName || undefined : undefined,
    selfieStoragePath: selfieUploaded ? uploads.selfie?.storagePath || undefined : undefined,
    selfieUrl: selfieUploaded ? uploads.selfie?.downloadUrl || undefined : undefined,
    aadhaarFrontUploaded,
    aadhaarFrontFileName: aadhaarFrontUploaded ? uploads.aadhaarFront?.fileName || undefined : undefined,
    aadhaarFrontStoragePath: aadhaarFrontUploaded ? uploads.aadhaarFront?.storagePath || undefined : undefined,
    aadhaarFrontUrl: aadhaarFrontUploaded ? uploads.aadhaarFront?.downloadUrl || undefined : undefined,
    aadhaarBackUploaded,
    aadhaarBackFileName: aadhaarBackUploaded ? uploads.aadhaarBack?.fileName || undefined : undefined,
    aadhaarBackStoragePath: aadhaarBackUploaded ? uploads.aadhaarBack?.storagePath || undefined : undefined,
    aadhaarBackUrl: aadhaarBackUploaded ? uploads.aadhaarBack?.downloadUrl || undefined : undefined,
    liveVerificationName: profile.fullName.trim(),
    liveVerificationAge: Number(profile.age) || 0,
    liveVerificationHobbies: profile.hobbies.join(", "),
    liveVideoUploaded,
    liveVideoFileName: liveVideoUploaded ? liveVideoUpload?.fileName || undefined : undefined,
    liveVideoStoragePath: liveVideoUploaded ? liveVideoUpload?.storagePath || undefined : undefined,
    aadhaarFileName:
      (aadhaarFrontUploaded ? uploads.aadhaarFront?.fileName : "") ||
      (aadhaarBackUploaded ? uploads.aadhaarBack?.fileName : "") ||
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

function getPartnerLoginReturnUrl() {
  const params = new URLSearchParams({
    reason: "session-expired",
    message: PARTNER_SUBMIT_SESSION_EXPIRED_MESSAGE,
    returnUrl: "/partner/onboarding",
  });
  return `/partner/login?${params.toString()}`;
}

export default function PartnerOnboardingPage() {
  const router = useRouter();
  const isDemoPartnerSession = isClientDemoPartnerSessionActive();
  const [isEditMode, setIsEditMode] = useState<boolean | null>(null);
  const [isHydratingExistingApplication, setIsHydratingExistingApplication] = useState(IS_PRODUCTION_READY_MODE);
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
  const [kycUploads, setKycUploads] = useState<KycUploadState>({
    selfie: null,
    aadhaarFront: null,
    aadhaarBack: null,
  });
  const [kycUploadProgress, setKycUploadProgress] = useState<KycUploadProgressState>({
    selfie: { status: "pending", error: "" },
    aadhaarFront: { status: "pending", error: "" },
    aadhaarBack: { status: "pending", error: "" },
  });
  const [liveVideo, setLiveVideo] = useState<LiveVideoState>({
    file: null,
    upload: null,
    objectUrl: "",
  });
  const [liveVideoUploadProgress, setLiveVideoUploadProgress] = useState<UploadProgress>({
    status: "pending",
    error: "",
  });
  const [isRecordingLiveVideo, setIsRecordingLiveVideo] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isEnablingCamera, setIsEnablingCamera] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState("");
  const [cameraErrorKind, setCameraErrorKind] = useState<CameraErrorKind | null>(null);
  const [permissionCheckMessage, setPermissionCheckMessage] = useState("");
  const [permissionStates, setPermissionStates] = useState<{
    camera: BrowserPermissionState;
    microphone: BrowserPermissionState;
  }>({ camera: "unsupported", microphone: "unsupported" });
  const [permissionHelpOpen, setPermissionHelpOpen] = useState(false);
  const [browserEnvironment, setBrowserEnvironment] = useState<BrowserEnvironment>({
    permissionGuide: "other",
    isInAppBrowser: false,
  });
  const [copyLinkMessage, setCopyLinkMessage] = useState("");
  const liveStreamVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const liveVideoChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef(0);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingStopTimerRef = useRef<number | null>(null);
  const uploadRequestIdsRef = useRef<Record<KycUploadKey | "liveVideo", number>>({
    selfie: 0,
    aadhaarFront: 0,
    aadhaarBack: 0,
    liveVideo: 0,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsEditMode(new URLSearchParams(window.location.search).get("edit") === "true");
      setBrowserEnvironment(detectBrowserEnvironment());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;

    const updatePermissionStates = async () => {
      const [camera, microphone] = await Promise.all([
        readBrowserPermissionState("camera"),
        readBrowserPermissionState("microphone"),
      ]);
      if (!active) return;
      setPermissionStates({ camera, microphone });
      if (camera === "denied" || microphone === "denied") {
        setCameraErrorKind("permission");
        setRecordingError(CAMERA_PERMISSION_DENIED_MESSAGE);
        setPermissionHelpOpen(true);
      } else {
        setCameraErrorKind((current) => (current === "permission" ? null : current));
        setRecordingError((current) => (current === CAMERA_PERMISSION_DENIED_MESSAGE ? "" : current));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void updatePermissionStates();
    };

    void updatePermissionStates();
    window.addEventListener("focus", updatePermissionStates);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      active = false;
      window.removeEventListener("focus", updatePermissionStates);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!isPartnerLoggedIn() || !getPartnerPhone()) {
      router.replace("/partner/login");
    }
  }, [router]);

  useEffect(() => {
    if (!IS_PRODUCTION_READY_MODE) {
      return;
    }
    if (isEditMode === null) return;

    let active = true;
    const hydrateExistingApplication = async () => {
      setIsHydratingExistingApplication(true);
      try {
        const landing = await resolvePartnerLandingRoute();
        if (!active) return;
        if (!isEditMode && (landing.route === "/partner/dashboard" || landing.route === "/partner/application-status")) {
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
        const restoredUploads = {
          selfie: toExistingUpload(application, "selfie"),
          aadhaarFront: toExistingUpload(application, "aadhaarFront"),
          aadhaarBack: toExistingUpload(application, "aadhaarBack"),
        };
        const restoredLiveVideo = toExistingLiveVideoUpload(application);
        setKycUploads(restoredUploads);
        setKycUploadProgress({
          selfie: { status: hasUploadedArtifact(restoredUploads.selfie) ? "uploaded" : "pending", error: "" },
          aadhaarFront: { status: hasUploadedArtifact(restoredUploads.aadhaarFront) ? "uploaded" : "pending", error: "" },
          aadhaarBack: { status: hasUploadedArtifact(restoredUploads.aadhaarBack) ? "uploaded" : "pending", error: "" },
        });
        setLiveVideo((current) => ({
          ...current,
          upload: restoredLiveVideo,
        }));
        setLiveVideoUploadProgress({
          status: hasLiveVideoArtifact(restoredLiveVideo) ? "uploaded" : "pending",
          error: "",
        });
      } finally {
        if (active) setIsHydratingExistingApplication(false);
      }
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

  const requiredDocumentsUploaded = Boolean(
    hasUploadedArtifact(kycUploads.selfie) &&
      hasUploadedArtifact(kycUploads.aadhaarFront) &&
      hasUploadedArtifact(kycUploads.aadhaarBack),
  );
  const isDocumentUploadInProgress = Object.values(kycUploadProgress).some(
    ({ status }) => status === "selected" || status === "uploading",
  );
  const liveVerificationScript = `Hello, my name is ${
    profile.fullName.trim() || "[Host Name]"
  }. I am applying to become a verified YoPartner host. I confirm that the documents and profile details I submitted are genuine and belong to me. I understand that YoPartner is a safe, respectful, and platonic conversation platform.`;
  const permissionBlocked =
    permissionStates.camera === "denied" || permissionStates.microphone === "denied";
  const shouldEmphasizePermissionHelp = permissionBlocked || cameraErrorKind === "permission";
  const permissionHelpSteps =
    browserEnvironment.permissionGuide === "ios-safari"
      ? IOS_PERMISSION_HELP_STEPS
      : browserEnvironment.permissionGuide === "android-chrome"
        ? ANDROID_PERMISSION_HELP_STEPS
        : OTHER_PERMISSION_HELP_STEPS;
  const liveVideoUploaded = hasLiveVideoArtifact(liveVideo.upload);
  const isLiveVideoUploadInProgress =
    liveVideoUploadProgress.status === "selected" || liveVideoUploadProgress.status === "uploading";
  const recordingSecondsRemaining = Math.max(0, LIVE_VIDEO_MAX_SECONDS - recordingSeconds);
  const isRecordingCountdownCritical =
    isRecordingLiveVideo && recordingSecondsRemaining > 0 && recordingSecondsRemaining <= 5;

  const summaryRows = useMemo(
    () => [
      { label: "Full Name", value: profile.fullName || "-" },
      { label: "Age", value: profile.age || "-" },
      { label: "Gender", value: profile.gender || "-" },
      { label: "Qualification", value: profile.qualification || "-" },
      { label: "Languages", value: profile.languagesKnown.join(", ") || "-" },
      { label: "Communication Style", value: profile.communicationStyle.join(", ") || "-" },
      { label: "Hobbies", value: profile.hobbies.join(", ") || "-" },
      { label: "About", value: profile.aboutYourself || "-" },
      { label: "Services", value: profile.servicesOffered.join(", ") || "-" },
      {
        label: "Pricing",
        value: `Chat ${ONBOARDING_REVIEW_PRICE_LABELS.chat}, Audio ${ONBOARDING_REVIEW_PRICE_LABELS.audio}, Video ${ONBOARDING_REVIEW_PRICE_LABELS.video}`,
      },
      {
        label: "Selfie",
        value: formatDocumentSelectionStatus(kycUploadProgress.selfie.status),
      },
      {
        label: "Aadhaar Front",
        value: formatDocumentSelectionStatus(kycUploadProgress.aadhaarFront.status),
      },
      {
        label: "Aadhaar Back",
        value: formatDocumentSelectionStatus(kycUploadProgress.aadhaarBack.status),
      },
      {
        label: "Live video",
        value: formatDocumentSelectionStatus(liveVideoUploadProgress.status),
      },
    ],
    [kycUploadProgress, liveVideoUploadProgress.status, profile],
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
      if (!profile.qualification.trim()) nextErrors.qualification = "Qualification is required.";
    }

    if (stepIndex === 1) {
      if (profile.languagesKnown.length === 0) nextErrors.languagesKnown = "Select at least one language.";
      if (profile.languagesKnown.length > 3) nextErrors.languagesKnown = "Select no more than 3 languages.";
      if (profile.communicationStyle.length !== 1) nextErrors.communicationStyle = "Select one communication style.";
      if (profile.hobbies.length !== 5) nextErrors.hobbies = "Select exactly 5 hobbies.";
    }

    if (stepIndex === 2) {
      if (!profile.aboutYourself.trim()) nextErrors.aboutYourself = "About Yourself is required.";
    }

    if (stepIndex === 3) {
      if (profile.servicesOffered.length === 0) nextErrors.servicesOffered = "Select at least one service.";
    }

    if (stepIndex === 4 && !requiredDocumentsUploaded) {
      nextErrors.base = REQUIRED_DOCUMENTS_MESSAGE;
    }

    if (stepIndex === 5) {
      if (!profile.fullName.trim()) nextErrors.fullName = "Full Name is required.";
      if (!profile.age.trim()) nextErrors.age = "Age is required.";
      if (profile.age.trim() && !isValidPartnerAge(profile.age)) {
        nextErrors.age = "Age must be a number between 18 and 70.";
      }
      if (profile.hobbies.length !== 5) nextErrors.hobbies = "Select exactly 5 hobbies.";
      if (!liveVideoUploaded) {
        nextErrors.base = "Please wait until your live verification video is uploaded.";
      }
    }

    if (stepIndex === 6) {
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
      normalized.includes("qualification")
    ) return 0;
    if (
      normalized.includes("language") ||
      normalized.includes("communication") ||
      normalized.includes("hobbies")
    ) return 1;
    if (normalized.includes("about yourself")) return 2;
    if (normalized.includes("service")) return 3;
    if (normalized.includes("document") || normalized.includes("aadhaar") || normalized.includes("selfie")) return 4;
    if (normalized.includes("live video") || normalized.includes("live verification")) return 5;
    if (normalized.includes("safety")) return 6;
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
      return { stepIndex: 4, message: "Selfie upload path is missing. Please reselect and upload your selfie." };
    }
    if (!hasUploadedArtifact(uploads.aadhaarFront)) {
      return { stepIndex: 4, message: "Aadhaar Front upload path is missing. Please reselect and upload Aadhaar Front." };
    }
    if (!hasUploadedArtifact(uploads.aadhaarBack)) {
      return { stepIndex: 4, message: "Aadhaar Back upload path is missing. Please reselect and upload Aadhaar Back." };
    }
    if (!hasLiveVideoArtifact(liveVideoUpload)) {
      return { stepIndex: 5, message: "Live video upload path is missing. Please record and upload live verification again." };
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

    return navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  };

  const refreshPermissionStates = async () => {
    const [camera, microphone] = await Promise.all([
      readBrowserPermissionState("camera"),
      readBrowserPermissionState("microphone"),
    ]);
    const nextStates = { camera, microphone };
    setPermissionStates(nextStates);
    return nextStates;
  };

  const showCameraError = (error: unknown) => {
    const details = getLiveCameraErrorDetails(error);
    setCameraErrorKind(details.kind);
    setRecordingError(details.message);
    if (details.kind === "permission") setPermissionHelpOpen(true);
  };

  const handleEnableCamera = async () => {
    setRecordingError("");
    setCameraErrorKind(null);
    setPermissionCheckMessage("");
    setErrors({});
    setIsEnablingCamera(true);
    stopLiveStream();
    try {
      const states = await refreshPermissionStates();
      if (states.camera === "denied" || states.microphone === "denied") {
        setPermissionHelpOpen(true);
        setCameraErrorKind("permission");
        setRecordingError(CAMERA_PERMISSION_DENIED_MESSAGE);
        return;
      }
      const stream = await requestLiveCameraStream();
      liveStreamRef.current = stream;
      setIsCameraEnabled(true);
      if (liveStreamVideoRef.current) {
        liveStreamVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      stopLiveStream();
      showCameraError(error);
    } finally {
      setIsEnablingCamera(false);
    }
  };

  const handleCheckCameraPermission = async () => {
    setPermissionCheckMessage("");
    const { camera: cameraState, microphone: microphoneState } = await refreshPermissionStates();
    if (cameraState === "unsupported" && microphoneState === "unsupported") {
      setPermissionCheckMessage("This browser does not expose permission status here. Use browser site settings, then reload and retry.");
      return;
    }
    setPermissionCheckMessage(`Camera: ${cameraState}. Microphone: ${microphoneState}.`);
  };

  const getUploadUser = async () => {
    const user = await waitForFirebaseUser();
    if (!user) {
      setErrors({ base: PARTNER_SUBMIT_SESSION_EXPIRED_MESSAGE });
      router.replace(getPartnerLoginReturnUrl());
      return null;
    }
    try {
      const token = await user.getIdToken(true);
      if (!token.trim()) throw new Error("EMPTY_PARTNER_ID_TOKEN");
      setPartnerStoredFirebaseToken(token);
      return user;
    } catch {
      setErrors({ base: PARTNER_SUBMIT_SESSION_EXPIRED_MESSAGE });
      router.replace(getPartnerLoginReturnUrl());
      return null;
    }
  };

  const updateDocumentProgress = (key: KycUploadKey, progress: UploadProgress) => {
    setKycUploadProgress((current) => ({ ...current, [key]: progress }));
  };

  const updateUploadedDocumentProfile = (key: KycUploadKey, fileName: string) => {
    setProfile((current) => {
      if (key === "selfie") return { ...current, selfieFileName: fileName };
      if (key === "aadhaarFront") {
        return { ...current, aadhaarFrontFileName: fileName, aadhaarFileName: fileName };
      }
      return { ...current, aadhaarBackFileName: fileName, aadhaarFileName: current.aadhaarFileName || fileName };
    });
  };

  const uploadDocumentFile = async (
    file: File,
    key: KycUploadKey,
    type: KycUploadType,
    clearSelectedFile: () => void,
  ) => {
    const requestId = uploadRequestIdsRef.current[key] + 1;
    uploadRequestIdsRef.current[key] = requestId;
    setKycUploads((current) => ({ ...current, [key]: null }));
    updateDocumentProgress(key, { status: "uploading", error: "" });
    setErrors({});

    const user = await getUploadUser();
    if (!user) {
      if (uploadRequestIdsRef.current[key] === requestId) {
        updateDocumentProgress(key, { status: "error", error: PARTNER_SUBMIT_SESSION_EXPIRED_MESSAGE });
      }
      return;
    }

    try {
      const upload = await uploadPartnerKycFile({ file, uid: user.uid, type });
      if (uploadRequestIdsRef.current[key] !== requestId) return;
      if (!hasUploadedArtifact(upload)) {
        throw new Error("Upload completed without a saved document path. Please try again.");
      }
      setKycUploads((current) => ({ ...current, [key]: upload }));
      updateUploadedDocumentProfile(key, upload.fileName || file.name);
      clearSelectedFile();
      updateDocumentProgress(key, { status: "uploaded", error: "" });
    } catch (error) {
      if (uploadRequestIdsRef.current[key] !== requestId) return;
      updateDocumentProgress(key, { status: "error", error: toFriendlyUploadError(error) });
    }
  };

  const uploadLiveVideoFile = async (file: File) => {
    const requestId = uploadRequestIdsRef.current.liveVideo + 1;
    uploadRequestIdsRef.current.liveVideo = requestId;
    setLiveVideoUploadProgress({ status: "uploading", error: "" });
    setErrors({});

    const user = await getUploadUser();
    if (!user) {
      if (uploadRequestIdsRef.current.liveVideo === requestId) {
        setLiveVideoUploadProgress({ status: "error", error: PARTNER_SUBMIT_SESSION_EXPIRED_MESSAGE });
      }
      return;
    }

    try {
      const upload = await uploadPartnerKycFile({
        file: normalizeLiveVideoForUpload(file),
        uid: user.uid,
        type: "live-video",
      });
      if (uploadRequestIdsRef.current.liveVideo !== requestId) return;
      if (!hasLiveVideoArtifact(upload)) {
        throw new Error("Upload completed without a saved live video path. Please record and try again.");
      }
      setLiveVideo((current) => ({ ...current, file: null, upload }));
      setLiveVideoUploadProgress({ status: "uploaded", error: "" });
    } catch (error) {
      if (uploadRequestIdsRef.current.liveVideo !== requestId) return;
      setLiveVideoUploadProgress({ status: "error", error: toFriendlyUploadError(error) });
    }
  };

  const handleStartLiveRecording = async () => {
    setRecordingError("");
    setCameraErrorKind(null);
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
        showCameraError(error);
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
      uploadRequestIdsRef.current.liveVideo += 1;
      setLiveVideo((current) => ({ ...current, upload: null }));
      setLiveVideoUploadProgress({ status: "selected", error: "" });

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
        setCameraErrorKind(null);
        setLiveVideoUploadProgress({ status: "selected", error: "" });
        void uploadLiveVideoFile(file);
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
      showCameraError(error);
    }
  };

  const handleRemoveLiveVideo = () => {
    stopLiveStream();
    uploadRequestIdsRef.current.liveVideo += 1;
    setLiveVideo((current) => {
      if (current.objectUrl) URL.revokeObjectURL(current.objectUrl);
      return { file: null, upload: null, objectUrl: "" };
    });
    setRecordingSeconds(0);
    setRecordingError("");
    setCameraErrorKind(null);
    setLiveVideoUploadProgress({ status: "pending", error: "" });
  };

  const handleCopyCurrentUrl = async () => {
    setCopyLinkMessage("");
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyLinkMessage("Page link copied. Open Safari or Chrome and paste it into the address bar.");
    } catch {
      setCopyLinkMessage(`Copy this link and open it in Safari or Chrome: ${window.location.href}`);
    }
  };

  const handleContinue = () => {
    const stepErrors = validateStep(step);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    setStep((current) => Math.min(current + 1, stepTitles.length - 1));
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    const firstValidationError = findFirstSubmitValidationError();
    setSubmitMessage("");
    if (firstValidationError) {
      setErrors(firstValidationError.stepErrors);
      setStep(firstValidationError.stepIndex);
      return;
    }
    if (!requiredDocumentsUploaded) {
      setErrors({ base: REQUIRED_DOCUMENTS_MESSAGE });
      setStep(4);
      return;
    }
    if (!liveVideoUploaded) {
      setErrors({ base: "Please wait until your live verification video is uploaded." });
      setStep(5);
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
        const user = await waitForFirebaseUser();
        if (!user) {
          setErrors({ base: PARTNER_SUBMIT_SESSION_EXPIRED_MESSAGE });
          setIsSubmitting(false);
          router.replace(getPartnerLoginReturnUrl());
          return;
        }

        let submitToken = "";
        try {
          submitToken = await user.getIdToken(true);
          if (!submitToken.trim()) {
            throw new Error("EMPTY_PARTNER_ID_TOKEN");
          }
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
          setPartnerStoredFirebaseToken(submitToken);
        } catch {
          setErrors({ base: PARTNER_SUBMIT_SESSION_EXPIRED_MESSAGE });
          setIsSubmitting(false);
          router.replace(getPartnerLoginReturnUrl());
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

          const [selfieUpload, aadhaarFrontUpload, aadhaarBackUpload] = await Promise.all([
            uploadIfSelected(selfieFile, "selfie"),
            uploadIfSelected(aadhaarFrontFile, "aadhaar-front"),
            uploadIfSelected(aadhaarBackFile, "aadhaar-back"),
          ]);

          if (selfieUpload) nextUploads = { ...nextUploads, selfie: selfieUpload };
          if (aadhaarFrontUpload) nextUploads = { ...nextUploads, aadhaarFront: aadhaarFrontUpload };
          if (aadhaarBackUpload) nextUploads = { ...nextUploads, aadhaarBack: aadhaarBackUpload };
          if (liveVideo.file) {
            nextLiveVideoUpload = await uploadPartnerKycFile({
              file: normalizeLiveVideoForUpload(liveVideo.file),
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
        } catch (uploadError) {
          const uploadMessage = toFriendlyUploadError(uploadError);
          setErrors({ base: uploadMessage });
          setStep(uploadMessage.toLowerCase().includes("video") ? 5 : 4);
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
        const response = await submitPartnerApplication(payload, submitToken);
        if (response.error) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[partner onboarding] submit response body", response.error.details ?? response.error);
          }
          if (response.error.status === 401) {
            clearPartnerStoredFirebaseToken();
            setErrors({ base: PARTNER_SUBMIT_SESSION_EXPIRED_MESSAGE });
            setIsSubmitting(false);
            router.replace(getPartnerLoginReturnUrl());
            return;
          }
          const message = getSubmitErrorMessage(response.error);
          const submitErrorStep = getSubmitErrorStep(message);
          if (submitErrorStep !== null) {
            setStep(submitErrorStep);
          }
          setErrors({ base: message });
          setIsSubmitting(false);
          return;
        }
        const submission = asRecord(response.data);
        const submittedApplication = asRecord(submission.application);
        const submittedCompanion = asRecord(submission.companion ?? submittedApplication.companion);
        const applicationStatus = String(submittedApplication.status ?? "").toUpperCase();
        const companionStatus = String(submittedCompanion.status ?? "").toUpperCase();
        const verificationStatus = String(submittedCompanion.verificationStatus ?? "").toUpperCase();
        const alreadyApproved =
          submission.alreadyApproved === true ||
          applicationStatus === "APPROVED" ||
          (companionStatus === "ACTIVE" && verificationStatus === "VERIFIED");
        if (alreadyApproved) {
          saveLocalPartnerApprovalState({
            applicationStatus: "APPROVED",
            kycStatus: "VERIFIED",
            verificationStatus: "VERIFIED",
            companionStatus: "ACTIVE",
            reviewStatus: "approved",
          });
          setPartnerOnboardingComplete(true);
          setSubmitMessage("Your partner profile is already approved.");
          const landing = await resolvePartnerLandingRoute();
          setIsSubmitting(false);
          router.replace(landing.route === "/partner/onboarding" ? "/partner/application-status" : landing.route);
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

  const handleLanguageToggle = (value: string) => {
    const isSelected = profile.languagesKnown.includes(value);
    if (!isSelected && profile.languagesKnown.length >= 3) {
      setErrors((current) => ({ ...current, languagesKnown: "You can select up to 3 languages." }));
      return;
    }
    setProfile((current) => ({
      ...current,
      languagesKnown: toggleArrayValue(current.languagesKnown, value),
    }));
    setErrors((current) => ({ ...current, languagesKnown: undefined }));
  };

  const handleCommunicationStyleSelect = (value: string) => {
    setProfile((current) => ({ ...current, communicationStyle: [value] }));
    setErrors((current) => ({ ...current, communicationStyle: undefined }));
  };

  const handleHobbyToggle = (value: string) => {
    const isSelected = profile.hobbies.includes(value);
    if (!isSelected && profile.hobbies.length >= 5) {
      setErrors((current) => ({
        ...current,
        hobbies: "You can select only 5 hobbies. Deselect one before choosing another.",
      }));
      return;
    }
    setProfile((current) => ({
      ...current,
      hobbies: toggleArrayValue(current.hobbies, value),
    }));
    setErrors((current) => ({ ...current, hobbies: undefined }));
  };

  if (isEditMode === null || isHydratingExistingApplication) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#fffdf8] px-4">
        <div className="rounded-3xl border border-[#dceae5] bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
          Loading your partner profile...
        </div>
      </section>
    );
  }

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
                <p className="mb-1.5 text-sm font-medium text-slate-700">Qualification</p>
                <select
                  value={profile.qualification}
                  onChange={(event) => setProfile((current) => ({ ...current, qualification: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#2563eb]"
                >
                  <option value="">Select qualification</option>
                  {QUALIFICATION_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
                {errors.qualification ? <p className="mt-1 text-xs text-rose-600">{errors.qualification}</p> : null}
              </label>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Languages Known</p>
                {renderChipGroup(
                  partnerLanguageOptions,
                  profile.languagesKnown,
                  handleLanguageToggle,
                )}
                <p className="mt-2 text-xs text-slate-500">Select between 1 and 3 languages.</p>
                {errors.languagesKnown ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.languagesKnown}</p>
                ) : null}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Communication Style</p>
                {renderChipGroup(
                  partnerCommunicationStyleOptions,
                  profile.communicationStyle,
                  handleCommunicationStyleSelect,
                )}
                <p className="mt-2 text-xs text-slate-500">Select one communication style.</p>
                {errors.communicationStyle ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.communicationStyle}</p>
                ) : null}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Hobbies</p>
                {renderChipGroup(partnerHobbyOptions, profile.hobbies, handleHobbyToggle)}
                <p className="mt-2 text-xs text-slate-500">Select exactly 5 hobbies.</p>
                {errors.hobbies ? <p className="mt-1 text-xs text-rose-600">{errors.hobbies}</p> : null}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
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
                {errors.aboutYourself ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.aboutYourself}</p>
                ) : null}
              </label>
            </div>
          ) : null}

          {step === 3 ? (
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
                  ["Chat", ONBOARDING_REVIEW_PRICE_LABELS.chat],
                  ["Audio call", ONBOARDING_REVIEW_PRICE_LABELS.audio],
                  ["Video call", ONBOARDING_REVIEW_PRICE_LABELS.video],
                ].map(([label, price]) => (
                  <div key={label} className="rounded-xl border border-slate-200 px-3 py-3">
                    <p className="text-sm font-medium text-slate-700">{label}</p>
                    <p className="mt-1 text-base font-semibold text-slate-950">{price}</p>
                  </div>
                ))}
              </div>

            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Verification Documents</h3>
                <p className="mt-1 text-xs text-slate-600">
                  Documents are reviewed securely by the YoPartner verification team.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Selfie, Aadhaar front, and Aadhaar back are required. Allowed formats: JPG, PNG, WEBP, PDF. Maximum 5 MB per document.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-800">Selfie photo</p>
                    <UploadStatusBadge status={kycUploadProgress.selfie.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Upload a clear selfie image for profile verification.</p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setSelfieFile(file);
                      setProfile((current) => ({ ...current, selfieFileName: "" }));
                      if (!file) {
                        uploadRequestIdsRef.current.selfie += 1;
                        setKycUploads((current) => ({ ...current, selfie: null }));
                        updateDocumentProgress("selfie", { status: "pending", error: "" });
                        return;
                      }
                      updateDocumentProgress("selfie", { status: "selected", error: "" });
                      void uploadDocumentFile(file, "selfie", "selfie", () => setSelfieFile(null));
                    }}
                    disabled={kycUploadProgress.selfie.status === "uploading"}
                    className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
                  />
                  <p className="mt-2 text-xs text-slate-600">
                    {formatUploadSelectionStatus(
                      selfieFile,
                      kycUploads.selfie,
                      profile.selfieFileName,
                    )}
                  </p>
                  {kycUploadProgress.selfie.error ? (
                    <p className="mt-2 text-xs font-medium text-rose-600">{kycUploadProgress.selfie.error}</p>
                  ) : null}
                  {selfieFile || hasUploadedArtifact(kycUploads.selfie) || profile.selfieFileName ? (
                    <button
                      type="button"
                      onClick={() => {
                        uploadRequestIdsRef.current.selfie += 1;
                        setSelfieFile(null);
                        setKycUploads((current) => ({ ...current, selfie: null }));
                        updateDocumentProgress("selfie", { status: "pending", error: "" });
                        setProfile((current) => ({ ...current, selfieFileName: "" }));
                      }}
                      className="mt-2 text-xs font-semibold text-rose-600"
                    >
                      Remove file
                    </button>
                  ) : null}
                </label>

                <label className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-800">Aadhaar front</p>
                    <UploadStatusBadge status={kycUploadProgress.aadhaarFront.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Upload Aadhaar front image or PDF.
                  </p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setAadhaarFrontFile(file);
                      setProfile((current) => ({
                        ...current,
                        aadhaarFrontFileName: "",
                        aadhaarFileName: "",
                      }));
                      if (!file) {
                        uploadRequestIdsRef.current.aadhaarFront += 1;
                        setKycUploads((current) => ({ ...current, aadhaarFront: null }));
                        updateDocumentProgress("aadhaarFront", { status: "pending", error: "" });
                        return;
                      }
                      updateDocumentProgress("aadhaarFront", { status: "selected", error: "" });
                      void uploadDocumentFile(file, "aadhaarFront", "aadhaar-front", () => setAadhaarFrontFile(null));
                    }}
                    disabled={kycUploadProgress.aadhaarFront.status === "uploading"}
                    className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
                  />
                  <p className="mt-2 text-xs text-slate-600">
                    {formatUploadSelectionStatus(
                      aadhaarFrontFile,
                      kycUploads.aadhaarFront,
                      profile.aadhaarFrontFileName,
                    )}
                  </p>
                  {kycUploadProgress.aadhaarFront.error ? (
                    <p className="mt-2 text-xs font-medium text-rose-600">{kycUploadProgress.aadhaarFront.error}</p>
                  ) : null}
                  {aadhaarFrontFile || hasUploadedArtifact(kycUploads.aadhaarFront) || profile.aadhaarFrontFileName ? (
                    <button
                      type="button"
                      onClick={() => {
                        uploadRequestIdsRef.current.aadhaarFront += 1;
                        setAadhaarFrontFile(null);
                        setKycUploads((current) => ({ ...current, aadhaarFront: null }));
                        updateDocumentProgress("aadhaarFront", { status: "pending", error: "" });
                        setProfile((current) => ({ ...current, aadhaarFrontFileName: "" }));
                      }}
                      className="mt-2 text-xs font-semibold text-rose-600"
                    >
                      Remove file
                    </button>
                  ) : null}
                </label>

                <label className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-800">Aadhaar back</p>
                    <UploadStatusBadge status={kycUploadProgress.aadhaarBack.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Upload Aadhaar back image or PDF.</p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setAadhaarBackFile(file);
                      setProfile((current) => ({
                        ...current,
                        aadhaarBackFileName: "",
                        aadhaarFileName: "",
                      }));
                      if (!file) {
                        uploadRequestIdsRef.current.aadhaarBack += 1;
                        setKycUploads((current) => ({ ...current, aadhaarBack: null }));
                        updateDocumentProgress("aadhaarBack", { status: "pending", error: "" });
                        return;
                      }
                      updateDocumentProgress("aadhaarBack", { status: "selected", error: "" });
                      void uploadDocumentFile(file, "aadhaarBack", "aadhaar-back", () => setAadhaarBackFile(null));
                    }}
                    disabled={kycUploadProgress.aadhaarBack.status === "uploading"}
                    className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
                  />
                  <p className="mt-2 text-xs text-slate-600">
                    {formatUploadSelectionStatus(
                      aadhaarBackFile,
                      kycUploads.aadhaarBack,
                      profile.aadhaarBackFileName,
                    )}
                  </p>
                  {kycUploadProgress.aadhaarBack.error ? (
                    <p className="mt-2 text-xs font-medium text-rose-600">{kycUploadProgress.aadhaarBack.error}</p>
                  ) : null}
                  {aadhaarBackFile || hasUploadedArtifact(kycUploads.aadhaarBack) || profile.aadhaarBackFileName ? (
                    <button
                      type="button"
                      onClick={() => {
                        uploadRequestIdsRef.current.aadhaarBack += 1;
                        setAadhaarBackFile(null);
                        setKycUploads((current) => ({ ...current, aadhaarBack: null }));
                        updateDocumentProgress("aadhaarBack", { status: "pending", error: "" });
                        setProfile((current) => ({ ...current, aadhaarBackFileName: "" }));
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

          {step === 5 ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Live Video Verification</h3>
                <p className="mt-1 text-xs text-slate-600">
                  Record a short live video inside this flow. Keep it between {LIVE_VIDEO_MIN_SECONDS} and {LIVE_VIDEO_MAX_SECONDS} seconds.
                </p>
                <p className="mt-1 text-xs font-semibold text-[#0f766e]">
                  Recording stops automatically after {LIVE_VIDEO_MAX_SECONDS} seconds.
                </p>
              </div>

              {browserEnvironment.isInAppBrowser ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">{IN_APP_BROWSER_WARNING}</p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    Copy this page link, open Safari or Chrome, paste the link into the address bar, and continue there.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      void handleCopyCurrentUrl();
                    }}
                    className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-900"
                  >
                    <Copy size={14} />
                    Copy Page Link
                  </button>
                  {copyLinkMessage ? <p className="mt-2 break-words text-xs font-medium">{copyLinkMessage}</p> : null}
                </div>
              ) : null}

              <div className="rounded-xl border border-[#dceae5] bg-[#f7fbf9] p-3 sm:p-4">
                <p className="text-sm font-semibold text-slate-900">Read this script while recording</p>
                <div className="mt-2 max-h-[132px] overflow-y-auto rounded-lg border border-[#dceae5] bg-white px-3 py-2 text-sm leading-6 text-slate-700">
                  {liveVerificationScript}
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
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={`font-semibold tabular-nums ${
                        isRecordingCountdownCritical ? "text-lg text-rose-600" : "text-sm text-slate-900"
                      }`}
                    >
                      {isRecordingLiveVideo
                        ? `Recording ${recordingSeconds}s · ${recordingSecondsRemaining}s remaining`
                        : liveVideoUploadProgress.status === "uploading"
                          ? "Recording saved. Uploading..."
                          : liveVideoUploaded
                            ? "Live video uploaded"
                            : liveVideo.file
                              ? "Recording saved. Uploading..."
                              : isCameraEnabled
                                ? "Camera enabled"
                                : "Camera permission required"}
                    </p>
                    <UploadStatusBadge
                      status={isRecordingLiveVideo ? "selected" : liveVideoUploadProgress.status}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {liveVideoUploaded
                      ? "Your live verification video is uploaded. Re-record only if you want to replace it."
                      : "Tap Enable Camera first. Your browser will ask for camera and microphone permission."}
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-600">
                    {formatUploadSelectionStatus(
                      liveVideo.file,
                      liveVideo.upload,
                      liveVideo.upload?.fileName,
                    )}
                  </p>
                  {liveVideoUploadProgress.status === "uploading" ? (
                    <p className="mt-2 text-xs font-semibold text-[#0f766e]">Uploading live video...</p>
                  ) : null}
                  {liveVideoUploadProgress.error ? (
                    <p className="mt-2 text-xs font-medium text-rose-600">{liveVideoUploadProgress.error}</p>
                  ) : null}
                  {permissionStates.camera !== "unsupported" || permissionStates.microphone !== "unsupported" ? (
                    <p className="mt-2 text-xs font-medium text-slate-600">
                      Camera: {permissionStates.camera}. Microphone: {permissionStates.microphone}.
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-col gap-2">
                    {!isRecordingLiveVideo && !isCameraEnabled ? (
                      <button
                        type="button"
                        onClick={() => {
                          void handleEnableCamera();
                        }}
                        disabled={isEnablingCamera || isLiveVideoUploadInProgress}
                        className="h-10 rounded-xl bg-[#0f766e] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isEnablingCamera
                          ? "Enabling Camera..."
                          : recordingError
                            ? "Retry Camera"
                            : liveVideo.file || hasLiveVideoArtifact(liveVideo.upload)
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
                        disabled={isLiveVideoUploadInProgress}
                        className="h-10 rounded-xl bg-[#0f766e] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
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
                    {!isRecordingLiveVideo ? (
                      <button
                        type="button"
                        onClick={() => setPermissionHelpOpen((current) => !current)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
                      >
                        <HelpCircle size={16} />
                        {permissionHelpOpen ? "Hide Permission Help" : "Open Permission Help"}
                      </button>
                    ) : null}
                    {!isRecordingLiveVideo ? (
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
                      >
                        <RefreshCw size={16} />
                        Refresh Page
                      </button>
                    ) : null}
                    {liveVideo.file || hasLiveVideoArtifact(liveVideo.upload) ? (
                      <button
                        type="button"
                        onClick={handleRemoveLiveVideo}
                        className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
                      >
                        Remove Video
                      </button>
                    ) : null}
                  </div>
                  {recordingError || shouldEmphasizePermissionHelp ? (
                    <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700">
                      <p className="font-semibold">{recordingError || CAMERA_PERMISSION_DENIED_MESSAGE}</p>
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
                  {permissionHelpOpen ? (
                    <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                      <p className="font-semibold">
                        {browserEnvironment.permissionGuide === "ios-safari"
                          ? "iPhone / Safari permission steps"
                          : browserEnvironment.permissionGuide === "android-chrome"
                            ? "Android / Chrome permission steps"
                            : "Camera and microphone permission steps"}
                      </p>
                      <ol className="mt-2 list-decimal space-y-1.5 pl-4">
                        {permissionHelpSteps.map((stepItem) => (
                          <li key={stepItem}>{stepItem}</li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                  {errors.base ? <p className="mt-3 text-xs font-medium text-rose-600">{errors.base}</p> : null}
                </div>
              </div>

            </div>
          ) : null}

          {step === 6 ? (
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
                {!liveVideoUploaded ? (
                  <button
                    type="button"
                    onClick={() => {
                      setErrors({ base: "Please wait until your live verification video is uploaded." });
                      setStep(5);
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
                disabled={
                  (step === 4 && (!requiredDocumentsUploaded || isDocumentUploadInProgress)) ||
                  (step === 5 && (!liveVideoUploaded || isLiveVideoUploadInProgress))
                }
                className="inline-flex h-10 items-center gap-1 rounded-full bg-[#0f766e] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
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
