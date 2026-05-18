import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firebaseStorage } from "@/lib/firebase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

type PartnerKycType = "selfie" | "aadhaar-front" | "aadhaar-back" | "pan";

type UploadPartnerKycFileParams = {
  file: File;
  uid: string;
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

function validateFile(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG, WEBP, or PDF files are allowed.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Each verification document must be 5 MB or smaller.");
  }
}

export async function uploadPartnerKycFile(
  params: UploadPartnerKycFileParams,
): Promise<PartnerKycUploadResult> {
  const { file, uid, type } = params;
  if (!firebaseStorage) {
    throw new Error("Document upload is not configured.");
  }
  if (!uid || uid.trim().length === 0) {
    throw new Error("Your login session could not be verified. Please login again as a partner.");
  }

  validateFile(file);

  const cleanName = sanitizeFileName(file.name || "document");
  const timestamp = Date.now();
  const storagePath = `YoPartner/partner-kyc/${uid}/${type}/${timestamp}-${cleanName}`;
  const kycRef = ref(firebaseStorage, storagePath);

  await uploadBytes(kycRef, file, {
    contentType: file.type,
  });
  const downloadUrl = await getDownloadURL(kycRef);

  return {
    fileName: cleanName,
    storagePath,
    downloadUrl,
    contentType: file.type,
    size: file.size,
  };
}
