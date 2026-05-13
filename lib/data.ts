export type Stat = {
  value: string;
  label: string;
};

export type ProcessStep = {
  title: string;
  description: string;
  icon: "search" | "calendar" | "heart";
};

export type Service = {
  title: string;
  description: string;
  icon:
    | "message-circle"
    | "phone-call"
    | "video"
    | "map-pin"
    | "sparkles"
    | "heart-handshake";
};

export type ServiceDetail = {
  title: string;
  description: string;
  highlights: string[];
};

export type CompanionFilter = "Chat" | "Calls" | "In-Person" | "Activities";
export type SupportType =
  | "Private Chat"
  | "Audio Calls"
  | "Video Calls"
  | "In-Person Visits"
  | "Activities"
  | "Emotional Support";

export type Companion = {
  id: number;
  name: string;
  city: string;
  rating: number;
  bio: string;
  longBio: string;
  tags: string[];
  price: string;
  focus: CompanionFilter[];
  languages: string[];
  availability: string;
  supportTypes: SupportType[];
  verification: string[];
};

export type SafetyItem = {
  title: string;
  description: string;
  icon:
    | "badge-check"
    | "clipboard-check"
    | "lock"
    | "shield-ban"
    | "life-buoy"
    | "heart-handshake";
};

export type Testimonial = {
  name: string;
  city: string;
  quote: string;
};

export type FAQ = {
  question: string;
  answer: string;
};

export type ConnectCompanion = {
  id: string;
  name: string;
  tagline: string;
  category: string;
  age: number;
  gender: string;
  religion: string;
  bornCity: string;
  nationality: string;
  college: string;
  qualification: string;
  languages: string[];
  communicationStyle: string;
  hobbies: string[];
  rating: number;
  reviewsCount: number;
  experience: string;
  online: boolean;
  image?: string;
  galleryImages: string[];
  chatPrice: number;
  voicePrice: number;
  videoPrice?: number;
  visitPrice: number;
  serviceAreas: string[];
  servicesOffered: string[];
  about: string;
  verification: Array<{
    label: string;
    status: string;
  }>;
  sessions: number;
  reviews: Array<{
    phone: string;
    date: string;
    rating: number;
    message: string;
    recommended: boolean;
  }>;
};

export type HomeVisitCompanion = {
  id: string;
  name: string;
  tagline: string;
  image: string;
  rating: number;
  experience: string;
  verified: boolean;
  price: number;
  category: string;
  services: string[];
  city: string;
  connectProfileId?: string;
};

export type MediaArticle = {
  id: string;
  type: "article" | "podcast";
  date: string;
  publisher: string;
  title: string;
  image: string;
  readLabel: string;
  href: string;
};

export type MediaPodcast = {
  id: string;
  type: "podcast";
  label: "Podcast";
  platform: "Youtube";
  title: string;
  image: string;
  watchLabel: string;
  href: string;
};

export type ClientDiary = {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  href: string;
  category?: string;
};

export const stats: Stat[] = [
  { value: "12,000+", label: "sessions hosted" },
  { value: "120+", label: "active companions" },
  { value: "8", label: "cities served" },
  { value: "4.9/5", label: "average rating" },
];

export const processSteps: ProcessStep[] = [
  {
    title: "Browse Companions",
    description:
      "Explore verified profiles by city, availability, and conversation style.",
    icon: "search",
  },
  {
    title: "Book a Session",
    description:
      "Choose your preferred format and reserve a session that fits your schedule.",
    icon: "calendar",
  },
  {
    title: "Connect & Enjoy",
    description:
      "Share meaningful time in a calm, respectful, and strictly platonic space.",
    icon: "heart",
  },
];

export const services: Service[] = [
  {
    title: "Private Chat",
    description: "Thoughtful text conversations when you need presence and care.",
    icon: "message-circle",
  },
  {
    title: "Audio Calls",
    description: "Warm, voice-based support for deeper emotional connection.",
    icon: "phone-call",
  },
  {
    title: "Video Calls",
    description: "Face-to-face sessions for meaningful and comfortable interaction.",
    icon: "video",
  },
  {
    title: "In-Person Visits",
    description: "Safe, pre-planned meetings for coffee, walks, and companionship.",
    icon: "map-pin",
  },
  {
    title: "Activities",
    description: "Join hobbies, events, and shared interests with trusted company.",
    icon: "sparkles",
  },
  {
    title: "Emotional Support",
    description:
      "Judgment-free listening and steady support for everyday emotional needs.",
    icon: "heart-handshake",
  },
];

