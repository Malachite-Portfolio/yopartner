"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import {
  getAdminApplicationById,
  listApplications,
  type AdminApplicationUpdateStatus,
  updateAdminApplicationStatus,
} from "@/lib/api/admin";
import { clearAdminAuthSession } from "@/lib/adminAuth";
import { formatDateTime } from "@/lib/adminStore";

type RowAction = "approve" | "reject" | "needs_info";

type DetailRow = {
  label: string;
  value: string;
};

type SafetyRow = {
  label: string;
  done: boolean;
};

type DocumentInfo = {
  uploaded: boolean;
  fileName: string;
  url: string;
};

type ApplicationDetails = {
  id: string;
  applicationId: string;
  fullName: string;
  loginPhone: string;
  firebaseUid: string;
  submittedDate: string;
  age: string;
  gender: string;
  city: string;
  kycStatus: "Complete" | "Partial" | "Missing";
  status: string;
  about: string;
  tagline: string;
  communicationStyle: string[];
  languages: string[];
  education: DetailRow[];
  hobbies: string[];
  categories: string[];
  services: string[];
  chatPrice: string;
  audioPrice: string;
  videoPrice: string;
  homeVisitRequested: boolean;
  homeVisitPrice: string;
  selfie: DocumentInfo;
  aadhaarFront: DocumentInfo;
  aadhaarBack: DocumentInfo;
  pan: DocumentInfo;
  safetyChecklist: SafetyRow[];
  adminNote: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = "-") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
}

function titleCase(value: string) {
  return value
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeService(value: string) {
  const normalized = value.trim().toUpperCase();
  if (normalized === "CHAT") return "Chat";
  if (normalized === "AUDIO") return "Audio Call";
  if (normalized === "VIDEO") return "Video Call";
  if (normalized === "HOME_VISIT") return "Home Visit";
  return value.trim();
}

function parseBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "yes" || normalized === "1";
  }
  return false;
}

function hasDocumentValue(value: unknown) {
  if (typeof value === "string") return value.trim().length > 0;
  if (value && typeof value === "object") return true;
  return false;
}

function getDocumentInfo(...values: unknown[]): DocumentInfo {
  for (const value of values) {
    if (!value) continue;
    if (typeof value === "string") {
      const normalized = value.trim();
      if (!normalized) continue;
      const isUrl = normalized.startsWith("http://") || normalized.startsWith("https://");
      return {
        uploaded: true,
        fileName: isUrl ? "" : normalized,
        url: isUrl ? normalized : "",
      };
    }
    if (typeof value === "object") {
      const record = asRecord(value);
      const url = asString(record.url ?? record.downloadUrl ?? record.fileUrl ?? "", "");
      const fileName = asString(record.fileName ?? record.name ?? "", "");
      if (!url && !fileName && !hasDocumentValue(value)) continue;
      return {
        uploaded: true,
        fileName,
        url,
      };
    }
  }

  return {
    uploaded: false,
    fileName: "",
    url: "",
  };
}

function getDocumentInfoFromFields(
  application: Record<string, unknown>,
  payload: Record<string, unknown>,
  key: "selfie" | "aadhaarFront" | "aadhaarBack" | "pan",
  fallbacks: unknown[] = [],
) {
  const uploaded = parseBoolean(application[`${key}Uploaded`] ?? payload[`${key}Uploaded`]);
  const fileName = asString(application[`${key}FileName`] ?? payload[`${key}FileName`], "");
  const storagePath = asString(application[`${key}StoragePath`] ?? payload[`${key}StoragePath`], "");
  const url = asString(application[`${key}Url`] ?? payload[`${key}Url`], "");
  const fromFallback = getDocumentInfo(...fallbacks);
  const hasMetadata = Boolean(fileName || storagePath || url);

  if (uploaded || hasMetadata) {
    return {
      uploaded: true,
      fileName: fileName || fromFallback.fileName,
      url: url || fromFallback.url,
    };
  }

  return fromFallback;
}

