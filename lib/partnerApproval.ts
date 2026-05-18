import { getPartnerApplications, getPartnerDashboard, getPartnerProfile } from "@/lib/api/partner";
import { isClientDemoEnabled, isClientDemoPartnerSessionActive } from "@/lib/clientDemoData";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { getPartnerProfile as getLocalPartnerProfile, readJSON, writeJSON } from "@/lib/partnerAuth";
import { defaultPartnerProfile, type PartnerProfile } from "@/lib/partnerData";

export type PartnerApprovalState = {
  applicationStatus?: "NOT_SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "NEEDS_INFO";
  kycStatus?: "PENDING" | "VERIFIED" | "FAILED" | "NEEDS_REVIEW";
  companionStatus?: "UNDER_REVIEW" | "ACTIVE" | "SUSPENDED";
  verificationStatus?: "PENDING" | "VERIFIED" | "FAILED" | "NEEDS_REVIEW";
  reviewStatus?: string;
  approved?: boolean;
  underReview?: boolean;
  notSubmitted?: boolean;
  hasApplication?: boolean;
};

export type PartnerLandingRoute =
  | "/partner/dashboard"
  | "/partner/application-status"
  | "/partner/onboarding";

const PARTNER_APPROVAL_STATE_KEY = "yopartner_partner_approval_state";
const LOCKED_UNDER_REVIEW_STATE: PartnerApprovalState = {
  applicationStatus: "UNDER_REVIEW",
  kycStatus: "PENDING",
  companionStatus: "UNDER_REVIEW",
  verificationStatus: "PENDING",
  reviewStatus: "under_review",
};

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
    ...(typeof next.approved === "boolean" ? { approved: next.approved } : {}),
    ...(typeof next.underReview === "boolean" ? { underReview: next.underReview } : {}),
    ...(typeof next.notSubmitted === "boolean" ? { notSubmitted: next.notSubmitted } : {}),
    ...(typeof next.hasApplication === "boolean" ? { hasApplication: next.hasApplication } : {}),
  };
}

export function normalizePartnerApprovalState(apiData: unknown): PartnerApprovalState {
  const data = (apiData ?? {}) as Record<string, unknown>;
  const approvalState = (data.approvalState ?? {}) as Record<string, unknown>;
  const profile = (data.profile ?? {}) as Record<string, unknown>;
  const companion = (profile.companion ?? data.companion ?? {}) as Record<string, unknown>;
  const application = (data.application ?? profile.application ?? {}) as Record<string, unknown>;
  const payload = (application.payload ?? {}) as Record<string, unknown>;

  return {
    applicationStatus: normalizeApplicationStatus(
      approvalState.applicationStatus ??
        data.applicationStatus ??
        data.status ??
        application.status ??
        profile.reviewStatus ??
        payload.reviewStatus,
    ),
    kycStatus: normalizeKycStatus(approvalState.kycStatus ?? data.kycStatus ?? profile.kycStatus ?? payload.kycStatus),
    companionStatus: normalizeCompanionStatus(
      approvalState.companionStatus ?? data.companionStatus ?? profile.status ?? companion.status,
    ),
    verificationStatus: normalizeVerificationStatus(
      approvalState.verificationStatus ??
        data.verificationStatus ??
        profile.verificationStatus ??
        companion.verificationStatus ??
        payload.verificationStatus,
    ),
    reviewStatus: String(profile.reviewStatus ?? payload.reviewStatus ?? data.reviewStatus ?? "").toLowerCase() || undefined,
    approved:
      typeof approvalState.approved === "boolean"
        ? approvalState.approved
        : typeof data.approved === "boolean"
          ? data.approved
          : undefined,
    underReview:
      typeof approvalState.underReview === "boolean"
        ? approvalState.underReview
        : typeof data.underReview === "boolean"
          ? data.underReview
          : undefined,
    notSubmitted:
      typeof approvalState.notSubmitted === "boolean"
        ? approvalState.notSubmitted
        : typeof data.notSubmitted === "boolean"
          ? data.notSubmitted
          : undefined,
    hasApplication:
      typeof approvalState.hasApplication === "boolean"
        ? approvalState.hasApplication
        : typeof data.hasApplication === "boolean"
          ? data.hasApplication
          : undefined,
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
  if (typeof state.approved === "boolean") return state.approved;
  if (state.applicationStatus === "APPROVED") return true;
  if (state.companionStatus === "ACTIVE" && state.verificationStatus === "VERIFIED") return true;
  return false;
}

export function isPartnerUnderReview(state: PartnerApprovalState) {
  if (typeof state.underReview === "boolean") return state.underReview;
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
    if (isPartnerApproved(nextState)) {
      saveLocalPartnerApprovalState(nextState);
      return nextState;
    }
    if (nextState.applicationStatus === "NOT_SUBMITTED") {
      const noApplicationState: PartnerApprovalState = {
        applicationStatus: "NOT_SUBMITTED",
        reviewStatus: "under_review",
      };
      saveLocalPartnerApprovalState(noApplicationState);
      return noApplicationState;
    }
    if (IS_PRODUCTION_READY_MODE) {
      const safeUnderReviewState = mergeState(LOCKED_UNDER_REVIEW_STATE, {
        applicationStatus: nextState.applicationStatus ?? "UNDER_REVIEW",
        kycStatus: nextState.kycStatus ?? "PENDING",
        companionStatus: nextState.companionStatus ?? "UNDER_REVIEW",
        verificationStatus: nextState.verificationStatus ?? "PENDING",
        reviewStatus: nextState.reviewStatus ?? "under_review",
      });
      saveLocalPartnerApprovalState(safeUnderReviewState);
      return safeUnderReviewState;
    }
    return nextState;
  }

  if (nextState.applicationStatus === "NOT_SUBMITTED") {
    nextState = {
      applicationStatus: "NOT_SUBMITTED",
      reviewStatus: "under_review",
    };
  } else if (!isPartnerApproved(nextState)) {
    nextState = mergeState(LOCKED_UNDER_REVIEW_STATE, {
      applicationStatus: nextState.applicationStatus ?? "UNDER_REVIEW",
      kycStatus: nextState.kycStatus ?? "PENDING",
      companionStatus: nextState.companionStatus ?? "UNDER_REVIEW",
      verificationStatus: nextState.verificationStatus ?? "PENDING",
      reviewStatus: nextState.reviewStatus ?? "under_review",
    });
  }

  saveLocalPartnerApprovalState(nextState);
  return nextState;
}

export async function resolvePartnerLandingRoute(): Promise<{
  route: PartnerLandingRoute;
  state: PartnerApprovalState;
}> {
  const localState = getLocalPartnerApprovalState();

  try {
    const state = await fetchPartnerApprovalState();
    if (isPartnerApproved(state)) {
      return { route: "/partner/dashboard", state };
    }
    if (state.applicationStatus === "NOT_SUBMITTED") {
      return { route: "/partner/onboarding", state };
    }
    return { route: "/partner/application-status", state };
  } catch {
    if (isPartnerApproved(localState)) {
      return { route: "/partner/dashboard", state: localState };
    }
    return { route: "/partner/application-status", state: localState };
  }
}