export const serviceDetails: ServiceDetail[] = [
  {
    title: "Private Chat",
    description:
      "Text-based companionship for day-to-day support, clarity, and comforting conversation.",
    highlights: [
      "Flexible durations for short check-ins or longer conversations",
      "Great for introverts and people who prefer writing",
      "A private and respectful judgment-free exchange",
    ],
  },
  {
    title: "Audio Calls",
    description:
      "Voice sessions when hearing a calm and caring person helps you feel grounded.",
    highlights: [
      "Natural conversations with emotional warmth",
      "Useful during stressful, lonely, or transitional periods",
      "Scheduled sessions with verified companions",
    ],
  },
  {
    title: "Video Calls",
    description:
      "Face-to-face calls for stronger human presence and meaningful one-on-one connection.",
    highlights: [
      "Visual support with clear boundaries",
      "Helpful for confidence and social comfort",
      "Safe and strictly platonic environment",
    ],
  },
  {
    title: "In-Person Visits",
    description:
      "Planned in-person companionship for coffee, walks, events, or everyday support.",
    highlights: [
      "Conducted in approved safe settings",
      "Respectful boundaries and platform safety protocols",
      "Available in selected cities with verified companions",
    ],
  },
  {
    title: "Activities",
    description:
      "Shared experiences like hobbies, museum visits, light outings, and social activities.",
    highlights: [
      "Companionship for events and routines",
      "Build confidence through shared moments",
      "Personalized around comfort and interests",
    ],
  },
  {
    title: "Emotional Support",
    description:
      "Compassionate listening and stable support when life feels heavy or uncertain.",
    highlights: [
      "Non-clinical emotional companionship",
      "Steady, respectful, and confidential presence",
      "Ideal for those seeking human connection without judgment",
    ],
  },
];

export const companions: Companion[] = [
  {
    id: 1,
    name: "Aarav",
    city: "Mumbai",
    rating: 4.9,
    bio: "Gentle listener who enjoys long chats, beach walks, and mindfulness conversations.",
    longBio:
      "Aarav is known for his calm energy and thoughtful presence. He supports clients through private chat, calls, and safe in-person sessions focused on connection, clarity, and emotional steadiness.",
    tags: ["Calm", "Empathetic", "English/Hindi"],
    price: "from INR 899 / session",
    focus: ["Chat", "Calls", "In-Person"],
    languages: ["English", "Hindi"],
    availability: "Mon-Sat, 10:00 AM - 9:00 PM",
    supportTypes: ["Private Chat", "Audio Calls", "In-Person Visits", "Emotional Support"],
    verification: ["Government ID verified", "Background reviewed", "Profile quality approved"],
  },
  {
    id: 2,
    name: "Meera",
    city: "Bengaluru",
    rating: 4.8,
    bio: "Great for creative outings, coffee catchups, and confidence-building talks.",
    longBio:
      "Meera creates uplifting sessions centered on creativity, social confidence, and healthy emotional expression. She is a great fit for activities and supportive calls that feel natural and warm.",
    tags: ["Creative", "Positive", "Kannada/English"],
    price: "from INR 999 / session",
    focus: ["Calls", "Activities", "In-Person"],
    languages: ["English", "Kannada"],
    availability: "Tue-Sun, 11:00 AM - 8:00 PM",
    supportTypes: ["Audio Calls", "Video Calls", "Activities", "In-Person Visits"],
    verification: ["Government ID verified", "Address verified", "Profile quality approved"],
  },
  {
    id: 3,
    name: "Rohan",
    city: "Delhi",
    rating: 4.9,
    bio: "Steady and reassuring companion for emotional check-ins and life transitions.",
    longBio:
      "Rohan offers grounded companionship for people navigating stress, uncertainty, or big life changes. His sessions are thoughtful, practical, and deeply respectful.",
    tags: ["Supportive", "Patient", "Hindi/English"],
    price: "from INR 799 / session",
    focus: ["Chat", "Calls"],
    languages: ["English", "Hindi"],
    availability: "Daily, 9:00 AM - 7:00 PM",
    supportTypes: ["Private Chat", "Audio Calls", "Video Calls", "Emotional Support"],
    verification: ["Government ID verified", "Background reviewed", "Safety onboarding complete"],
  },
  {
    id: 4,
    name: "Ishita",
    city: "Pune",
    rating: 5.0,
    bio: "Enjoys museum visits, journaling sessions, and uplifting conversations.",
    longBio:
      "Ishita brings a thoughtful and reflective style to companionship. She is popular for structured activity sessions and gentle conversations that help clients feel balanced and seen.",
    tags: ["Thoughtful", "Warm", "Marathi/English"],
    price: "from INR 1099 / session",
    focus: ["Activities", "In-Person", "Calls"],
    languages: ["English", "Marathi"],
    availability: "Mon-Fri, 12:00 PM - 9:00 PM",
    supportTypes: ["Video Calls", "In-Person Visits", "Activities", "Emotional Support"],
    verification: ["Government ID verified", "Profile quality approved", "Interview completed"],
  },
  {
    id: 5,
    name: "Kabir",
    city: "Hyderabad",
    rating: 4.8,
    bio: "Friendly companion for game nights, city strolls, and practical life chats.",
    longBio:
      "Kabir is approachable and grounded, making sessions feel easy and natural. He supports social confidence, routine companionship, and practical everyday check-ins.",
    tags: ["Friendly", "Grounded", "Telugu/Hindi"],
    price: "from INR 949 / session",
    focus: ["Chat", "Activities", "In-Person"],
    languages: ["Hindi", "Telugu"],
    availability: "Wed-Mon, 2:00 PM - 10:00 PM",
    supportTypes: ["Private Chat", "Activities", "In-Person Visits", "Audio Calls"],
    verification: ["Government ID verified", "Address verified", "Safety onboarding complete"],
  },
  {
    id: 6,
    name: "Sana",
    city: "Chennai",
    rating: 4.9,
    bio: "A calm presence for difficult days, with strong listening and emotional care.",
    longBio:
      "Sana offers compassionate companionship for emotionally heavy moments. Her sessions prioritize listening, privacy, and helping clients feel understood without pressure.",
    tags: ["Kind", "Confidential", "Tamil/English"],
    price: "from INR 999 / session",
    focus: ["Chat", "Calls"],
    languages: ["English", "Tamil"],
    availability: "Daily, 8:00 AM - 6:00 PM",
    supportTypes: ["Private Chat", "Audio Calls", "Video Calls", "Emotional Support"],
    verification: ["Government ID verified", "Background reviewed", "Profile quality approved"],
  },
];

