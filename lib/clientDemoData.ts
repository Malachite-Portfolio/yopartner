import { ADMIN_LOGIN_KEY, adminStorageKeys, type AdminApplication, type AdminBooking, type AdminCompanion, type AdminSession, type AdminSettings, type AdminTicket, type AdminTransaction, type AdminUser } from "@/lib/adminData";
import {
  PARTNER_BOOKINGS_KEY,
  PARTNER_EARNINGS_KEY,
  PARTNER_LOGGED_IN_KEY,
  PARTNER_MESSAGES_KEY,
  PARTNER_ONBOARDING_COMPLETE_KEY,
  PARTNER_APPLICATION_STATUS_KEY,
  PARTNER_KYC_STATUS_KEY,
  PARTNER_ONLINE_KEY,
  PARTNER_PHONE_KEY,
  PARTNER_PROFILE_DRAFT_KEY,
  PARTNER_PROFILE_KEY,
  PARTNER_SESSIONS_KEY,
  PARTNER_SETTINGS_KEY,
  setPartnerOnlineStatus,
  writeJSON,
} from "@/lib/partnerAuth";
import type { ConnectCompanion, HomeVisitCompanion } from "@/lib/data";
import type { PartnerEarningItem, PartnerProfile, PartnerBookingItem, PartnerSettings } from "@/lib/partnerData";
import type { WalletTransaction } from "@/lib/wallet";

export const CLIENT_DEMO_PHONE = "4455667788";
export const CLIENT_DEMO_PHONE_E164 = "+914455667788";
export const CLIENT_DEMO_OTP = "123456";
export const CLIENT_DEMO_ADMIN_PIN = "9090";

export const PARTNER_DEMO_SESSION_KEY = "yopartner_partner_demo_session";
export const PARTNER_DEMO_PENDING_PHONE_KEY = "yopartner_partner_demo_pending_phone";
export const PARTNER_DEMO_TOKEN_KEY = "yopartner_partner_demo_token";
export const ADMIN_DEMO_SESSION_KEY = "yopartner_admin_demo_session";
const PARTNER_APPROVAL_STATE_KEY = "yopartner_partner_approval_state";

export function isClientDemoEnabled() {
  return process.env.NEXT_PUBLIC_CLIENT_DEMO_ENABLED === "true";
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function writeStorage<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function normalizeClientDemoPhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith("091")) return `+91${digits.slice(3)}`;
  return input.trim();
}

export function isClientDemoPartnerPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.endsWith(CLIENT_DEMO_PHONE);
}

export function setClientDemoPartnerPendingPhone(phone: string) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(PARTNER_DEMO_PENDING_PHONE_KEY, normalizeClientDemoPhone(phone));
}

export function getClientDemoPartnerPendingPhone() {
  if (!canUseStorage()) return "";
  return window.localStorage.getItem(PARTNER_DEMO_PENDING_PHONE_KEY) ?? "";
}

export function clearClientDemoPartnerPendingPhone() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(PARTNER_DEMO_PENDING_PHONE_KEY);
}

export function isClientDemoPartnerSessionActive() {
  if (!isClientDemoEnabled()) return false;
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(PARTNER_DEMO_SESSION_KEY) === "true";
}

export function isClientDemoPartnerSession(phone?: string) {
  if (!isClientDemoEnabled()) return false;
  if (phone && isClientDemoPartnerPhone(phone)) return true;
  if (!canUseStorage()) return false;

  const storedPhone = window.localStorage.getItem(PARTNER_PHONE_KEY) ?? "";
  return (
    window.localStorage.getItem(PARTNER_DEMO_SESSION_KEY) === "true" ||
    window.localStorage.getItem(PARTNER_DEMO_TOKEN_KEY) === "true" ||
    isClientDemoPartnerPhone(storedPhone)
  );
}

export function isClientDemoAdminSessionActive() {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(ADMIN_DEMO_SESSION_KEY) === "true";
}

const sharedVerification = [
  { label: "ID Verification", status: "Verified" },
  { label: "Police Verification", status: "Verified" },
  { label: "Psychometric Test", status: "Cleared" },
  { label: "Behavioural Interview", status: "Cleared" },
  { label: "Training By YoPartner Team", status: "Trained" },
];

