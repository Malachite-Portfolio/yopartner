export const IS_PRODUCTION_READY_MODE = process.env.NEXT_PUBLIC_APP_MODE === "production";
export const IS_DEMO_MODE = !IS_PRODUCTION_READY_MODE;

export function getAppMode() {
  return IS_PRODUCTION_READY_MODE ? "production" : "demo";
}

export function isAgoraConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_AGORA_APP_ID &&
      process.env.NEXT_PUBLIC_AGORA_CHAT_APP_KEY,
  );
}