export const safetyItems: SafetyItem[] = [
  {
    title: "Background Verified",
    description: "Identity and basic background checks are completed for every companion.",
    icon: "badge-check",
  },
  {
    title: "Profile Reviewed",
    description: "Profiles are manually reviewed for quality, clarity, and safety standards.",
    icon: "clipboard-check",
  },
  {
    title: "Private & Confidential",
    description: "Your personal details and sessions are handled with strict confidentiality.",
    icon: "lock",
  },
  {
    title: "Zero Tolerance Policy",
    description: "Any abusive, unsafe, or policy-violating behavior leads to immediate action.",
    icon: "shield-ban",
  },
  {
    title: "24/7 Support",
    description: "Need help anytime? Our support team is available around the clock.",
    icon: "life-buoy",
  },
  {
    title: "Judgment-Free Zone",
    description: "Every session is designed to be respectful, inclusive, and emotionally safe.",
    icon: "heart-handshake",
  },
];

export const testimonials: Testimonial[] = [
  {
    name: "Nisha",
    city: "Mumbai",
    quote:
      "I felt seen and heard for the first time in months. The session was warm, respectful, and genuinely comforting.",
  },
  {
    name: "Arjun",
    city: "Bengaluru",
    quote:
      "I booked for a difficult week, and the support helped me feel steady again. It was kind and completely non-judgmental.",
  },
  {
    name: "Devika",
    city: "Pune",
    quote:
      "The companion was thoughtful and professional. It felt safe, human, and exactly what I needed after moving to a new city.",
  },
];

export const faqs: FAQ[] = [
  {
    question: "How are companions verified?",
    answer:
      "Every companion goes through identity checks, profile screening, and a guided onboarding process before becoming active.",
  },
  {
    question: "Is this a dating or romantic service?",
    answer:
      "No. YoPartner is strictly platonic and non-romantic. Our focus is human companionship and emotional support in a safe environment.",
  },
  {
    question: "What age groups does YoPartner serve?",
    answer:
      "YoPartner is built for adults aged 18 and above who are looking for respectful, meaningful companionship sessions.",
  },
  {
    question: "How do in-person sessions work?",
    answer:
      "In-person sessions are planned in advance, held in approved public or agreed safe spaces, and monitored by platform safety standards.",
  },
  {
    question: "How much does a session cost?",
    answer:
      "Pricing varies by companion, format, and duration. You can view clear per-session rates directly on each profile card.",
  },
  {
    question: "What if I am not satisfied with my session?",
    answer:
      "Reach out to support immediately. We review each concern and help with fair resolutions based on your experience.",
  },
  {
    question: "Can I choose the same companion again?",
    answer:
      "Yes. If your preferred companion is available, you can book repeat sessions to maintain continuity and comfort.",
  },
  {
    question: "Are conversations kept private?",
    answer:
      "Yes. YoPartner follows strict privacy standards. Personal details and session context are treated as confidential.",
  },
];