function extractApplication(applicationRaw: unknown): ApplicationDetails {
  const application = asRecord(applicationRaw);
  const payload = asRecord(application.payload);
  const applicantUser = asRecord(application.applicantUser);

  const services = (
    asStringArray(application.servicesOffered).length > 0
      ? asStringArray(application.servicesOffered)
      : asStringArray(payload.servicesOffered)
  ).map(normalizeService);

  const categories = asStringArray(application.categories).length > 0
    ? asStringArray(application.categories)
    : asStringArray(payload.categories);

  const safetyValues = asStringArray(application.safetyChecklist).length > 0
    ? asStringArray(application.safetyChecklist)
    : asStringArray(payload.safetyChecklist);
  const safetyNormalized = new Set(safetyValues.map((item) => item.toLowerCase()));

  const homeVisitPriceRaw =
    application.homeVisitPrice ??
    application.homeVisitPricePerSession ??
    application.visitPrice ??
    payload.homeVisitPrice ??
    payload.homeVisitPricePerSession ??
    payload.visitPrice;
  const homeVisitPrice = asString(homeVisitPriceRaw, "-");

  const homeVisitRequested =
    services.some((item) => item.toLowerCase() === "home visit") ||
    parseBoolean(application.homeVisitRequested ?? payload.homeVisitRequested) ||
    (homeVisitPrice !== "-" && homeVisitPrice !== "0");

  const selfie = getDocumentInfoFromFields(application, payload, "selfie", [
    application.selfieDocument,
    payload.selfieDocument,
  ]);
  const aadhaarFront = getDocumentInfoFromFields(application, payload, "aadhaarFront", [
    application.aadhaarFrontDocument,
    payload.aadhaarFrontDocument,
  ]);
  const aadhaarBack = getDocumentInfoFromFields(application, payload, "aadhaarBack", [
    application.aadhaarBackDocument,
    payload.aadhaarBackDocument,
  ]);
  const pan = getDocumentInfoFromFields(application, payload, "pan", [
    application.panDocument,
    payload.panDocument,
  ]);

  if (!aadhaarFront.uploaded || !aadhaarBack.uploaded) {
    const legacyAadhaar = getDocumentInfo(
      application.aadhaarDocument,
      payload.aadhaarDocument,
      application.aadhaarUrl,
      payload.aadhaarUrl,
      application.aadhaarFileName,
      payload.aadhaarFileName,
    );
    if (!aadhaarFront.uploaded && legacyAadhaar.uploaded) {
      aadhaarFront.uploaded = true;
      aadhaarFront.fileName = aadhaarFront.fileName || legacyAadhaar.fileName;
      aadhaarFront.url = aadhaarFront.url || legacyAadhaar.url;
    }
    if (!aadhaarBack.uploaded && legacyAadhaar.uploaded) {
      aadhaarBack.uploaded = true;
      aadhaarBack.fileName = aadhaarBack.fileName || legacyAadhaar.fileName;
      aadhaarBack.url = aadhaarBack.url || legacyAadhaar.url;
    }
  }

  const uploadedDocs = [selfie.uploaded, aadhaarFront.uploaded, aadhaarBack.uploaded, pan.uploaded].filter(Boolean).length;
  const kycStatus: ApplicationDetails["kycStatus"] =
    uploadedDocs === 4 ? "Complete" : uploadedDocs > 0 ? "Partial" : "Missing";

  return {
    id: asString(application.id),
    applicationId: asString(application.applicationId ?? application.id),
    fullName: asString(application.fullName ?? payload.fullName),
    loginPhone: asString(applicantUser.phoneNumber),
    firebaseUid: asString(applicantUser.firebaseUid),
    submittedDate: asString(application.submittedAt ?? application.createdAt ?? application.updatedAt, new Date().toISOString()),
    age: asString(application.age ?? payload.age),
    gender: asString(application.gender ?? payload.gender),
    city: asString(application.bornCity ?? application.city ?? payload.bornCity ?? payload.city),
    kycStatus,
    status: titleCase(asString(application.status, "UNDER_REVIEW")),
    about: asString(application.aboutYourself ?? payload.aboutYourself),
    tagline: asString(application.profileTagline ?? payload.profileTagline),
    communicationStyle: asStringArray(application.communicationStyle).length > 0
      ? asStringArray(application.communicationStyle)
      : asStringArray(payload.communicationStyle),
    languages: asStringArray(application.languagesKnown).length > 0
      ? asStringArray(application.languagesKnown)
      : asStringArray(payload.languagesKnown),
    education: [
      { label: "School", value: asString(application.school ?? payload.school) },
      { label: "College", value: asString(application.college ?? payload.college) },
      { label: "Qualification", value: asString(application.qualification ?? payload.qualification) },
    ],
    hobbies: asStringArray(application.hobbies).length > 0 ? asStringArray(application.hobbies) : asStringArray(payload.hobbies),
    categories,
    services,
    chatPrice: asString(application.chatPrice ?? payload.chatPrice, "0"),
    audioPrice: asString(application.audioPrice ?? payload.audioPrice, "0"),
    videoPrice: asString(application.videoPrice ?? payload.videoPrice, "0"),
    homeVisitRequested,
    homeVisitPrice,
    selfie,
    aadhaarFront,
    aadhaarBack,
    pan,
    safetyChecklist: [
      {
        label: "Strictly platonic",
        done: safetyNormalized.has("strictly platonic") || parseBoolean(payload.safetyPlatonicOnly),
      },
      {
        label: "Respectful communication",
        done: safetyNormalized.has("respectful communication") || parseBoolean(payload.safetyRespectfulRules),
      },
      {
        label: "No outside payments",
        done: safetyNormalized.has("no personal payment/contact sharing") || parseBoolean(payload.safetyNoOutsidePayments),
      },
      {
        label: "Profile review accepted",
        done: safetyNormalized.has("profile review and verification") || parseBoolean(payload.safetyReviewVerification),
      },
    ],
    adminNote: asString(application.adminNote, ""),
  };
}

