import {
  PARTNER_BOOKINGS_KEY,
  PARTNER_EARNINGS_KEY,
  PARTNER_MESSAGES_KEY,
  PARTNER_SESSIONS_KEY,
  PARTNER_SETTINGS_KEY,
  readJSON,
  writeJSON,
} from "@/lib/partnerAuth";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";

export const partnerLanguageOptions = [
  "Hindi",
  "English",
  "Bengali",
  "Tamil",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Punjabi",
  "Kannada",
  "Malayalam",
  "Urdu",
];

export const partnerCommunicationStyleOptions = [
  "Easy to Communicate",
  "Open minded",
  "Collaborative",
  "Calm Listener",
  "Funny",
  "Motivational",
  "Empathetic",
  "Non-judgmental",
  "Professional",
];

export const partnerHobbyOptions = [
  "Dance",
  "Reading",
  "Running",
  "Music",
  "Poetry",
  "Art",
  "Fitness",
  "Cooking",
  "Travel",
  "Movies",
  "Pets",
  "Sports",
  "Writing",
];

export const partnerCategoryOptions = [
  "Communication & Emotional Support",
  "Arts, Music & Creative Expression",
  "Lifestyle & Daily Support",
  "Social & Outdoor",
];

export type PartnerServiceType = "Chat" | "Audio Call" | "Video Call" | "Home Visit";

export type PartnerProfile = {
  fullName: string;
  age: string;
  gender: "Female" | "Male" | "Other" | "Prefer not to say" | "";
  religion: string;
  bornCity: string;
  nationality: string;
  school: string;
  college: string;
  qualification: string;
  languagesKnown: string[];
  communicationStyle: string[];
  hobbies: string[];
  profileTagline: string;
  aboutYourself: string;
  servicesOffered: PartnerServiceType[];
  chatPricePerMinute: string;
  audioPricePerMinute: string;
  videoPricePerMinute: string;
  homeVisitPricePerSession: string;
  selfieFileName: string;
  aadhaarFrontFileName: string;
  aadhaarBackFileName: string;
  aadhaarFileName: string;
  panFileName: string;
  categories: string[];
  safetyPlatonicOnly: boolean;
  safetyRespectfulRules: boolean;
  safetyNoOutsidePayments: boolean;
  safetyReviewVerification: boolean;
  reviewStatus: "under_review" | "approved";
};

export const defaultPartnerProfile: PartnerProfile = {
  fullName: "",
  age: "",
  gender: "",
  religion: "",
  bornCity: "",
  nationality: "",
  school: "",
  college: "",
  qualification: "",
  languagesKnown: [],
  communicationStyle: [],
  hobbies: [],
  profileTagline: "",
  aboutYourself: "",
  servicesOffered: [],
  chatPricePerMinute: "",
  audioPricePerMinute: "",
  videoPricePerMinute: "",
  homeVisitPricePerSession: "",
  selfieFileName: "",
  aadhaarFrontFileName: "",
  aadhaarBackFileName: "",
  aadhaarFileName: "",
  panFileName: "",
  categories: [],
  safetyPlatonicOnly: false,
  safetyRespectfulRules: false,
  safetyNoOutsidePayments: false,
  safetyReviewVerification: false,
  reviewStatus: "under_review",
};

export type PartnerInboxItem = {
  id: string;
  userMaskedPhone: string;
  sessionType: "Chat" | "Audio" | "Video";
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
};

export type PartnerMessage = {
  id: string;
  sender: "user" | "partner";
  text: string;
  time: string;
};

export type PartnerBookingItem = {
  id: string;
  bookingId: string;
  userMaskedPhone: string;
  type: "Chat" | "Audio" | "Video" | "Visit";
  date: string;
  price: number;
  status: "Upcoming" | "Completed" | "Cancelled";
};

export type PartnerEarningItem = {
  id: string;
  date: string;
  session: string;
  userMaskedPhone: string;
  amount: number;
  platformFee: number;
  netEarning: number;
  status: "Credited" | "Pending";
};

export type PartnerSettings = {
  onlineAvailability: boolean;
  notifyChatRequests: boolean;
  notifyCallRequests: boolean;
  notifyBookingUpdates: boolean;
  notifyPayoutUpdates: boolean;
  hidePhoneNumber: boolean;
  showOnlyFirstName: boolean;
  acknowledgePlatonicPolicy: boolean;
};

export const defaultPartnerSettings: PartnerSettings = {
  onlineAvailability: false,
  notifyChatRequests: true,
  notifyCallRequests: true,
  notifyBookingUpdates: true,
  notifyPayoutUpdates: true,
  hidePhoneNumber: true,
  showOnlyFirstName: false,
  acknowledgePlatonicPolicy: true,
};

