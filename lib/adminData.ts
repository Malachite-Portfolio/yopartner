export const ADMIN_LOGIN_KEY = "yopartner_admin_logged_in";

export type AdminCompanionStatus = "Active" | "Pending" | "Suspended" | "Under Review";
export type AdminApplicationStatus =
  | "Draft"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Needs Info";
export type AdminBookingStatus = "Confirmed" | "Pending" | "Completed" | "Cancelled";
export type AdminSessionStatus = "Live" | "Completed" | "Failed" | "Flagged";
export type AdminReviewStatus = "Pending" | "Approved" | "Hidden" | "Flagged";
export type AdminTicketStatus = "Open" | "In Progress" | "Resolved";
export type AdminPayoutStatus = "Requested" | "Approved" | "Paid" | "Rejected";
export type AdminVerificationStepStatus =
  | "Pending"
  | "Verified"
  | "Failed"
  | "Cleared"
  | "Trained"
  | "Needs Review";
export type AdminOverallVerificationStatus = "Pending" | "Verified" | "Needs Review" | "Failed";
export type AdminMediaStatus = "Draft" | "Published" | "Hidden";

export type AdminCompanion = {
  id: string;
  name: string;
  phone: string;
  city: string;
  category: string;
  languages: string[];
  services: string[];
  chatPrice: number;
  audioPrice: number;
  videoPrice: number;
  visitPrice: number;
  rating: number;
  sessions: number;
  earnings: number;
  verificationStatus: "Verified" | "Pending" | "Needs Review";
  availability: "Online" | "Offline";
  status: AdminCompanionStatus;
  image?: string;
  tagline?: string;
};

export type AdminUser = {
  id: string;
  name: string;
  phone: string;
  walletBalance: number;
  totalBookings: number;
  totalSpent: number;
  status: "Active" | "Blocked" | "New" | "High Value";
  joinedDate: string;
  lastLogin: string;
};

export type AdminApplication = {
  id: string;
  applicationId: string;
  partnerName: string;
  phone: string;
  age: string;
  gender: string;
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
  servicesOffered: string[];
  chatPricePerMinute: string;
  audioPricePerMinute: string;
  videoPricePerMinute: string;
  visitPricePerSession: string;
  categories: string[];
  safetyChecklist: {
    platonicOnly: boolean;
    respectfulRules: boolean;
    noOutsidePayments: boolean;
    reviewVerification: boolean;
  };
  submittedDate: string;
  status: AdminApplicationStatus;
  adminNote?: string;
  rejectionReason?: string;
};

export type AdminBooking = {
  id: string;
  bookingId: string;
  user: string;
  companion: string;
  serviceType: "chat" | "audio" | "video" | "visit";
  amount: number;
  status: AdminBookingStatus;
  createdAt: string;
  scheduledAt: string;
};

export type AdminSession = {
  id: string;
  sessionId: string;
  user: string;
  companion: string;
  type: "Chat" | "Audio" | "Video" | "Visit";
  startedAt: string;
  endedAt?: string;
  duration: string;
  amount: number;
  status: AdminSessionStatus;
  safetyFlag: boolean;
  platformFee: number;
  companionEarning: number;
  safetyNotes: string;
};

export type AdminTransaction = {
  id: string;
  transactionId: string;
  user: string;
  type: "Recharge" | "Booking" | "Refund" | "Admin Credit";
  amount: number;
  status: "Success" | "Pending" | "Failed";
  gateway: "Wallet" | "Razorpay Later" | "Cashfree Later";
  date: string;
  reason?: string;
};

export type AdminPayout = {
  id: string;
  payoutId: string;
  companion: string;
  phone: string;
  amount: number;
  bankOrUpi: string;
  status: AdminPayoutStatus;
  requestedDate: string;
  processedAt?: string;
  reason?: string;
};

export type AdminReview = {
  id: string;
  user: string;
  companion: string;
  rating: number;
  text: string;
  status: AdminReviewStatus;
  date: string;
};

export type AdminVerification = {
  id: string;
  partner: string;
  phone: string;
  idVerification: AdminVerificationStepStatus;
  policeVerification: AdminVerificationStepStatus;
  psychometricTest: AdminVerificationStepStatus;
  behaviouralInterview: AdminVerificationStepStatus;
  training: AdminVerificationStepStatus;
  overallStatus: AdminOverallVerificationStatus;
};

export type AdminTicket = {
  id: string;
  ticketId: string;
  actor: "User" | "Partner";
  userOrPartner: string;
  type: "Payment" | "Booking" | "Technical" | "Safety";
  subject: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: AdminTicketStatus;
  date: string;
  assignedTo?: string;
  notes: string[];
  timeline: string[];
};