export const demoHosts: ConnectCompanion[] = [
  {
    id: "client-demo-host",
    name: "Client Demo Host",
    tagline: "Calm, friendly conversations for client preview",
    category: "Communication & Emotional Support",
    age: 27,
    gender: "Female",
    religion: "Hindu",
    bornCity: "Kolkata",
    nationality: "Indian",
    college: "University of Calcutta",
    qualification: "MA Psychology",
    languages: ["Hindi", "English"],
    communicationStyle: "Easy to Communicate, open minded, collaborative",
    hobbies: ["Reading", "Music", "Walking"],
    rating: 5,
    reviewsCount: 18,
    experience: "Approved host",
    online: true,
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=520&q=80",
    ],
    chatPrice: 10,
    voicePrice: 20,
    videoPrice: 40,
    visitPrice: 499,
    serviceAreas: ["India"],
    servicesOffered: ["Active listening", "Empathetic conversation", "Motivational talk", "Home Visit"],
    about:
      "A calm and respectful companion focused on emotionally safe, strictly platonic conversations for preview sessions.",
    sessions: 28,
    verification: sharedVerification,
    reviews: [
      {
        phone: "******7281",
        date: "12 May 2026",
        rating: 5,
        message: "Comforting, kind, and very professional.",
        recommended: true,
      },
    ],
  },
  {
    id: "anshika-b",
    name: "Anshika B",
    tagline: "Warm support for daily rhythm and clarity",
    category: "Lifestyle & Daily Support",
    age: 26,
    gender: "Female",
    religion: "Hindu",
    bornCity: "Mumbai",
    nationality: "Indian",
    college: "Mumbai University",
    qualification: "BA",
    languages: ["Hindi", "English", "Marathi"],
    communicationStyle: "Friendly, empathetic, practical",
    hobbies: ["Yoga", "Travel", "Journaling"],
    rating: 4.9,
    reviewsCount: 12,
    experience: "Verified companion",
    online: true,
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=520&q=80",
    ],
    chatPrice: 12,
    voicePrice: 25,
    videoPrice: 45,
    visitPrice: 499,
    serviceAreas: ["India"],
    servicesOffered: ["Active listening", "Lifestyle planning", "Empathetic conversation", "Home Visit"],
    about:
      "Anshika supports clients with calm communication and practical daily support through safe one-on-one sessions.",
    sessions: 22,
    verification: sharedVerification,
    reviews: [
      {
        phone: "******8412",
        date: "08 May 2026",
        rating: 4.9,
        message: "Very attentive and grounded conversation.",
        recommended: true,
      },
    ],
  },
  {
    id: "ira-t",
    name: "Ira T",
    tagline: "Grounding chats with thoughtful listening",
    category: "Calm Conversations",
    age: 25,
    gender: "Female",
    religion: "Hindu",
    bornCity: "Delhi",
    nationality: "Indian",
    college: "Delhi University",
    qualification: "MSc Psychology",
    languages: ["Hindi", "English"],
    communicationStyle: "Calm Listener, collaborative",
    hobbies: ["Poetry", "Reading"],
    rating: 5,
    reviewsCount: 14,
    experience: "Verified companion",
    online: true,
    image:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=320&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=520&q=80",
    ],
    chatPrice: 10,
    voicePrice: 20,
    visitPrice: 0,
    serviceAreas: ["India"],
    servicesOffered: ["Active listening", "Empathetic conversation"],
    about:
      "Ira offers steady, strictly platonic companionship with clear boundaries and emotionally safe support.",
    sessions: 24,
    verification: sharedVerification,
    reviews: [
      {
        phone: "******1290",
        date: "10 May 2026",
        rating: 5,
        message: "Calming and deeply respectful communication.",
        recommended: true,
      },
    ],
  },
  {
    id: "avni-p",
    name: "Avni P",
    tagline: "Motivating check-ins with healthy momentum",
    category: "Fitness & Motivation",
    age: 29,
    gender: "Female",
    religion: "Hindu",
    bornCity: "Bengaluru",
    nationality: "Indian",
    college: "Christ University",
    qualification: "BBA",
    languages: ["Hindi", "English", "Kannada"],
    communicationStyle: "Motivational, professional",
    hobbies: ["Fitness", "Dance"],
    rating: 4.8,
    reviewsCount: 9,
    experience: "Verified companion",
    online: false,
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=520&q=80",
    ],
    chatPrice: 15,
    voicePrice: 30,
    videoPrice: 50,
    visitPrice: 0,
    serviceAreas: ["India"],
    servicesOffered: ["Motivational talk", "Routine support", "Goal check-ins"],
    about:
      "Avni focuses on positive habit-building and confidence support through consistent, strictly platonic sessions.",
    sessions: 19,
    verification: sharedVerification,
    reviews: [
      {
        phone: "******6724",
        date: "07 May 2026",
        rating: 4.8,
        message: "Helpful motivation without pressure.",
        recommended: true,
      },
    ],
  },
  {
    id: "riya-s",
    name: "Riya S",
    tagline: "Creative, expressive, and thoughtful support",
    category: "Arts, Music & Creative Expression",
    age: 24,
    gender: "Female",
    religion: "Hindu",
    bornCity: "Pune",
    nationality: "Indian",
    college: "Savitribai Phule Pune University",
    qualification: "BA Literature",
    languages: ["Hindi", "English", "Marathi"],
    communicationStyle: "Empathetic, creative",
    hobbies: ["Music", "Art", "Writing"],
    rating: 4.9,
    reviewsCount: 11,
    experience: "Verified companion",
    online: true,
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=320&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=520&q=80",
    ],
    chatPrice: 10,
    voicePrice: 22,
    visitPrice: 0,
    serviceAreas: ["India"],
    servicesOffered: ["Creative discussion", "Empathetic conversation", "Active listening"],
    about:
      "Riya supports expressive and reflective conversations in a safe, strictly platonic format.",
    sessions: 21,
    verification: sharedVerification,
    reviews: [
      {
        phone: "******5128",
        date: "09 May 2026",
        rating: 4.9,
        message: "Great creative and emotional clarity session.",
        recommended: true,
      },
    ],
  },
];

