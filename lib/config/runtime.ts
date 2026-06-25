const appMode = (process.env.NEXT_PUBLIC_APP_MODE ?? "").trim().toLowerCase();
const isDevelopment = process.env.NODE_ENV === "development";
const clientDemoEnabled =
  isDevelopment && process.env.NEXT_PUBLIC_CLIENT_DEMO_ENABLED === "true";

export const IS_DEMO_MODE = clientDemoEnabled || (isDevelopment && appMode === "demo");
export const IS_PRODUCTION_READY_MODE = !IS_DEMO_MODE;

export function getAppMode() {
  return IS_PRODUCTION_READY_MODE ? "production" : "demo";
}

export function isCallProviderConfigured() {
  return process.env.NEXT_PUBLIC_CALL_PROVIDER === "zegocloud" &&
    Boolean(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
}