export type AdminMediaItem = {
  id: string;
  title: string;
  publisher: string;
  date: string;
  type: "Article" | "Podcast";
  imageUrl: string;
  label: string;
  href: string;
  status: AdminMediaStatus;
};

export type AdminDiaryItem = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  videoUrl: string;
  status: AdminMediaStatus;
};

export type AdminSettings = {
  platformName: string;
  companyName: string;
  supportEmail: string;
  supportPhone: string;
  defaultChatPrice: string;
  defaultAudioPrice: string;
  defaultVideoPrice: string;
  defaultVisitPrice: string;
  gst: string;
  minimumRecharge: string;
  maximumRecharge: string;
  minimumBalanceRule: string;
  paymentGatewayRazorpayEnabled: boolean;
  paymentGatewayCashfreeEnabled: boolean;
  minimumAge: string;
  requireIdVerification: boolean;
  requirePoliceVerification: boolean;
  requireTraining: boolean;
  autoApproveCompanions: boolean;
  platonicOnlyPolicy: boolean;
  blockOffPlatformPaymentSharing: boolean;
  enableReportReviewQueue: boolean;
  sessionMonitoringEnabled: boolean;
};

export const adminStorageKeys = {
  companions: "yopartner_admin_companions",
  users: "yopartner_admin_users",
  applications: "yopartner_admin_applications",
  bookings: "yopartner_admin_bookings",
  sessions: "yopartner_admin_sessions",
  walletTransactions: "yopartner_admin_wallet_transactions",
  reviews: "yopartner_admin_reviews",
  supportTickets: "yopartner_admin_support_tickets",
  payouts: "yopartner_admin_payouts",
  verifications: "yopartner_admin_verifications",
  media: "yopartner_admin_media",
  clientDiaries: "yopartner_admin_client_diaries",
  settings: "yopartner_admin_settings",
} as const;

export const seedAdminUsers: AdminUser[] = [
  {
    id: "au-1",
    name: "Aman Verma",
    phone: "+919958719363",
    walletBalance: 3250,
    totalBookings: 12,
    totalSpent: 9400,
    status: "High Value",
    joinedDate: "2026-01-12T10:30:00.000Z",
    lastLogin: "2026-05-13T08:20:00.000Z",
  },
  {
    id: "au-2",
    name: "Nisha Sharma",
    phone: "+919999993637",
    walletBalance: 890,
    totalBookings: 4,
    totalSpent: 2100,
    status: "New",
    joinedDate: "2026-04-20T11:00:00.000Z",
    lastLogin: "2026-05-13T07:15:00.000Z",
  },
  {
    id: "au-3",
    name: "Rohit Das",
    phone: "+918888887777",
    walletBalance: 6400,
    totalBookings: 20,
    totalSpent: 18500,
    status: "Blocked",
    joinedDate: "2025-12-19T09:00:00.000Z",
    lastLogin: "2026-05-10T14:30:00.000Z",
  },
];

export const seedAdminCompanions: AdminCompanion[] = [
  {
    id: "ac-1",
    name: "Ira T",
    phone: "+919811112233",
    city: "Bengaluru",
    category: "Communication & Emotional Support",
    languages: ["Hindi", "English", "Bengali"],
    services: ["Chat", "Audio Call", "Video Call", "Home Visit"],
    chatPrice: 10,
    audioPrice: 15,
    videoPrice: 20,
    visitPrice: 2000,
    rating: 5,
    sessions: 290,
    earnings: 125000,
    verificationStatus: "Verified",
    availability: "Online",
    status: "Active",
    image:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=320&q=80",
    tagline: "Towards healing",
  },
  {
    id: "ac-2",
    name: "Anshikha B",
    phone: "+919822223344",
    city: "Pune",
    category: "Communication & Emotional Support",
    languages: ["English", "Hindi", "Marathi"],
    services: ["Chat", "Audio Call", "Video Call"],
    chatPrice: 10,
    audioPrice: 15,
    videoPrice: 20,
    visitPrice: 1700,
    rating: 5,
    sessions: 138,
    earnings: 74000,
    verificationStatus: "Pending",
    availability: "Offline",
    status: "Under Review",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=80",
    tagline: "Your mood uplifter",
  },
];