export const demoWallet: { balance: number; transactions: WalletTransaction[] } = {
  balance: 500,
  transactions: [
    {
      id: "demo-wallet-1",
      type: "recharge",
      amountAdded: 500,
      paidAmount: 500,
      bonus: 0,
      createdAt: "2026-05-15T09:00:00.000Z",
      description: "Demo recharge",
      status: "success",
    },
    {
      id: "demo-wallet-2",
      type: "booking",
      amountAdded: -40,
      paidAmount: 40,
      bonus: 0,
      createdAt: "2026-05-15T09:20:00.000Z",
      description: "Chat with Client Demo Host",
      status: "success",
    },
    {
      id: "demo-wallet-3",
      type: "booking",
      amountAdded: -80,
      paidAmount: 80,
      bonus: 0,
      createdAt: "2026-05-15T09:40:00.000Z",
      description: "Audio call with Anshika B",
      status: "success",
    },
  ],
};

export function getClientDemoHomeVisitCompanions(): HomeVisitCompanion[] {
  return demoHosts
    .filter((host) => host.visitPrice > 0)
    .map((host) => ({
      id: host.id,
      name: host.name,
      tagline: host.tagline,
      image: host.image ?? "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
      rating: host.rating,
      experience: host.experience || "Verified companion",
      verified: true,
      price: host.visitPrice,
      category: host.category,
      services: host.servicesOffered,
      city: host.bornCity,
      connectProfileId: host.id,
    }));
}

export const demoAdminStats = {
  totalUsers: 128,
  activeCompanions: 5,
  pendingApplications: 3,
  bookingsToday: 14,
  walletVolume: 18450,
};