export const demoPartnerInbox: PartnerInboxItem[] = [
  {
    id: "demo-user-1",
    userMaskedPhone: "+91******9363",
    sessionType: "Chat",
    lastMessage: "Thank you for listening, it helped a lot.",
    lastMessageTime: "11:42 AM",
    unreadCount: 2,
  },
  {
    id: "demo-user-2",
    userMaskedPhone: "+91******7788",
    sessionType: "Audio",
    lastMessage: "Can we do a 20-min audio session today?",
    lastMessageTime: "10:08 AM",
    unreadCount: 1,
  },
  {
    id: "demo-user-3",
    userMaskedPhone: "+91******2231",
    sessionType: "Video",
    lastMessage: "Please confirm the evening slot.",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
  },
];

export const demoPartnerMessages: Record<string, PartnerMessage[]> = {
  "demo-user-1": [
    {
      id: "m-1",
      sender: "user",
      text: "Hi, I feel a bit overwhelmed today.",
      time: "11:30 AM",
    },
    {
      id: "m-2",
      sender: "partner",
      text: "Thanks for sharing. I'm here with you, take your time.",
      time: "11:32 AM",
    },
  ],
  "demo-user-2": [
    {
      id: "m-3",
      sender: "user",
      text: "Can we plan a short audio check-in?",
      time: "10:05 AM",
    },
  ],
  "demo-user-3": [
    {
      id: "m-4",
      sender: "partner",
      text: "Yes, your video slot is available for tonight.",
      time: "08:14 PM",
    },
  ],
};

export const demoPartnerBookings: PartnerBookingItem[] = [
  {
    id: "pb-1",
    bookingId: "YP-P-1001",
    userMaskedPhone: "+91******9363",
    type: "Chat",
    date: "2026-05-12T09:30:00.000Z",
    price: 250,
    status: "Upcoming",
  },
  {
    id: "pb-2",
    bookingId: "YP-P-1002",
    userMaskedPhone: "+91******7788",
    type: "Audio",
    date: "2026-05-11T14:00:00.000Z",
    price: 450,
    status: "Completed",
  },
  {
    id: "pb-3",
    bookingId: "YP-P-1003",
    userMaskedPhone: "+91******2231",
    type: "Visit",
    date: "2026-05-10T16:00:00.000Z",
    price: 2000,
    status: "Cancelled",
  },
];

export const demoPartnerEarnings: PartnerEarningItem[] = [
  {
    id: "pe-1",
    date: "2026-05-12",
    session: "Chat Session",
    userMaskedPhone: "+91******9363",
    amount: 250,
    platformFee: 50,
    netEarning: 200,
    status: "Credited",
  },
  {
    id: "pe-2",
    date: "2026-05-11",
    session: "Audio Call",
    userMaskedPhone: "+91******7788",
    amount: 450,
    platformFee: 90,
    netEarning: 360,
    status: "Credited",
  },
  {
    id: "pe-3",
    date: "2026-05-10",
    session: "Video Call",
    userMaskedPhone: "+91******2231",
    amount: 600,
    platformFee: 120,
    netEarning: 480,
    status: "Pending",
  },
];

function shouldHideDemoPartnerData() {
  return IS_PRODUCTION_READY_MODE && process.env.NEXT_PUBLIC_CLIENT_DEMO_ENABLED !== "true";
}

export function getPartnerInbox() {
  if (shouldHideDemoPartnerData()) return [];
  return demoPartnerInbox;
}

export function getPartnerMessages() {
  if (shouldHideDemoPartnerData()) return {};
  return readJSON<Record<string, PartnerMessage[]>>(PARTNER_MESSAGES_KEY, demoPartnerMessages);
}

export function savePartnerMessages(value: Record<string, PartnerMessage[]>) {
  writeJSON(PARTNER_MESSAGES_KEY, value);
}

export function getPartnerBookings() {
  if (shouldHideDemoPartnerData()) return [];
  return readJSON<PartnerBookingItem[]>(PARTNER_BOOKINGS_KEY, demoPartnerBookings);
}

export function savePartnerBookings(value: PartnerBookingItem[]) {
  writeJSON(PARTNER_BOOKINGS_KEY, value);
}

export function getPartnerEarnings() {
  if (shouldHideDemoPartnerData()) return [];
  return readJSON<PartnerEarningItem[]>(PARTNER_EARNINGS_KEY, demoPartnerEarnings);
}

export function savePartnerEarnings(value: PartnerEarningItem[]) {
  writeJSON(PARTNER_EARNINGS_KEY, value);
}

export function getPartnerSettings() {
  return readJSON<PartnerSettings>(PARTNER_SETTINGS_KEY, defaultPartnerSettings);
}

export function savePartnerSettings(value: PartnerSettings) {
  writeJSON(PARTNER_SETTINGS_KEY, value);
}

export function getPartnerSessions() {
  if (shouldHideDemoPartnerData()) return [];
  return readJSON(PARTNER_SESSIONS_KEY, [
    {
      id: "s-1",
      userMaskedPhone: "+91******9363",
      type: "Chat",
      duration: "12 min",
      status: "Live",
    },
    {
      id: "s-2",
      userMaskedPhone: "+91******7788",
      type: "Audio",
      duration: "08 min",
      status: "Waiting",
    },
  ]);
}