export const connectCompanions: ConnectCompanion[] = [
  {
    id: "ira-t",
    name: "Ira T",
    tagline: "Towards healing",
    category: "Communication & Emotional Support",
    age: 22,
    gender: "Female",
    religion: "Hindu",
    bornCity: "Gurugram",
    nationality: "Indian",
    college: "Christ University Bengaluru",
    qualification: "MSc. psychology",
    languages: ["Hindi", "English", "Bengali"],
    communicationStyle: "Easy to Communicate, open minded, collaborative",
    hobbies: ["Dance", "Reading", "Running"],
    rating: 5.0,
    reviewsCount: 12,
    experience: "4 yrs+",
    online: true,
    image:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=320&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=520&q=80",
    ],
    chatPrice: 10,
    voicePrice: 15,
    videoPrice: 20,
    visitPrice: 2000,
    serviceAreas: ["India"],
    servicesOffered: [
      "Active listening",
      "Empathetic conversation",
      "Motivational talk",
      "Public speaking",
      "Cross-cultural communication",
      "Stress counseling (non-clinical)",
      "Break-up support",
      "Conversational English practice",
      "Life reflections sharing",
      "Bucket list planning buddy",
      "Pet lover (Dog & Cat)",
    ],
    about:
      "Trying to bring a calm and grounding presence wherever I go. With a naturally warm and friendly personality, I enjoy meaningful conversations and love connecting with people in a cheerful and supportive way.",
    sessions: 290,
    verification: [
      { label: "ID Verification", status: "Verified" },
      { label: "Police Verification", status: "Verified" },
      { label: "Psychometric Test", status: "Cleared" },
      { label: "Behavioural Interview", status: "Cleared" },
      { label: "Training By YoPartner Team", status: "Trained" },
    ],
    reviews: [
      {
        phone: "******8251",
        date: "09 May 2026",
        rating: 5,
        message: "Very calming conversation. Felt heard without any judgment.",
        recommended: true,
      },
      {
        phone: "******1493",
        date: "04 May 2026",
        rating: 5,
        message: "She helped me process a stressful week with practical perspective.",
        recommended: true,
      },
      {
        phone: "******7330",
        date: "30 Apr 2026",
        rating: 5,
        message: "Kind, attentive, and thoughtful through the whole session.",
        recommended: true,
      },
      {
        phone: "******0812",
        date: "22 Apr 2026",
        rating: 5,
        message: "Great listener. I felt emotionally lighter afterward.",
        recommended: true,
      },
      {
        phone: "******6405",
        date: "16 Apr 2026",
        rating: 5,
        message: "Warm and collaborative communication style. Highly recommend.",
        recommended: true,
      },
      {
        phone: "******2198",
        date: "08 Apr 2026",
        rating: 4.9,
        message: "Supportive and professional. Session pacing was excellent.",
        recommended: true,
      },
    ],
  },
  {
    id: "anshikha-b",
    name: "Anshikha B",
    tagline: "Your mood uplifter",
    category: "Communication & Emotional Support",
    age: 24,
    gender: "Female",
    religion: "Hindu",
    bornCity: "Pune",
    nationality: "Indian",
    college: "Symbiosis International University",
    qualification: "MA Psychology",
    languages: ["English", "Hindi", "Marathi"],
    communicationStyle: "Friendly, empathetic, reassuring",
    hobbies: ["Photography", "Yoga", "Podcasts"],
    rating: 5.0,
    reviewsCount: 10,
    experience: "1 yrs+",
    online: true,
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1505238680356-667803448bb6?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=520&q=80",
    ],
    chatPrice: 10,
    voicePrice: 15,
    videoPrice: 20,
    visitPrice: 2000,
    serviceAreas: ["India"],
    servicesOffered: [
      "Empathetic conversation",
      "Motivational talk",
      "Break-up support",
      "Life reflections sharing",
    ],
    about:
      "I support clients through emotionally uplifting sessions focused on clarity, confidence, and feeling understood.",
    sessions: 140,
    verification: [
      { label: "ID Verification", status: "Verified" },
      { label: "Police Verification", status: "Verified" },
      { label: "Psychometric Test", status: "Cleared" },
      { label: "Behavioural Interview", status: "Cleared" },
      { label: "Training By YoPartner Team", status: "Trained" },
    ],
    reviews: [
      {
        phone: "******1204",
        date: "10 May 2026",
        rating: 5,
        message: "Very positive session. Mood improved a lot.",
        recommended: true,
      },
      {
        phone: "******9842",
        date: "02 May 2026",
        rating: 5,
        message: "Compassionate and very easy to talk to.",
        recommended: true,
      },
    ],
  },
  {
    id: "avni-p",
    name: "Avni P",
    tagline: "Calm conversations with a cheerful spirit",
    category: "Communication & Emotional Support",
    age: 23,
    gender: "Female",
    religion: "Hindu",
    bornCity: "Jaipur",
    nationality: "Indian",
    college: "University of Delhi",
    qualification: "BA Psychology",
    languages: ["Hindi", "English"],
    communicationStyle: "Calm, structured, supportive",
    hobbies: ["Singing", "Travel", "Journaling"],
    rating: 4.9,
    reviewsCount: 8,
    experience: "1 yrs+",
    online: true,
    image:
      "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=320&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1454923634634-bd1614719a7b?auto=format&fit=crop&w=520&q=80",
    ],
    chatPrice: 8,
    voicePrice: 15,
    visitPrice: 1800,
    serviceAreas: ["India"],
    servicesOffered: ["Active listening", "Conversational English practice", "Stress counseling (non-clinical)"],
    about:
      "I keep sessions grounded, patient, and uplifting for clients who want calm and consistent support.",
    sessions: 118,
    verification: [
      { label: "ID Verification", status: "Verified" },
      { label: "Police Verification", status: "Verified" },
      { label: "Psychometric Test", status: "Cleared" },
      { label: "Behavioural Interview", status: "Cleared" },
      { label: "Training By YoPartner Team", status: "Trained" },
    ],
    reviews: [
      {
        phone: "******5539",
        date: "03 May 2026",
        rating: 4.9,
        message: "Good listener and calm communication style.",
        recommended: true,
      },
    ],
  },
  {
    id: "janvi-s",
    name: "Janvi S",
    tagline: "Let's talk with a sense of humor",
    category: "Communication & Emotional Support",
    age: 25,
    gender: "Female",
    religion: "Hindu",
    bornCity: "Indore",
    nationality: "Indian",
    college: "NMIMS Mumbai",
    qualification: "BBA",
    languages: ["Hindi", "English"],
    communicationStyle: "Humorous, comforting, direct",
    hobbies: ["Comedy", "Sketching", "Badminton"],
    rating: 4.9,
    reviewsCount: 9,
    experience: "1 yrs+",
    online: true,
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=320&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1456327102063-fb5054efe647?auto=format&fit=crop&w=520&q=80",
    ],
    chatPrice: 10,
    voicePrice: 15,
    videoPrice: 20,
    visitPrice: 1900,
    serviceAreas: ["India"],
    servicesOffered: ["Motivational talk", "Break-up support", "Active listening"],
    about:
      "I combine warmth and humor to create a safe, lighter emotional space where people can open up freely.",
    sessions: 126,
    verification: [
      { label: "ID Verification", status: "Verified" },
      { label: "Police Verification", status: "Verified" },
      { label: "Psychometric Test", status: "Cleared" },
      { label: "Behavioural Interview", status: "Cleared" },
      { label: "Training By YoPartner Team", status: "Trained" },
    ],
    reviews: [
      {
        phone: "******4402",
        date: "01 May 2026",
        rating: 4.9,
        message: "Very engaging and helpful session.",
        recommended: true,
      },
    ],
  },
  {
    id: "aakriti-s",
    name: "Aakriti S",
    tagline: "Healing in Motion",
    category: "Communication & Emotional Support",
    age: 26,
    gender: "Female",
    religion: "Hindu",
    bornCity: "Lucknow",
    nationality: "Indian",
    college: "Banaras Hindu University",
    qualification: "MA Counseling",
    languages: ["Hindi", "English"],
    communicationStyle: "Calm, reflective, emotionally aware",
    hobbies: ["Meditation", "Long walks", "Music"],
    rating: 0.0,
    reviewsCount: 3,
    experience: "1 yrs+",
    online: true,
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1517864604815-6a2798562f95?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=520&q=80",
    ],
    chatPrice: 8,
    voicePrice: 15,
    videoPrice: 20,
    visitPrice: 1900,
    serviceAreas: ["India"],
    servicesOffered: ["Stress counseling (non-clinical)", "Empathetic conversation"],
    about:
      "I help clients slow down, breathe, and find clarity through mindful and compassionate conversations.",
    sessions: 85,
    verification: [
      { label: "ID Verification", status: "Verified" },
      { label: "Police Verification", status: "Verified" },
      { label: "Psychometric Test", status: "Cleared" },
      { label: "Behavioural Interview", status: "Cleared" },
      { label: "Training By YoPartner Team", status: "Trained" },
    ],
    reviews: [
      {
        phone: "******0871",
        date: "28 Apr 2026",
        rating: 4.8,
        message: "Soft and supportive style. Good for stress days.",
        recommended: true,
      },
    ],
  },
  {
    id: "kartik-a",
    name: "Kartik A.",
    tagline: "Good Vibes Coach",
    category: "Lifestyle & Daily Support",
    age: 28,
    gender: "Male",
    religion: "Hindu",
    bornCity: "Bhopal",
    nationality: "Indian",
    college: "IIM Indore",
    qualification: "MBA",
    languages: ["Hindi", "English"],
    communicationStyle: "Energetic, practical, uplifting",
    hobbies: ["Fitness", "Football", "Podcasts"],
    rating: 5.0,
    reviewsCount: 14,
    experience: "4 yrs+",
    online: true,
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=520&q=80",
    ],
    chatPrice: 5,
    voicePrice: 10,
    videoPrice: 15,
    visitPrice: 2000,
    serviceAreas: ["India"],
    servicesOffered: ["Motivational talk", "Event companion", "Bucket list planning buddy"],
    about:
      "I bring practical positivity and high-energy support for clients working through lifestyle changes.",
    sessions: 330,
    verification: [
      { label: "ID Verification", status: "Verified" },
      { label: "Police Verification", status: "Verified" },
      { label: "Psychometric Test", status: "Cleared" },
      { label: "Behavioural Interview", status: "Cleared" },
      { label: "Training By YoPartner Team", status: "Trained" },
    ],
    reviews: [
      {
        phone: "******6617",
        date: "11 May 2026",
        rating: 5,
        message: "Great motivational energy and practical suggestions.",
        recommended: true,
      },
    ],
  },
  {
    id: "vijay-k",
    name: "Vijay K",
    tagline: "Witty Resilient Charmer",
    category: "Lifestyle & Daily Support",
    age: 27,
    gender: "Male",
    religion: "Hindu",
    bornCity: "Chandigarh",
    nationality: "Indian",
    college: "Panjab University",
    qualification: "BCom",
    languages: ["Hindi", "English", "Punjabi"],
    communicationStyle: "Witty, encouraging, easy-going",
    hobbies: ["Cricket", "Standup shows", "Travel"],
    rating: 4.9,
    reviewsCount: 11,
    experience: "1 yrs+",
    online: true,
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=320&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1482961674540-0b0e8363a005?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1475609471617-0ef53b59cff3?auto=format&fit=crop&w=520&q=80",
    ],
    chatPrice: 10,
    voicePrice: 15,
    videoPrice: 20,
    visitPrice: 1900,
    serviceAreas: ["India"],
    servicesOffered: ["Conversational English practice", "Empathetic conversation"],
    about:
      "I create a relaxed and encouraging environment for people who need confidence and social comfort.",
    sessions: 145,
    verification: [
      { label: "ID Verification", status: "Verified" },
      { label: "Police Verification", status: "Verified" },
      { label: "Psychometric Test", status: "Cleared" },
      { label: "Behavioural Interview", status: "Cleared" },
      { label: "Training By YoPartner Team", status: "Trained" },
    ],
    reviews: [
      {
        phone: "******9120",
        date: "07 May 2026",
        rating: 4.9,
        message: "Fun and supportive at the same time.",
        recommended: true,
      },
    ],
  },
  {
    id: "shaurya-s",
    name: "Shaurya S",
    tagline: "Friend in Need",
    category: "Communication & Emotional Support",
    age: 31,
    gender: "Male",
    religion: "Hindu",
    bornCity: "Noida",
    nationality: "Indian",
    college: "Delhi Technological University",
    qualification: "BTech",
    languages: ["Hindi", "English"],
    communicationStyle: "Reliable, thoughtful, reassuring",
    hobbies: ["Chess", "Cycling", "Books"],
    rating: 4.9,
    reviewsCount: 16,
    experience: "7 yrs+",
    online: true,
    image:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=320&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=520&q=80",
    ],
    chatPrice: 10,
    voicePrice: 15,
    videoPrice: 20,
    visitPrice: 2100,
    serviceAreas: ["India"],
    servicesOffered: ["Active listening", "Life reflections sharing", "Break-up support"],
    about:
      "I provide dependable emotional support through grounded conversations and practical perspective sharing.",
    sessions: 410,
    verification: [
      { label: "ID Verification", status: "Verified" },
      { label: "Police Verification", status: "Verified" },
      { label: "Psychometric Test", status: "Cleared" },
      { label: "Behavioural Interview", status: "Cleared" },
      { label: "Training By YoPartner Team", status: "Trained" },
    ],
    reviews: [
      {
        phone: "******5084",
        date: "06 May 2026",
        rating: 4.9,
        message: "Very reliable support during a rough period.",
        recommended: true,
      },
    ],
  },
  {
    id: "raghav-c",
    name: "Raghav C",
    tagline: "Sports Enthusiast, extracurricular mentor",
    category: "Lifestyle & Daily Support",
    age: 29,
    gender: "Male",
    religion: "Hindu",
    bornCity: "Ahmedabad",
    nationality: "Indian",
    college: "Nirma University",
    qualification: "BBA",
    languages: ["Hindi", "English", "Gujarati"],
    communicationStyle: "Motivating, confident, practical",
    hobbies: ["Football", "Trekking", "Volunteering"],
    rating: 4.9,
    reviewsCount: 13,
    experience: "8 yrs+",
    online: true,
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=520&q=80",
    ],
    chatPrice: 10,
    voicePrice: 15,
    videoPrice: 20,
    visitPrice: 2200,
    serviceAreas: ["India"],
    servicesOffered: ["Motivational talk", "Shopping companion", "Event companion"],
    about:
      "I focus on confidence-building companionship with high-energy and structured support for everyday goals.",
    sessions: 520,
    verification: [
      { label: "ID Verification", status: "Verified" },
      { label: "Police Verification", status: "Verified" },
      { label: "Psychometric Test", status: "Cleared" },
      { label: "Behavioural Interview", status: "Cleared" },
      { label: "Training By YoPartner Team", status: "Trained" },
    ],
    reviews: [
      {
        phone: "******7781",
        date: "05 May 2026",
        rating: 4.9,
        message: "Super positive and motivating personality.",
        recommended: true,
      },
    ],
  },
];