export const clientDemoPartnerProfile: PartnerProfile = {
  fullName: "Client Demo Host",
  age: "27",
  gender: "Female",
  religion: "Hindu",
  bornCity: "Kolkata",
  nationality: "Indian",
  school: "Loreto Day School",
  college: "University of Calcutta",
  qualification: "MA Psychology",
  languagesKnown: ["Hindi", "English"],
  communicationStyle: ["Easy to Communicate", "Open minded", "Collaborative"],
  hobbies: ["Reading", "Music"],
  profileTagline: "Calm, friendly conversations for client preview",
  aboutYourself:
    "I offer calm, respectful and strictly platonic sessions with active listening and supportive communication.",
  servicesOffered: ["Chat", "Audio Call", "Video Call", "Home Visit"],
  chatPricePerMinute: "10",
  audioPricePerMinute: "20",
  videoPricePerMinute: "40",
  homeVisitPricePerSession: "499",
  selfieFileName: "client-demo-selfie.jpg",
  aadhaarFileName: "client-demo-aadhaar.pdf",
  panFileName: "client-demo-pan.pdf",
  categories: ["Communication & Emotional Support"],
  safetyPlatonicOnly: true,
  safetyRespectfulRules: true,
  safetyNoOutsidePayments: true,
  safetyReviewVerification: true,
  reviewStatus: "approved",
};

export const clientDemoPartnerBookings: PartnerBookingItem[] = [
  {
    id: "cdb-1",
    bookingId: "YP-DEM-1001",
    userMaskedPhone: "+91******1101",
    type: "Chat",
    date: "2026-05-14T10:00:00.000Z",
    price: 120,
    status: "Completed",
  },
  {
    id: "cdb-2",
    bookingId: "YP-DEM-1002",
    userMaskedPhone: "+91******1102",
    type: "Chat",
    date: "2026-05-14T11:00:00.000Z",
    price: 130,
    status: "Completed",
  },
  {
    id: "cdb-3",
    bookingId: "YP-DEM-1003",
    userMaskedPhone: "+91******1103",
    type: "Chat",
    date: "2026-05-14T12:00:00.000Z",
    price: 140,
    status: "Completed",
  },
  {
    id: "cdb-4",
    bookingId: "YP-DEM-1004",
    userMaskedPhone: "+91******1104",
    type: "Audio",
    date: "2026-05-14T13:00:00.000Z",
    price: 280,
    status: "Completed",
  },
  {
    id: "cdb-5",
    bookingId: "YP-DEM-1005",
    userMaskedPhone: "+91******1105",
    type: "Audio",
    date: "2026-05-14T14:00:00.000Z",
    price: 300,
    status: "Completed",
  },
  {
    id: "cdb-6",
    bookingId: "YP-DEM-1006",
    userMaskedPhone: "+91******1106",
    type: "Video",
    date: "2026-05-14T15:00:00.000Z",
    price: 520,
    status: "Completed",
  },
];

export const clientDemoPartnerEarnings: PartnerEarningItem[] = [
  {
    id: "cde-1",
    date: "2026-05-14",
    session: "Chat Session",
    userMaskedPhone: "+91******1101",
    amount: 2000,
    platformFee: 500,
    netEarning: 1500,
    status: "Credited",
  },
  {
    id: "cde-2",
    date: "2026-05-13",
    session: "Audio Call",
    userMaskedPhone: "+91******1104",
    amount: 1200,
    platformFee: 300,
    netEarning: 900,
    status: "Credited",
  },
  {
    id: "cde-3",
    date: "2026-05-12",
    session: "Video Call",
    userMaskedPhone: "+91******1106",
    amount: 3266,
    platformFee: 816,
    netEarning: 2450,
    status: "Pending",
  },
];

export const clientDemoPartnerSessions = [
  { id: "cds-1", userMaskedPhone: "+91******1101", type: "Chat", duration: "12 min", status: "Completed" },
  { id: "cds-2", userMaskedPhone: "+91******1104", type: "Audio", duration: "18 min", status: "Completed" },
  { id: "cds-3", userMaskedPhone: "+91******1106", type: "Video", duration: "22 min", status: "Completed" },
];

export const clientDemoPartnerSettings: PartnerSettings = {
  onlineAvailability: true,
  notifyChatRequests: true,
  notifyCallRequests: true,
  notifyBookingUpdates: true,
  notifyPayoutUpdates: true,
  hidePhoneNumber: true,
  showOnlyFirstName: true,
  acknowledgePlatonicPolicy: true,
};

