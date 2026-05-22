import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firebaseStorage } from "@/lib/firebase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
export const MAX_PARTNER_GALLERY_IMAGES = 6;

type PartnerProfileUploadKind = "profile" | "gallery";

type UploadPartnerProfileMediaParams = {
  file: File;
  uid: string;
  kind: PartnerProfileUploadKind;
};

export type PartnerProfileUploadResult = {
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
  const normalizedBase = safeBase || "image";
  return `${normalizedBase}${ext}`;
}

function validateImage(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Only JPG, JPEG, PNG, or WEBP images are allowed.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Each image must be 5 MB or smaller.");
  }
}

export async function uploadPartnerProfileMedia(
  params: UploadPartnerProfileMediaParams,
): Promise<PartnerProfileUploadResult> {
  const { file, uid, kind } = params;
  if (!firebaseStorage) {
    throw new Error("Image upload is not configured.");
  }
  if (!uid || uid.trim().length === 0) {
    throw new Error("Your partner login session could not be verified. Please login again.");
  }

  validateImage(file);

  const cleanName = sanitizeFileName(file.name || "image");
  const timestamp = Date.now();
  const storagePath = `YoPartner/partner-profile/${uid}/${kind}/${timestamp}-${cleanName}`;
  const mediaRef = ref(firebaseStorage, storagePath);

  await uploadBytes(mediaRef, file, { contentType: file.type });
  const downloadUrl = await getDownloadURL(mediaRef);

  return {
    fileName: cleanName,
    storagePath,
    downloadUrl,
    contentType: file.type,
    size: file.size,
  };
}

export async function deletePartnerProfileMediaByPath(storagePath: string) {
  if (!firebaseStorage || !storagePath?.trim()) return;
  try {
    await deleteObject(ref(firebaseStorage, storagePath.trim()));
  } catch {
    // Best-effort cleanup only.
  }
}
