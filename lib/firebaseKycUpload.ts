import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getCurrentFirebaseUser, subscribeFirebaseAuthState } from "@/lib/auth/firebasePhoneAuth";
import { firebaseStorage } from "@/lib/firebase/client";

const MAX_DOCUMENT_FILE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

type PartnerKycType = "selfie" | "aadhaar-front" | "aadhaar-back" | "pan" | "live-video";

type UploadPartnerKycFileParams = {
  file: File;
  uid?: string;
  type: PartnerKycType;
};

export type PartnerKycUploadResult = {
  fileName: string;
  storagePath: string;
  downloadUrl: string;
  contentType: string;
  size: number;
};

function sanitizeFileName(name: string) {
  const trimmed = name.trim();
  const dotIndex = trimmed.lastIndexOf(".");
  const base = dotIndex > 0 ? trimmed.slice(0, dotIndex) : trimmed;
  const ext = dotIndex > 0 ? trimmed.slice(dotIndex).toLowerCase() : "";
  const safeBase = base
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "");
  const normalizedBase = safeBase || "document";
  return `${normalizedBase}${ext}`;
}

function validateFile(file: File, type: PartnerKycType) {
  if (type === "live-video") {
    const videoType = file.type.toLowerCase();
    const isAllowedVideo = videoType === "video/mp4" || videoType === "video/webm" || videoType.startsWith("video/webm;");
    if (!isAllowedVideo) {
      throw new Error("Live verification video must be WEBM or MP4.");
    }
    if (file.size > MAX_VIDEO_FILE_SIZE) {
      throw new Error("Live verification video must be 50 MB or smaller.");
    }
    return;
  }

  if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG, WEBP, or PDF files are allowed.");
  }
  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    throw new Error("Each verification document must be 5 MB or smaller.");
  }
}

async function waitForFirebaseUser(timeoutMs = 10000) {
  const existing = getCurrentFirebaseUser();
  if (existing) return existing;
  if (typeof window === "undefined") return null;

  return new Promise<ReturnType<typeof getCurrentFirebaseUser>>((resolve) => {
    let settled = false;
    let pendingUnsubscribe = false;
    let unsubscribe: (() => void) | null = null;
    const timer = window.setTimeout(() => {
      finish(getCurrentFirebaseUser());
    }, timeoutMs);

    const finish = (value: ReturnType<typeof getCurrentFirebaseUser>) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (unsubscribe) {
        unsubscribe();
      } else {
        pendingUnsubscribe = true;
      }
      resolve(value);
    };

    unsubscribe = subscribeFirebaseAuthState((user) => {
      finish(user);
    });

    if (pendingUnsubscribe) unsubscribe();
  });
}

function toUploadError(error: unknown, context: { uid: string | null; storagePath: string }) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  const message = typeof error === "object" && error && "message" in error ? String((error as { message?: unknown }).message ?? "") : "";

  if (process.env.NODE_ENV !== "production") {
    console.warn("[partner-kyc-upload] firebase storage upload failed", {
      code,
      message,
      uid: context.uid,
      storagePath: context.storagePath,
    });
  }

  if (code === "storage/unauthorized") {
    return new Error("KYC upload is blocked by Firebase Storage rules. Please publish the partner KYC storage rule and try again.");
  }
  if (code === "storage/unauthenticated") {
    return new Error("Please login again as a partner before uploading KYC documents.");
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error;
  }
  return new Error("Unable to upload verification documents right now.");
}

export async function uploadPartnerKycFile(
  params: UploadPartnerKycFileParams,
): Promise<PartnerKycUploadResult> {
  const { file, uid, type } = params;
  if (!firebaseStorage) {
    throw new Error("Document upload is not configured.");
  }

  const authUser = (await waitForFirebaseUser()) ?? getCurrentFirebaseUser();
  const authUid = authUser?.uid?.trim();
  if (!authUser || !authUid) {
    throw new Error("Your login session could not be verified. Please login again as a partner.");
  }
  const requestedUid = uid?.trim();
  if (requestedUid && requestedUid !== authUid) {
    throw new Error("Your login session does not match the selected KYC upload path. Please login again as a partner.");
  }

  validateFile(file, type);

  const cleanName = sanitizeFileName(file.name || "document");
  const timestamp = Date.now();
  const storagePath = `YoPartner/partner-kyc/${authUid}/${type}/${timestamp}-${cleanName}`;
  const kycRef = ref(firebaseStorage, storagePath);

  let downloadUrl = "";
  try {
    await authUser.getIdToken(true);
    await uploadBytes(kycRef, file, {
      contentType: file.type,
    });
    downloadUrl = await getDownloadURL(kycRef);
  } catch (error) {
    throw toUploadError(error, { uid: authUid, storagePath });
  }

  return {
    fileName: cleanName,
    storagePath,
    downloadUrl,
    contentType: file.type,
    size: file.size,
  };
}