const adminCompanions: AdminCompanion[] = demoHosts.map((host, index) => ({
  id: `demo-comp-${index + 1}`,
  name: host.name,
  phone: index === 0 ? CLIENT_DEMO_PHONE_E164 : `+919955550${index + 1}${index + 2}`,
  city: host.bornCity,
  category: host.category,
  languages: host.languages,
  services: [
    ...(host.videoPrice ? (["Chat", "Audio Call", "Video Call"] as string[]) : (["Chat", "Audio Call"] as string[])),
    ...(host.visitPrice > 0 ? (["Home Visit"] as string[]) : []),
  ],
  chatPrice: host.chatPrice,
  audioPrice: host.voicePrice,
  videoPrice: host.videoPrice ?? 0,
  visitPrice: host.visitPrice,
  rating: host.rating,
  sessions: host.sessions,
  earnings: 50000 + index * 5000,
  verificationStatus: "Verified",
  availability: host.online ? "Online" : "Offline",
  status: "Active",
  image: host.image,
  tagline: host.tagline,
}));

const adminUsers: AdminUser[] = Array.from({ length: 8 }).map((_, index) => ({
  id: `demo-user-${index + 1}`,
  name: `Demo User ${index + 1}`,
  phone: `+9193000000${index + 1}`,
  walletBalance: 500 + index * 100,
  totalBookings: 2 + index,
  totalSpent: 400 + index * 80,
  status: "Active",
  joinedDate: "2026-05-15T08:00:00.000Z",
  lastLogin: "2026-05-15T09:00:00.000Z",
}));

const adminApplications: AdminApplication[] = demoHosts.map((host, index) => ({
  id: `demo-app-${index + 1}`,
  applicationId: `APP-DEMO-${100 + index}`,
  partnerName: host.name,
  phone: index === 0 ? CLIENT_DEMO_PHONE_E164 : `+919955550${index + 1}${index + 2}`,
  age: String(host.age),
  gender: host.gender,
  religion: host.religion,
  bornCity: host.bornCity,
  nationality: host.nationality,
  school: "Demo School",
  college: host.college,
  qualification: host.qualification,
  languagesKnown: host.languages,
  communicationStyle: host.communicationStyle.split(",").map((item) => item.trim()),
  hobbies: host.hobbies,
  profileTagline: host.tagline,
  aboutYourself: host.about,
  servicesOffered: [
    ...(host.videoPrice ? (["Chat", "Audio Call", "Video Call"] as string[]) : (["Chat", "Audio Call"] as string[])),
    ...(host.visitPrice > 0 ? (["Home Visit"] as string[]) : []),
  ],
  chatPricePerMinute: String(host.chatPrice),
  audioPricePerMinute: String(host.voicePrice),
  videoPricePerMinute: String(host.videoPrice ?? 0),
  visitPricePerSession: String(host.visitPrice || 0),
  categories: [host.category],
  safetyChecklist: {
    platonicOnly: true,
    respectfulRules: true,
    noOutsidePayments: true,
    reviewVerification: true,
  },
  submittedDate: "2026-05-15T08:00:00.000Z",
  status: index < 3 ? "Under Review" : "Approved",
}));

const adminBookings: AdminBooking[] = Array.from({ length: 14 }).map((_, index) => {
  const host = demoHosts[index % demoHosts.length];
  const serviceType = index % 3 === 0 ? "chat" : index % 3 === 1 ? "audio" : "video";
  return {
    id: `demo-booking-${index + 1}`,
    bookingId: `YP-DEMO-${2000 + index}`,
    user: `+9193000000${(index % 8) + 1}`,
    companion: host.name,
    serviceType,
    amount: serviceType === "chat" ? 120 : serviceType === "audio" ? 280 : 480,
    status: "Completed",
    createdAt: "2026-05-15T09:00:00.000Z",
    scheduledAt: "2026-05-15T09:30:00.000Z",
  };
});