export default function AdminApplicationDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";

  const [details, setDetails] = useState<ApplicationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [rowActionLoading, setRowActionLoading] = useState<RowAction | null>(null);
  const [adminNoteDraft, setAdminNoteDraft] = useState("");

  const loadDetails = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError("Application id is missing.");
      return;
    }

    setLoading(true);
    setError("");

    const detailResponse = await getAdminApplicationById(id);
    if (detailResponse.error?.status === 401) {
      clearAdminAuthSession();
      router.replace("/admin/login");
      return;
    }

    if (detailResponse.data?.application) {
      const parsed = extractApplication(detailResponse.data.application);
      setDetails(parsed);
      setAdminNoteDraft(parsed.adminNote);
      setLoading(false);
      return;
    }

    const listResponse = await listApplications();
    if (listResponse.error?.status === 401) {
      clearAdminAuthSession();
      router.replace("/admin/login");
      return;
    }
    if (listResponse.error) {
      setError(listResponse.error.message || "Application details could not be loaded.");
      setLoading(false);
      return;
    }

    const root = asRecord(listResponse.data);
    const list = Array.isArray(root.applications)
      ? root.applications
      : Array.isArray(root.data)
        ? root.data
        : [];
    const found = list.find((item) => {
      const record = asRecord(item);
      return String(record.id ?? "") === id || String(record.applicationId ?? "") === id;
    });

    if (!found) {
      setError("Application not found.");
      setLoading(false);
      return;
    }

    const parsed = extractApplication(found);
    setDetails(parsed);
    setAdminNoteDraft(parsed.adminNote);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDetails();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [loadDetails]);

  const servicesLabel = useMemo(() => {
    if (!details) return "-";
    return details.services.length > 0 ? details.services.join(", ") : "-";
  }, [details]);

  const applyStatusAction = async (status: AdminApplicationUpdateStatus, action: RowAction, note?: string) => {
    if (!details) return;
    setRowActionLoading(action);
    setError("");
    setSuccessMessage("");

    const response = await updateAdminApplicationStatus(details.id, status, note);
    setRowActionLoading(null);

    if (response.error) {
      if (response.error.status === 401) {
        clearAdminAuthSession();
        router.replace("/admin/login");
        return;
      }
      setError(response.error.message || "Failed to update application.");
      return;
    }

    setDetails((current) => {
      if (!current) return current;
      return {
        ...current,
        status: titleCase(status),
        adminNote: note ?? current.adminNote,
      };
    });
    setSuccessMessage(
      status === "APPROVED"
        ? "Application approved successfully."
        : status === "REJECTED"
          ? "Application rejected successfully."
          : "Application moved to Needs Info successfully.",
    );
    void loadDetails();
  };

  const handleApprove = async () => {
    const confirmed = window.confirm("Approve this partner application? This will activate the companion profile.");
    if (!confirmed) return;
    await applyStatusAction("APPROVED", "approve", adminNoteDraft.trim() || undefined);
  };

  const handleReject = async () => {
    const confirmed = window.confirm("Reject this partner application?");
    if (!confirmed) return;
    await applyStatusAction("REJECTED", "reject", adminNoteDraft.trim() || undefined);
  };

  const handleNeedsInfo = async () => {
    await applyStatusAction("NEEDS_INFO", "needs_info", adminNoteDraft.trim() || undefined);
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Application details</h2>
        <article className="rounded-3xl border border-[#dceae5] bg-white p-4 text-sm text-slate-600 shadow-sm">
          Loading application details...
        </article>
      </section>
    );
  }

  if (!details) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Application details</h2>
        <article className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error || "Application details are unavailable."}
        </article>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-[#dceae5] bg-white p-5 shadow-sm shadow-teal-900/5">
        <Link href="/admin/applications" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
          <ArrowLeft size={15} />
          Back to applications
        </Link>
        <p className="mt-4 text-sm font-semibold text-[#0f766e]">Application Review</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">Application {details.applicationId}</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <AdminStatusBadge status={details.status} />
          <AdminStatusBadge status={details.kycStatus} />
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">{error}</p>
      ) : null}
      {successMessage ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{successMessage}</p>
      ) : null}

      <article className="space-y-4 rounded-3xl border border-[#dceae5] bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Applicant overview</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <p><span className="font-semibold text-slate-900">Application ID:</span> {details.applicationId}</p>
          <p><span className="font-semibold text-slate-900">Submitted:</span> {formatDateTime(details.submittedDate)}</p>
          <p><span className="font-semibold text-slate-900">Full Name:</span> {details.fullName}</p>
          <p><span className="font-semibold text-slate-900">Login Phone:</span> {details.loginPhone}</p>
          <p><span className="font-semibold text-slate-900">Firebase UID:</span> {details.firebaseUid}</p>
          <p><span className="font-semibold text-slate-900">Age / Gender / City:</span> {details.age} / {details.gender} / {details.city}</p>
          <p><span className="font-semibold text-slate-900">KYC Status:</span> {details.kycStatus}</p>
          <p><span className="font-semibold text-slate-900">Application Status:</span> {details.status}</p>
        </div>

        <h3 className="text-base font-semibold text-slate-900">Profile details</h3>
        <div>
          <p className="font-semibold text-slate-900">Tagline</p>
          <p className="mt-1 text-slate-700">{details.tagline}</p>
        </div>

        <div>
          <p className="font-semibold text-slate-900">About</p>
          <p className="mt-1 text-slate-700">{details.about}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <p><span className="font-semibold text-slate-900">Communication style:</span> {details.communicationStyle.join(", ") || "-"}</p>
          <p><span className="font-semibold text-slate-900">Languages:</span> {details.languages.join(", ") || "-"}</p>
          <p><span className="font-semibold text-slate-900">Hobbies:</span> {details.hobbies.join(", ") || "-"}</p>
          <p><span className="font-semibold text-slate-900">Categories:</span> {details.categories.join(", ") || "-"}</p>
        </div>

        <div>
          <p className="font-semibold text-slate-900">Education</p>
          <div className="mt-1 grid gap-2 sm:grid-cols-3">
            {details.education.map((item) => (
              <p key={item.label}><span className="font-medium text-slate-700">{item.label}:</span> {item.value}</p>
            ))}
          </div>
        </div>

        <div>
          <p className="font-semibold text-slate-900">Services and prices</p>
          <p className="mt-1 text-slate-700">{servicesLabel}</p>
          <p className="mt-1 text-slate-700">Chat: {details.chatPrice}/min | Audio: {details.audioPrice}/min | Video: {details.videoPrice}/min</p>
          <p className="mt-1 text-slate-700">
            Home Visit requested: {details.homeVisitRequested ? "Yes" : "No"}
            {details.homeVisitRequested ? ` (${details.homeVisitPrice === "-" ? "price pending" : `${details.homeVisitPrice}/session`})` : ""}
          </p>
          {details.homeVisitRequested ? (
            <p className="mt-1 text-xs text-amber-700">Manual approval required before Home Visit can be activated.</p>
          ) : null}
        </div>

        <h3 className="text-base font-semibold text-slate-900">KYC documents</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p><span className="font-semibold text-slate-900">Selfie:</span> {details.selfie.uploaded ? "Uploaded" : "Missing"}</p>
            {details.selfie.url ? (
              <a href={details.selfie.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[#0f766e] underline">
                View Document
              </a>
            ) : details.selfie.fileName ? (
              <p className="text-xs text-slate-600">{details.selfie.fileName} | Storage pending connection.</p>
            ) : null}
          </div>
          <div>
            <p><span className="font-semibold text-slate-900">Aadhaar Front:</span> {details.aadhaarFront.uploaded ? "Uploaded" : "Missing"}</p>
            {details.aadhaarFront.url ? (
              <a href={details.aadhaarFront.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[#0f766e] underline">
                View Document
              </a>
            ) : details.aadhaarFront.fileName ? (
              <p className="text-xs text-slate-600">{details.aadhaarFront.fileName} | Storage pending connection.</p>
            ) : null}
          </div>
          <div>
            <p><span className="font-semibold text-slate-900">Aadhaar Back:</span> {details.aadhaarBack.uploaded ? "Uploaded" : "Missing"}</p>
            {details.aadhaarBack.url ? (
              <a href={details.aadhaarBack.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[#0f766e] underline">
                View Document
              </a>
            ) : details.aadhaarBack.fileName ? (
              <p className="text-xs text-slate-600">{details.aadhaarBack.fileName} | Storage pending connection.</p>
            ) : null}
          </div>
          <div>
            <p><span className="font-semibold text-slate-900">PAN:</span> {details.pan.uploaded ? "Uploaded" : "Missing"}</p>
            {details.pan.url ? (
              <a href={details.pan.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[#0f766e] underline">
                View Document
              </a>
            ) : details.pan.fileName ? (
              <p className="text-xs text-slate-600">{details.pan.fileName} | Storage pending connection.</p>
            ) : null}
          </div>
        </div>

        <div>
          <p className="font-semibold text-slate-900">Safety checklist</p>
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            {details.safetyChecklist.map((item) => (
              <p key={item.label}><span className="font-medium text-slate-700">{item.label}:</span> {item.done ? "Done" : "Pending"}</p>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-slate-900">Admin note</p>
          <textarea
            value={adminNoteDraft}
            onChange={(event) => setAdminNoteDraft(event.target.value)}
            className="min-h-24 w-full rounded-xl border border-[#dceae5] px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#0f766e]"
            placeholder="Add notes for approval, rejection, or additional information..."
          />
        </div>
      </article>

      <article className="rounded-3xl border border-[#dceae5] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              void handleApprove();
            }}
            disabled={rowActionLoading !== null}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {rowActionLoading === "approve" ? "Approving..." : "Approve"}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleReject();
            }}
            disabled={rowActionLoading !== null}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {rowActionLoading === "reject" ? "Rejecting..." : "Reject"}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleNeedsInfo();
            }}
            disabled={rowActionLoading !== null}
            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {rowActionLoading === "needs_info" ? "Saving..." : "Need Info"}
          </button>
        </div>
      </article>
    </section>
  );
}