export const homeVisitCompanions: HomeVisitCompanion[] = [
  {
    id: "mansi-s",
    name: "Mansi S",
    tagline: "Happy talks ahead",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=80",
    rating: 5,
    experience: "1 yrs+",
    verified: true,
    price: 1700,
    category: "Communication & Emotional Support",
    services: ["Empathetic conversation", "Motivational talk"],
    city: "Mumbai",
  },
  {
    id: "ira-t",
    name: "Ira T",
    tagline: "Towards healing",
    image:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=320&q=80",
    rating: 5,
    experience: "4 yrs+",
    verified: true,
    price: 2000,
    category: "Communication & Emotional Support",
    services: ["Active listening", "Stress counseling (non-clinical)"],
    city: "Bengaluru",
    connectProfileId: "ira-t",
  },
  {
    id: "anshikha-b",
    name: "Anshikha B",
    tagline: "Your mood uplifter",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=80",
    rating: 5,
    experience: "1 yrs+",
    verified: true,
    price: 1700,
    category: "Communication & Emotional Support",
    services: ["Empathetic conversation", "Break-up support"],
    city: "Pune",
    connectProfileId: "anshikha-b",
  },
  {
    id: "anjali-d",
    name: "Anjali D",
    tagline: "Your Emotional Ally",
    image:
      "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=320&q=80",
    rating: 4.9,
    experience: "1 yrs+",
    verified: true,
    price: 1700,
    category: "Communication & Emotional Support",
    services: ["Active listening", "Motivational talk"],
    city: "Jaipur",
  },
  {
    id: "vijay-k",
    name: "Vijay K",
    tagline: "Witty Resilient Charmer",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=320&q=80",
    rating: 4.9,
    experience: "1 yrs+",
    verified: true,
    price: 1200,
    category: "Lifestyle & Practical Help",
    services: ["Event companion", "Shopping assistance"],
    city: "Delhi",
    connectProfileId: "vijay-k",
  },
  {
    id: "yash-g",
    name: "Yash G",
    tagline: "Listener first, fun always, pet lover",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80",
    rating: 4.9,
    experience: "7 yrs+",
    verified: true,
    price: 1200,
    category: "Lifestyle & Practical Help",
    services: ["Pet companion", "Elderly companionship"],
    city: "Hyderabad",
  },
  {
    id: "raghav-c",
    name: "Raghav C",
    tagline: "Sports Enthusiast, extracurricular...",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80",
    rating: 4.9,
    experience: "8 yrs+",
    verified: true,
    price: 1200,
    category: "Social & Outdoor",
    services: ["Walk companion", "Travel companion"],
    city: "Ahmedabad",
    connectProfileId: "raghav-c",
  },
  {
    id: "ajay-m",
    name: "Ajay M",
    tagline: "Humor with Heart",
    image:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=320&q=80",
    rating: 4.9,
    experience: "17 yrs+",
    verified: true,
    price: 2500,
    category: "Social & Outdoor",
    services: ["Event companion", "Movie partner"],
    city: "Chandigarh",
  },
  {
    id: "veer-p",
    name: "Veer P",
    tagline: "Active listening",
    image:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=320&q=80",
    rating: 4.9,
    experience: "8 yrs+",
    verified: true,
    price: 2000,
    category: "Communication & Emotional Support",
    services: ["Active listening", "Stress counseling (non-clinical)"],
    city: "Bengaluru",
  },
];