const adminSessions: AdminSession[] = Array.from({ length: 6 }).map((_, index) => {
  const host = demoHosts[index % demoHosts.length];
  const type = index % 3 === 0 ? "Chat" : index % 3 === 1 ? "Audio" : "Video";
  return {
    id: `demo-session-${index + 1}`,
    sessionId: `SES-DEMO-${900 + index}`,
    user: `+9193000000${(index % 8) + 1}`,
    companion: host.name,
    type,
    startedAt: "2026-05-15T09:10:00.000Z",
    endedAt: "2026-05-15T09:28:00.000Z",
    duration: "00:18:00",
    amount: type === "Chat" ? 120 : type === "Audio" ? 280 : 480,
    status: index < 2 ? "Live" : "Completed",
    safetyFlag: false,
    platformFee: 24,
    companionEarning: type === "Chat" ? 96 : type === "Audio" ? 224 : 384,
    safetyNotes: "No issues reported.",
  };
});

const adminTransactions: AdminTransaction[] = [
  {
    id: "demo-txn-1",
    transactionId: "TRX-DEMO-1",
    user: "+91930000001",
    type: "Recharge",
    amount: 5000,
    status: "Success",
    gateway: "Demo",
    date: "2026-05-15T08:30:00.000Z",
  },
  {
    id: "demo-txn-2",
    transactionId: "TRX-DEMO-2",
    user: "+91930000002",
    type: "Recharge",
    amount: 4450,
    status: "Success",
    gateway: "Demo",
    date: "2026-05-15T08:35:00.000Z",
  },
  {
    id: "demo-txn-3",
    transactionId: "TRX-DEMO-3",
    user: "+91930000003",
    type: "Recharge",
    amount: 9000,
    status: "Success",
    gateway: "Demo",
    date: "2026-05-15T08:40:00.000Z",
  },
];

const adminTickets: AdminTicket[] = [
  {
    id: "demo-ticket-1",
    ticketId: "SUP-DEMO-1",
    actor: "User",
    userOrPartner: "+91930000001",
    type: "Payment",
    subject: "Recharge confirmation delay",
    priority: "Medium",
    status: "Open",
    date: "2026-05-15T09:00:00.000Z",
    assignedTo: "Support Lead",
    notes: ["Awaiting confirmation callback."],
    timeline: ["Ticket created"],
  },
  {
    id: "demo-ticket-2",
    ticketId: "SUP-DEMO-2",
    actor: "Partner",
    userOrPartner: CLIENT_DEMO_PHONE_E164,
    type: "Technical",
    subject: "Audio quality check request",
    priority: "Low",
    status: "In Progress",
    date: "2026-05-15T09:15:00.000Z",
    assignedTo: "Ops Team",
    notes: ["Shared troubleshooting steps."],
    timeline: ["Ticket created", "Assigned to Ops Team"],
  },
];

const adminSettings: AdminSettings = {
  platformName: "YoPartner",
  companyName: "Malachite Technologies PVT Ltd",
  supportEmail: "support@yopartner.in",
  supportPhone: "+91 90000 90000",
  defaultChatPrice: "10",
  defaultAudioPrice: "20",
  defaultVideoPrice: "40",
  defaultVisitPrice: "0",
  gst: "18",
  minimumRecharge: "100",
  maximumRecharge: "50000",
  minimumBalanceRule: "5x service price",
  paymentGatewayRazorpayDemo: true,
  paymentGatewayCashfreeDemo: false,
  minimumAge: "21",
  requireIdVerification: true,
  requirePoliceVerification: true,
  requireTraining: true,
  autoApproveCompanions: false,
  platonicOnlyPolicy: true,
  blockOffPlatformPaymentSharing: true,
  enableReportReviewQueue: true,
  sessionMonitoringDemo: true,
};