export const seedAdminApplications: AdminApplication[] = [
  {
    id: "app-1",
    applicationId: "APP-1001",
    partnerName: "Neha Kapoor",
    phone: "+919700001111",
    age: "25",
    gender: "Female",
    religion: "Hindu",
    bornCity: "Mumbai",
    nationality: "Indian",
    school: "St. Xavier High School",
    college: "Mumbai University",
    qualification: "MA Psychology",
    languagesKnown: ["Hindi", "English"],
    communicationStyle: ["Empathetic", "Calm Listener"],
    hobbies: ["Reading", "Music"],
    profileTagline: "Calm and compassionate support conversations",
    aboutYourself:
      "I enjoy listening and helping people process emotions with steady and respectful conversations.",
    servicesOffered: ["Chat", "Audio Call", "Video Call"],
    chatPricePerMinute: "10",
    audioPricePerMinute: "15",
    videoPricePerMinute: "20",
    visitPricePerSession: "1800",
    categories: ["Communication & Emotional Support"],
    safetyChecklist: {
      platonicOnly: true,
      respectfulRules: true,
      noOutsidePayments: true,
      reviewVerification: true,
    },
    submittedDate: "2026-05-11T10:20:00.000Z",
    status: "Under Review",
  },
  {
    id: "app-2",
    applicationId: "APP-1002",
    partnerName: "Farhan Ali",
    phone: "+919700002222",
    age: "28",
    gender: "Male",
    religion: "Muslim",
    bornCity: "Delhi",
    nationality: "Indian",
    school: "Delhi Public School",
    college: "Jamia Millia Islamia",
    qualification: "BCom",
    languagesKnown: ["Hindi", "English", "Urdu"],
    communicationStyle: ["Open minded", "Professional"],
    hobbies: ["Travel", "Writing"],
    profileTagline: "Open conversations for everyday support",
    aboutYourself:
      "I support users with practical, respectful and non-judgmental companionship conversations.",
    servicesOffered: ["Chat", "Audio Call"],
    chatPricePerMinute: "8",
    audioPricePerMinute: "14",
    videoPricePerMinute: "0",
    visitPricePerSession: "0",
    categories: ["Lifestyle & Daily Support"],
    safetyChecklist: {
      platonicOnly: true,
      respectfulRules: true,
      noOutsidePayments: true,
      reviewVerification: true,
    },
    submittedDate: "2026-05-10T15:00:00.000Z",
    status: "Needs Info",
    adminNote: "Please update qualification certificate details.",
  },
];

export const seedAdminBookings: AdminBooking[] = [
  {
    id: "ab-1",
    bookingId: "YP-602812-Z1T4A",
    user: "+919958719363",
    companion: "Ira T",
    serviceType: "chat",
    amount: 250,
    status: "Confirmed",
    createdAt: "2026-05-10T11:10:00.000Z",
    scheduledAt: "2026-05-13T12:15:00.000Z",
  },
  {
    id: "ab-2",
    bookingId: "YP-602845-Q8B3L",
    user: "+919999993637",
    companion: "Vijay K",
    serviceType: "audio",
    amount: 450,
    status: "Pending",
    createdAt: "2026-05-10T14:20:00.000Z",
    scheduledAt: "2026-05-13T15:00:00.000Z",
  },
];

export const seedAdminSessions: AdminSession[] = [
  {
    id: "as-1",
    sessionId: "SES-9001",
    user: "+919958719363",
    companion: "Ira T",
    type: "Chat",
    startedAt: "2026-05-13T09:10:00.000Z",
    duration: "00:18:12",
    amount: 180,
    status: "Live",
    safetyFlag: false,
    platformFee: 36,
    companionEarning: 144,
    safetyNotes: "No issues reported.",
  },
  {
    id: "as-2",
    sessionId: "SES-9002",
    user: "+919999993637",
    companion: "Anshikha B",
    type: "Audio",
    startedAt: "2026-05-13T08:05:00.000Z",
    endedAt: "2026-05-13T08:29:00.000Z",
    duration: "00:24:00",
    amount: 360,
    status: "Completed",
    safetyFlag: false,
    platformFee: 72,
    companionEarning: 288,
    safetyNotes: "Completed smoothly.",
  },
];

export const seedAdminTransactions: AdminTransaction[] = [
  {
    id: "txn-1",
    transactionId: "TRX-10001",
    user: "+919958719363",
    type: "Recharge",
    amount: 5000,
    status: "Success",
    gateway: "Wallet",
    date: "2026-05-10T10:00:00.000Z",
  },
  {
    id: "txn-2",
    transactionId: "TRX-10002",
    user: "+919999993637",
    type: "Booking",
    amount: -450,
    status: "Success",
    gateway: "Wallet",
    date: "2026-05-10T14:20:00.000Z",
  },
  {
    id: "txn-3",
    transactionId: "TRX-10003",
    user: "+919958719363",
    type: "Refund",
    amount: 250,
    status: "Success",
    gateway: "Wallet",
    date: "2026-05-12T11:10:00.000Z",
  },
];

