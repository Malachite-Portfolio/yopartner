import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getCurrentFirebaseUser, subscribeFirebaseAuthState } from "@/lib/auth/firebasePhoneAuth";
import { firebaseStorage } from "@/lib/firebase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
export const MAX_PARTNER_GALLERY_IMAGES = 6;

type PartnerProfileUploadKind = "profile" | "gallery";

type UploadPartnerProfileMediaParams = {
  file: File;
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

async function waitForFirebaseUser(timeoutMs = 2500) {
  const existing = getCurrentFirebaseUser();
  if (existing) return existing;
  if (typeof window === "undefined") return null;

  return new Promise<ReturnType<typeof getCurrentFirebaseUser>>((resolve) => {
    let settled = false;
    const finish = (value: ReturnType<typeof getCurrentFirebaseUser>) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      unsubscribe();
      resolve(value);
    };

    const unsubscribe = subscribeFirebaseAuthState((user) => {
      finish(user);
    });

    const timer = window.setTimeout(() => {
      finish(getCurrentFirebaseUser());
    }, timeoutMs);
  });
}

function toUploadError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  if (code === "storage/unauthorized") {
    return new Error("Upload blocked by Firebase Storage rules. Please try again after permission update.");
  }
  if (error instanceof Error && typeof error.message === "string" && error.message.trim()) {
    return error;
  }
  return new Error("Unable to upload image right now.");
}

export async function uploadPartnerProfileMedia(
  params: UploadPartnerProfileMediaParams,
): Promise<PartnerProfileUploadResult> {
  const { file, kind } = params;
  if (!firebaseStorage) {
    throw new Error("Image upload is not configured.");
  }
  const authUser = (await waitForFirebaseUser()) ?? getCurrentFirebaseUser();
  const uid = authUser?.uid?.trim();
  if (!uid) {
    throw new Error("Please login again to upload photos.");
  }

  validateImage(file);

  const cleanName = sanitizeFileName(file.name || "image");
  const timestamp = Date.now();
  const storagePath = `YoPartner/partner-profile/${uid}/${kind}/${timestamp}-${cleanName}`;
  const mediaRef = ref(firebaseStorage, storagePath);

  let downloadUrl = "";
  try {
    await uploadBytes(mediaRef, file, { contentType: file.type });
    downloadUrl = await getDownloadURL(mediaRef);
  } catch (error) {
    throw toUploadError(error);
  }

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
