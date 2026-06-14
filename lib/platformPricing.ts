export const CHAT_RATE_PER_MESSAGE = 5;
export const CHAT_RATE_PER_MIN = CHAT_RATE_PER_MESSAGE;
export const AUDIO_RATE_PER_MIN = 18;
export const VIDEO_RATE_PER_MIN = 24;
export const HOME_VISIT_RATE_PER_HOUR = 2000;

export const FIXED_PLATFORM_PRICING = {
  chat: CHAT_RATE_PER_MIN,
  audio: AUDIO_RATE_PER_MIN,
  video: VIDEO_RATE_PER_MIN,
  homeVisit: HOME_VISIT_RATE_PER_HOUR,
} as const;

export function getFixedPlatformRate(serviceType: "chat" | "audio" | "video" | "visit" | "homeVisit") {
  if (serviceType === "chat") return CHAT_RATE_PER_MIN;
  if (serviceType === "audio") return AUDIO_RATE_PER_MIN;
  if (serviceType === "video") return VIDEO_RATE_PER_MIN;
  return HOME_VISIT_RATE_PER_HOUR;
}

export const FIXED_PLATFORM_PRICE_LABELS = {
  chat: `\u20b9${CHAT_RATE_PER_MESSAGE}/message`,
  audio: `\u20b9${AUDIO_RATE_PER_MIN}/min`,
  video: `\u20b9${VIDEO_RATE_PER_MIN}/min`,
  homeVisit: `\u20b9${HOME_VISIT_RATE_PER_HOUR}/hour`,
} as const;