export function activateClientDemoPartnerSession() {
  if (!canUseStorage()) return;
  window.localStorage.setItem(PARTNER_LOGGED_IN_KEY, "true");
  window.localStorage.setItem(PARTNER_ONBOARDING_COMPLETE_KEY, "true");
  window.localStorage.setItem(PARTNER_APPLICATION_STATUS_KEY, "APPROVED");
  window.localStorage.setItem(PARTNER_KYC_STATUS_KEY, "VERIFIED");
  window.localStorage.setItem(
    PARTNER_APPROVAL_STATE_KEY,
    JSON.stringify({
      applicationStatus: "APPROVED",
      kycStatus: "VERIFIED",
      companionStatus: "ACTIVE",
      verificationStatus: "VERIFIED",
      reviewStatus: "approved",
    }),
  );
  window.localStorage.setItem(PARTNER_PHONE_KEY, CLIENT_DEMO_PHONE_E164);
  window.localStorage.setItem(PARTNER_DEMO_SESSION_KEY, "true");
  window.localStorage.setItem(PARTNER_DEMO_TOKEN_KEY, "true");
  if (window.localStorage.getItem(PARTNER_ONLINE_KEY) == null) {
    setPartnerOnlineStatus(true);
  }
  clearClientDemoPartnerPendingPhone();

  writeJSON(PARTNER_PROFILE_KEY, clientDemoPartnerProfile);
  writeJSON(PARTNER_PROFILE_DRAFT_KEY, clientDemoPartnerProfile);
  writeJSON(PARTNER_BOOKINGS_KEY, clientDemoPartnerBookings);
  writeJSON(PARTNER_EARNINGS_KEY, clientDemoPartnerEarnings);
  writeJSON(PARTNER_SESSIONS_KEY, clientDemoPartnerSessions);
  writeJSON(PARTNER_MESSAGES_KEY, {});
  writeJSON(PARTNER_SETTINGS_KEY, clientDemoPartnerSettings);
}

export function clearClientDemoPartnerSession() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(PARTNER_DEMO_SESSION_KEY);
  window.localStorage.removeItem(PARTNER_DEMO_TOKEN_KEY);
  clearClientDemoPartnerPendingPhone();
}

export function completeClientDemoPartnerOnboarding(profileData: PartnerProfile) {
  if (!isClientDemoEnabled() || !canUseStorage()) return;
  const approvedProfile: PartnerProfile = {
    ...profileData,
    reviewStatus: "approved",
  };
  window.localStorage.setItem(PARTNER_ONBOARDING_COMPLETE_KEY, "true");
  window.localStorage.setItem(PARTNER_APPLICATION_STATUS_KEY, "APPROVED");
  window.localStorage.setItem(PARTNER_KYC_STATUS_KEY, "VERIFIED");
  window.localStorage.setItem(
    PARTNER_APPROVAL_STATE_KEY,
    JSON.stringify({
      applicationStatus: "APPROVED",
      kycStatus: "VERIFIED",
      companionStatus: "ACTIVE",
      verificationStatus: "VERIFIED",
      reviewStatus: "approved",
    }),
  );
  writeJSON(PARTNER_PROFILE_KEY, approvedProfile);
  writeJSON(PARTNER_PROFILE_DRAFT_KEY, approvedProfile);
  writeJSON(PARTNER_BOOKINGS_KEY, clientDemoPartnerBookings);
  writeJSON(PARTNER_EARNINGS_KEY, clientDemoPartnerEarnings);
  writeJSON(PARTNER_SESSIONS_KEY, clientDemoPartnerSessions);
  writeJSON(PARTNER_MESSAGES_KEY, {});
  writeJSON(PARTNER_SETTINGS_KEY, clientDemoPartnerSettings);
}

export function activateClientDemoAdminSession() {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ADMIN_LOGIN_KEY, "true");
  window.localStorage.setItem(ADMIN_DEMO_SESSION_KEY, "true");

  writeStorage(adminStorageKeys.companions, adminCompanions);
  writeStorage(adminStorageKeys.users, adminUsers);
  writeStorage(adminStorageKeys.applications, adminApplications);
  writeStorage(adminStorageKeys.bookings, adminBookings);
  writeStorage(adminStorageKeys.sessions, adminSessions);
  writeStorage(adminStorageKeys.walletTransactions, adminTransactions);
  writeStorage(adminStorageKeys.reviews, []);
  writeStorage(adminStorageKeys.supportTickets, adminTickets);
  writeStorage(adminStorageKeys.payouts, []);
  writeStorage(adminStorageKeys.verifications, []);
  writeStorage(adminStorageKeys.media, []);
  writeStorage(adminStorageKeys.clientDiaries, []);
  writeStorage(adminStorageKeys.settings, adminSettings);
}

export function clearClientDemoAdminSession() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(ADMIN_DEMO_SESSION_KEY);
}
