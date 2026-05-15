import { getPartnerApplications, getPartnerDashboard, getPartnerProfile } from "@/lib/api/partner";
import { isClientDemoEnabled, isClientDemoPartnerSessionActive } from "@/lib/clientDemoData";
import { getPartnerProfile as getLocalPartnerProfile, readJSON, writeJSON } from "@/lib/partnerAuth";
import { defaultPartnerProfile, type PartnerProfile } from "@/lib/partnerData";

export type PartnerApprovalState = {
  applicationStatus?: "NOT_SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "NEEDS_INFO";
  kycStatus?: "PENDING" | "VERIFIED" | "FAILED" | "NEEDS_REVIEW";
  companionStatus?: "UNDER_REVIEW" | "ACTIVE" | "SUSPENDED";
  verificationStatus?: "PENDING" | "VERIFIED" | "FAILED" | "NEEDS_REVIEW";
  reviewStatus?: string;
};

const PARTNER_APPROVAL_STATE_KEY = "yopartner_partner_approval_state";

function normalizeApplicationStatus(value: unknown): PartnerApprovalState["applicationStatus"] | undefined {
  const raw = String(value ?? "").trim().toUpperCase();
  if (raw === "APPROVED") return "APPROVED";
  if (raw === "REJECTED") return "REJECTED";
  if (raw === "NEEDS_INFO" || raw === "NEEDS-INFO") return "NEEDS_INFO";
  if (raw === "UNDER_REVIEW" || raw === "UNDER-REVIEW" || raw === "PENDING") return "UNDER_REVIEW";
  if (raw === "NOT_SUBMITTED" || raw === "NOT-SUBMITTED" || raw === "NONE") return "NOT_SUBMITTED";
  return undefined;
}

function normalizeKycStatus(value: unknown): PartnerApprovalState["kycStatus"] | undefined {
  const raw = String(value ?? "").trim().toUpperCase();
  if (raw === "VERIFIED") return "VERIFIED";
  if (raw === "FAILED" || raw === "REJECTED") return "FAILED";
  if (raw === "NEEDS_REVIEW" || raw === "NEEDS-REVIEW") return "NEEDS_REVIEW";
  if (raw === "PENDING" || raw === "UNDER_REVIEW" || raw === "UNDER-REVIEW") return "PENDING";
  return undefined;
}

function normalizeCompanionStatus(value: unknown): PartnerApprovalState["companionStatus"] | undefined {
  const raw = String(value ?? "").trim().toUpperCase();
  if (raw === "ACTIVE") return "ACTIVE";
  if (raw === "SUSPENDED") return "SUSPENDED";
  if (raw === "UNDER_REVIEW" || raw === "UNDER-REVIEW" || raw === "PENDING") return "UNDER_REVIEW";
  return undefined;
}

function normalizeVerificationStatus(value: unknown): PartnerApprovalState["verificationStatus"] | undefined {
  const raw = String(value ?? "").trim().toUpperCase();
  if (raw === "VERIFIED") return "VERIFIED";
  if (raw === "FAILED" || raw === "REJECTED") return "FAILED";
  if (raw === "NEEDS_REVIEW" || raw === "NEEDS-REVIEW") return "NEEDS_REVIEW";
  if (raw === "PENDING" || raw === "UNDER_REVIEW" || raw === "UNDER-REVIEW") return "PENDING";
  return undefined;
}

function mergeState(base: PartnerApprovalState, next: PartnerApprovalState) {
  return {
    ...base,
    ...(next.applicationStatus ? { applicationStatus: next.applicationStatus } : {}),
    ...(next.kycStatus ? { kycStatus: next.kycStatus } : {}),
    ...(next.companionStatus ? { companionStatus: next.companionStatus } : {}),
    ...(next.verificationStatus ? { verificationStatus: next.verificationStatus } : {}),
    ...(next.reviewStatus ? { reviewStatus: next.reviewStatus } : {}),
  };
}