export const seedAdminPayouts: AdminPayout[] = [
  {
    id: "pay-1",
    payoutId: "PO-5001",
    companion: "Ira T",
    phone: "+919811112233",
    amount: 5400,
    bankOrUpi: "ira@upi",
    status: "Requested",
    requestedDate: "2026-05-12T10:30:00.000Z",
  },
  {
    id: "pay-2",
    payoutId: "PO-5002",
    companion: "Anshikha B",
    phone: "+919822223344",
    amount: 3200,
    bankOrUpi: "anshikha@upi",
    status: "Approved",
    requestedDate: "2026-05-10T09:00:00.000Z",
  },
];

export const seedAdminReviews: AdminReview[] = [
  {
    id: "rv-1",
    user: "Aman Verma",
    companion: "Ira T",
    rating: 5,
    text: "Very supportive session and calm communication throughout.",
    status: "Approved",
    date: "2026-05-10T10:00:00.000Z",
  },
  {
    id: "rv-2",
    user: "Nisha Sharma",
    companion: "Anshikha B",
    rating: 4,
    text: "Helpful conversation but session started late.",
    status: "Pending",
    date: "2026-05-09T10:00:00.000Z",
  },
];

export const seedAdminVerifications: AdminVerification[] = [
  {
    id: "vf-1",
    partner: "Ira T",
    phone: "+919811112233",
    idVerification: "Verified",
    policeVerification: "Verified",
    psychometricTest: "Cleared",
    behaviouralInterview: "Cleared",
    training: "Trained",
    overallStatus: "Verified",
  },
  {
    id: "vf-2",
    partner: "Anshikha B",
    phone: "+919822223344",
    idVerification: "Pending",
    policeVerification: "Pending",
    psychometricTest: "Pending",
    behaviouralInterview: "Pending",
    training: "Pending",
    overallStatus: "Pending",
  },
];

export const seedAdminSupportTickets: AdminTicket[] = [
  {
    id: "tk-1",
    ticketId: "SUP-1001",
    actor: "User",
    userOrPartner: "+919958719363",
    type: "Payment",
    subject: "Recharge not reflecting in wallet",
    priority: "Urgent",
    status: "Open",
    date: "2026-05-10T09:45:00.000Z",
    assignedTo: "Ops Team",
    notes: [],
    timeline: ["Ticket created"],
  },
  {
    id: "tk-2",
    ticketId: "SUP-1002",
    actor: "Partner",
    userOrPartner: "+919822223344",
    type: "Technical",
    subject: "Audio call drop issue",
    priority: "High",
    status: "In Progress",
    date: "2026-05-11T15:10:00.000Z",
    assignedTo: "Support Lead",
    notes: ["Asked for call logs."],
    timeline: ["Ticket created", "Assigned to Support Lead"],
  },
];

export const seedAdminMedia: AdminMediaItem[] = [
  {
    id: "md-1",
    title: "Urban India and the companionship economy",
    publisher: "India Today",
    date: "2026-04-28",
    type: "Article",
    imageUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    label: "Read on India Today",
    href: "#",
    status: "Published",
  },
  {
    id: "md-2",
    title: "Listening is emotional support",
    publisher: "YouTube",
    date: "2026-05-02",
    type: "Podcast",
    imageUrl:
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=900&q=80",
    label: "Watch Podcast",
    href: "#",
    status: "Published",
  },
];

export const seedAdminClientDiaries: AdminDiaryItem[] = [
  {
    id: "cd-1",
    title: "From loneliness to laughter",
    subtitle: "A simple check-in session changed the week.",
    imageUrl:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
    videoUrl: "",
    status: "Published",
  },
  {
    id: "cd-2",
    title: "A quiet evening became memorable",
    subtitle: "Home visit companionship with clear safety boundaries.",
    imageUrl:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    videoUrl: "",
    status: "Draft",
  },
];

export const seedAdminSettings: AdminSettings = {
  platformName: "YoPartner",
  companyName: "Malachite Technologies PVT Ltd",
  supportEmail: "support@yopartner.in",
  supportPhone: "+91 90000 90000",
  defaultChatPrice: "10",
  defaultAudioPrice: "15",
  defaultVideoPrice: "20",
  defaultVisitPrice: "2000",
  gst: "18",
  minimumRecharge: "100",
  maximumRecharge: "50000",
  minimumBalanceRule: "5x service price",
  paymentGatewayRazorpayEnabled: true,
  paymentGatewayCashfreeEnabled: false,
  minimumAge: "21",
  requireIdVerification: true,
  requirePoliceVerification: true,
  requireTraining: true,
  autoApproveCompanions: false,
  platonicOnlyPolicy: true,
  blockOffPlatformPaymentSharing: true,
  enableReportReviewQueue: true,
  sessionMonitoringEnabled: true,
};
