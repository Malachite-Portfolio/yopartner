import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  ILocalAudioTrack,
  ILocalVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
  UID,
} from "agora-rtc-sdk-ng";

export type AgoraModule = typeof import("agora-rtc-sdk-ng");

export async function loadAgoraModule(): Promise<AgoraModule> {
  return import("agora-rtc-sdk-ng");
}

export async function createAgoraClient(): Promise<IAgoraRTCClient> {
  const AgoraRTC = await loadAgoraModule();
  return AgoraRTC.default.createClient({ mode: "rtc", codec: "vp8" });
}

function hashToPositiveInt(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return (hash % 2147483640) + 1;
}

export function buildAgoraUid(sessionId: string, actorId: string): UID {
  return hashToPositiveInt(`${sessionId}:${actorId}`);
}

export function normalizeChannelName(sessionId: string, channelName?: string | null) {
  const trimmed = String(channelName ?? "").trim();
  if (trimmed.length > 0) return trimmed;
  return `session-${sessionId}`;
}

export async function requestAudioPermission() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Media devices API is not available in this browser.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => track.stop());
}

export async function requestVideoPermission() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Media devices API is not available in this browser.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  stream.getTracks().forEach((track) => track.stop());
}

export type JoinedAudioState = {
  client: IAgoraRTCClient;
  localAudioTrack: IMicrophoneAudioTrack;
  remoteAudioTrack: IRemoteAudioTrack | null;
};

export type JoinedVideoState = {
  client: IAgoraRTCClient;
  localAudioTrack: IMicrophoneAudioTrack;
  localVideoTrack: ICameraVideoTrack;
  remoteAudioTrack: IRemoteAudioTrack | null;
  remoteVideoTrack: IRemoteVideoTrack | null;
};

export function closeTrackSafely(track: ILocalAudioTrack | ILocalVideoTrack | null | undefined) {
  if (!track) return;
  try {
    track.stop();
    track.close();
  } catch {
    // no-op
  }
}