export const mediaArticles: MediaArticle[] = [
  {
    id: "india-today-2026",
    type: "article",
    date: "Apr 28, 2026",
    publisher: "India Today",
    title: "Urban India’s new reality: Pay ₹600 to talk, walk and spend time with a trusted companion",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    readLabel: "Read on India Today",
    href: "#",
  },
  {
    id: "startuptalky-2026",
    type: "article",
    date: "Mar, 2026",
    publisher: "StartupTalky",
    title: "The loneliness economy: How YoPartner is building human connection in a digital-first world",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80",
    readLabel: "Read on StartupTalky",
    href: "#",
  },
  {
    id: "dailyhunt-launch",
    type: "article",
    date: "Feb 14, 2026",
    publisher: "Daily Hunt",
    title: "YoPartner launches to address rising loneliness through safe human-to-human companionship",
    image:
      "https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=900&q=80",
    readLabel: "Read on Daily Hunt",
    href: "#",
  },
  {
    id: "dailyhunt-connections",
    type: "article",
    date: "Feb 14, 2026",
    publisher: "Daily Hunt",
    title: "YoPartner brings safe companionship and real connections to everyday life",
    image:
      "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=900&q=80",
    readLabel: "Read on Daily Hunt",
    href: "#",
  },
];

export const mediaPodcasts: MediaPodcast[] = [
  {
    id: "podcast-vent-without-judgment",
    type: "podcast",
    label: "Podcast",
    platform: "Youtube",
    title: "1 Place to Vent Without Judgment",
    image:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
    watchLabel: "Watch Podcast",
    href: "#",
  },
  {
    id: "podcast-listening-support",
    type: "podcast",
    label: "Podcast",
    platform: "Youtube",
    title: "Listening is also emotional support",
    image:
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1200&q=80",
    watchLabel: "Watch Podcast",
    href: "#",
  },
  {
    id: "podcast-human-connection-loneliness",
    type: "podcast",
    label: "Podcast",
    platform: "Youtube",
    title: "YoPartner Podcast – Conversation on Human Connection & Loneliness",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    watchLabel: "Watch Podcast",
    href: "#",
  },
  {
    id: "podcast-founder-why-companionship",
    type: "podcast",
    label: "Podcast",
    platform: "Youtube",
    title: "Founder Conversation – Why Human Companionship Matters",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    watchLabel: "Watch Podcast",
    href: "#",
  },
];

export const clientDiaries: ClientDiary[] = [
  {
    id: "dementia-joy",
    title: "Dementia Patient Finds Joy Again",
    subtitle: "A gentle visit that brought smiles back.",
    image:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80",
    href: "#",
    category: "Home Visit",
  },
  {
    id: "poetry-listener",
    title: "A Poetry Lover Finds a Listener Again",
    subtitle: "One conversation turned into a meaningful connection.",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
    href: "#",
    category: "Conversation",
  },
  {
    id: "found-voice",
    title: "At 70+, He Found His Voice Again",
    subtitle: "Support, companionship, and someone who listened.",
    image:
      "https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3?auto=format&fit=crop&w=1200&q=80",
    href: "#",
    category: "Emotional Support",
  },
  {
    id: "quiet-evening",
    title: "A Quiet Evening Became Memorable",
    subtitle: "A simple home visit made the day lighter.",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    href: "#",
    category: "Companionship",
  },
  {
    id: "loneliness-to-laughter",
    title: "From Loneliness to Laughter",
    subtitle: "Real companionship for everyday moments.",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
    href: "#",
    category: "Stories",
  },
];