export function normalizePartnerApprovalState(apiData: unknown): PartnerApprovalState {
  const data = (apiData ?? {}) as Record<string, unknown>;
  const profile = (data.profile ?? {}) as Record<string, unknown>;
  const companion = (profile.companion ?? data.companion ?? {}) as Record<string, unknown>;
  const application = (data.application ?? profile.application ?? {}) as Record<string, unknown>;
  const payload = (application.payload ?? {}) as Record<string, unknown>;

  return {
    applicationStatus: normalizeApplicationStatus(
      data.applicationStatus ?? data.status ?? application.status ?? profile.reviewStatus ?? payload.reviewStatus,
    ),
    kycStatus: normalizeKycStatus(data.kycStatus ?? profile.kycStatus ?? payload.kycStatus),
    companionStatus: normalizeCompanionStatus(data.companionStatus ?? profile.status ?? companion.status),
    verificationStatus: normalizeVerificationStatus(
      data.verificationStatus ?? profile.verificationStatus ?? companion.verificationStatus ?? payload.verificationStatus,
    ),
    reviewStatus: String(profile.reviewStatus ?? payload.reviewStatus ?? data.reviewStatus ?? "").toLowerCase() || undefined,
  };
}

export function getLocalPartnerApprovalState(): PartnerApprovalState {
  const stored = readJSON<PartnerApprovalState>(PARTNER_APPROVAL_STATE_KEY, {});
  const profile = getLocalPartnerProfile<PartnerProfile>(defaultPartnerProfile);
  return mergeState(stored, {
    reviewStatus: profile.reviewStatus || undefined,
  });
}

export function saveLocalPartnerApprovalState(state: PartnerApprovalState) {
  const merged = mergeState(getLocalPartnerApprovalState(), state);
  writeJSON(PARTNER_APPROVAL_STATE_KEY, merged);
}

export function isPartnerApproved(state: PartnerApprovalState) {
  if (state.applicationStatus === "APPROVED") return true;
  if (state.companionStatus === "ACTIVE" && state.verificationStatus === "VERIFIED") return true;
  if (state.kycStatus === "VERIFIED" && state.reviewStatus === "approved") return true;
  return false;
}

export function isPartnerUnderReview(state: PartnerApprovalState) {
  return (
    state.applicationStatus === "UNDER_REVIEW" ||
    state.kycStatus === "PENDING" ||
    state.companionStatus === "UNDER_REVIEW" ||
    state.verificationStatus === "PENDING"
  );
}

export function getPartnerApprovalLabel(state: PartnerApprovalState) {
  if (isPartnerApproved(state)) {
    return { kyc: "KYC Verified", review: "Approved" };
  }
  return { kyc: "KYC Pending", review: "Under Review" };
}

export async function fetchPartnerApprovalState(): Promise<PartnerApprovalState> {
  if (isClientDemoEnabled() && isClientDemoPartnerSessionActive()) {
    const demoState: PartnerApprovalState = {
      applicationStatus: "APPROVED",
      kycStatus: "VERIFIED",
      companionStatus: "ACTIVE",
      verificationStatus: "VERIFIED",
      reviewStatus: "approved",
    };
    saveLocalPartnerApprovalState(demoState);
    return demoState;
  }

  let nextState = getLocalPartnerApprovalState();
  let hasBackendState = false;

  const profileResponse = await getPartnerProfile();
  if (profileResponse.data) {
    hasBackendState = true;
    nextState = mergeState(nextState, normalizePartnerApprovalState(profileResponse.data));
  }

  const applicationsResponse = await getPartnerApplications();
  if (applicationsResponse.data) {
    hasBackendState = true;
    nextState = mergeState(nextState, normalizePartnerApprovalState(applicationsResponse.data));
  }

  const dashboardResponse = await getPartnerDashboard();
  if (dashboardResponse.data) {
    hasBackendState = true;
    nextState = mergeState(nextState, normalizePartnerApprovalState(dashboardResponse.data));
  }

  if (!hasBackendState) {
    return nextState;
  }

  saveLocalPartnerApprovalState(nextState);
  return nextState;
}
