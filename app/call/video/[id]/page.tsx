"use client";

import { ArrowLeft, Camera, CameraOff, Mic, PhoneOff, RefreshCcw, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
} from "agora-rtc-sdk-ng";
import { EndSessionConfirmModal } from "@/components/session/EndSessionConfirmModal";
import { useSessionExitGuard } from "@/hooks/useSessionExitGuard";
import {
  cancelSession,
  createSession,
  endSession,
  getSessionAgoraToken,
  getSessionById,
  markSessionMediaReady,
  type SessionRecord,
  type SessionStatus,
} from "@/lib/api/sessions";
import {
  resolveCompanionRouteProfile,
  type CompanionRouteProfile,
} from "@/lib/companionRoutes";
import { buildAgoraUid, createAgoraClient, normalizeChannelName, requestVideoPermission } from "@/lib/agora";
import { isActiveSessionStatus } from "@/lib/sessionStatus";
import { getUserAuthTokenWithRestore } from "@/lib/auth/userAuth";

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim() ?? "";
const TERMINAL_SESSION_STATUSES: SessionStatus[] = ["DECLINED", "CANCELLED", "ENDED", "EXPIRED", "COMPLETED", "FAILED", "FLAGGED"];

function isTerminalStatus(status?: SessionStatus) {
  return Boolean(status && TERMINAL_SESSION_STATUSES.includes(status));
}

function getElapsedSeconds(session: SessionRecord | null, nowMs = Date.now()) {
  const baseTime = session?.liveStartedAt;
  if (!baseTime) return 0;
  const timestamp = new Date(baseTime).getTime();
  if (Number.isNaN(timestamp)) return 0;
  return Math.max(0, Math.floor((nowMs - timestamp) / 1000));
}

function formatTimer(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

type SinkCapableAudioElement = HTMLAudioElement & {
  setSinkId?: (sinkId: string) => Promise<void>;
  sinkId?: string;
};

export default function VideoCallPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const routeId = typeof params?.id === "string" ? params.id : "";
  const preferredCompanionId = searchParams.get("companionId") ?? "";
  const debugCallEnabled = searchParams.get("debugCall") === "1";
  const currentPath = `/call/video/${routeId}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [companion, setCompanion] = useState<CompanionRouteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [localAudioReady, setLocalAudioReady] = useState(false);
  const [localVideoReady, setLocalVideoReady] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [cameraSwitchMessage, setCameraSwitchMessage] = useState("");
  const [audioAssistMessage, setAudioAssistMessage] = useState("");
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [lastSpeakerToggleError, setLastSpeakerToggleError] = useState("");
  const [audioPlaybackAttempted, setAudioPlaybackAttempted] = useState(false);
  const [audioPlaybackError, setAudioPlaybackError] = useState("");
  const [remoteUserCount, setRemoteUserCount] = useState(0);
  const [localAudioPublished, setLocalAudioPublished] = useState(false);
  const [localMicCreated, setLocalMicCreated] = useState(false);
  const [debugChannelName, setDebugChannelName] = useState("");
  const [debugTokenFetched, setDebugTokenFetched] = useState(false);
  const [debugAgoraUid, setDebugAgoraUid] = useState<string | number | null>(null);
  const [debugRemoteUserUids, setDebugRemoteUserUids] = useState<string[]>([]);
  const [debugAudioPublishEvents, setDebugAudioPublishEvents] = useState(0);
  const [debugRemoteAudioSubscribed, setDebugRemoteAudioSubscribed] = useState(false);
  const [setSinkIdSupported, setSetSinkIdSupported] = useState<boolean | null>(() => {
    if (typeof HTMLMediaElement === "undefined") return null;
    return typeof (HTMLMediaElement.prototype as SinkCapableAudioElement).setSinkId === "function";
  });
  const [enumerateDevicesSupported, setEnumerateDevicesSupported] = useState<boolean | null>(null);
  const [audioOutputDeviceCount, setAudioOutputDeviceCount] = useState(0);
  const [audioOutputDevicesDebug, setAudioOutputDevicesDebug] = useState("");
  const [selectedSinkId, setSelectedSinkId] = useState("");
  const [lastOutputSwitchError, setLastOutputSwitchError] = useState("");
  const [browserUserAgent] = useState(() => {
    if (typeof navigator === "undefined") return "unknown";
    return navigator.userAgent || "unknown";
  });
  const [joined, setJoined] = useState(false);
  const [needsPermissionAction, setNeedsPermissionAction] = useState(false);
  const [joining, setJoining] = useState(false);
  const [remoteVideoReady, setRemoteVideoReady] = useState(false);
  const [remoteUserJoined, setRemoteUserJoined] = useState(false);
  const [remoteAudioPublished, setRemoteAudioPublished] = useState(false);
  const [remoteAudioTrackExists, setRemoteAudioTrackExists] = useState(false);
  const [audioPlaybackReady, setAudioPlaybackReady] = useState(false);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const remoteAudioTrackRef = useRef<IRemoteAudioTrack | null>(null);
  const remoteVideoTrackRef = useRef<IRemoteVideoTrack | null>(null);
  const localVideoContainerRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoContainerRef = useRef<HTMLDivElement | null>(null);
  const remoteAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const isPending = session?.status === "PENDING";
  const isCallLive = Boolean(session?.liveStartedAt);
  const elapsedSeconds = isCallLive ? getElapsedSeconds(session, clockNow) : 0;

  const notifyMediaReady = useCallback(async () => {
    if (!session?.id) return;
    const response = await markSessionMediaReady(session.id);
    if (response.data) {
      setSession((current) => (current && current.id === response.data!.id ? response.data : current));
    }
  }, [session]);

  const syncRemoteUsersDebug = useCallback((client: IAgoraRTCClient) => {
    setRemoteUserCount(client.remoteUsers.length);
    setDebugRemoteUserUids(client.remoteUsers.map((user) => String(user.uid ?? "unknown")));
  }, []);

  const refreshAudioOutputDevices = useCallback(async () => {
    if (typeof navigator === "undefined") return [] as MediaDeviceInfo[];
    if (!navigator.mediaDevices?.enumerateDevices) {
      setEnumerateDevicesSupported(false);
      setAudioOutputDeviceCount(0);
      setAudioOutputDevicesDebug("");
      return [] as MediaDeviceInfo[];
    }

    setEnumerateDevicesSupported(true);
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const outputs = devices.filter((device) => device.kind === "audiooutput");
      setAudioOutputDeviceCount(outputs.length);
      setAudioOutputDevicesDebug(
        outputs
          .map((device) => `${device.label || "unknown"} (${device.deviceId || "default"})`)
          .join(" | "),
      );
      return outputs;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to enumerate output devices.";
      setLastOutputSwitchError(message);
      return [] as MediaDeviceInfo[];
    }
  }, []);

  const pickOutputSinkId = useCallback((speakerOn: boolean, outputs: MediaDeviceInfo[]) => {
    if (outputs.length === 0) {
      return "default";
    }

    const normalized = outputs.map((device) => ({
      deviceId: device.deviceId || "default",
      label: (device.label || "").toLowerCase(),
    }));

    if (speakerOn) {
      const preferredSpeaker = normalized.find((device) => /speaker|loud|hands.?free|external|default/.test(device.label));
      return preferredSpeaker?.deviceId || "default";
    }

    const communications = normalized.find((device) => device.deviceId === "communications");
    if (communications) return communications.deviceId;

    const preferredEarpiece = normalized.find((device) => /earpiece|receiver|phone|handset|communication/.test(device.label));
    if (preferredEarpiece) return preferredEarpiece.deviceId;

    return "default";
  }, []);

  const cleanupAgora = useCallback(async () => {
    try {
      remoteAudioTrackRef.current?.stop();
      remoteVideoTrackRef.current?.stop();
    } catch {
      // no-op
    }
    try {
      localAudioTrackRef.current?.stop();
      localAudioTrackRef.current?.close();
      localVideoTrackRef.current?.stop();
      localVideoTrackRef.current?.close();
    } catch {
      // no-op
    }
    localAudioTrackRef.current = null;
    localVideoTrackRef.current = null;
    remoteAudioTrackRef.current = null;
    remoteVideoTrackRef.current = null;
    if (clientRef.current) {
      try {
        clientRef.current.removeAllListeners();
        await clientRef.current.leave();
      } catch {
        // no-op
      }
      clientRef.current = null;
    }
    setJoined(false);
    setLocalAudioReady(false);
    setLocalVideoReady(false);
    setLocalAudioPublished(false);
    setRemoteVideoReady(false);
    setRemoteUserJoined(false);
    setRemoteAudioPublished(false);
    setRemoteAudioTrackExists(false);
    setAudioPlaybackReady(false);
    setAudioPlaybackAttempted(false);
    setAudioPlaybackError("");
    setRemoteUserCount(0);
    setDebugRemoteUserUids([]);
    setDebugAudioPublishEvents(0);
    setDebugRemoteAudioSubscribed(false);
    setSetSinkIdSupported(null);
    setEnumerateDevicesSupported(null);
    setAudioOutputDeviceCount(0);
    setAudioOutputDevicesDebug("");
    setSelectedSinkId("");
    setLastOutputSwitchError("");
    setSpeakerEnabled(false);
    setDebugChannelName("");
    setDebugTokenFetched(false);
    setDebugAgoraUid(null);
    setLocalMicCreated(false);
    setNeedsPermissionAction(false);
  }, []);

  useEffect(() => {
    return () => {
      void cleanupAgora();
    };
  }, [cleanupAgora]);

  useEffect(() => {
    if (!routeId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");

      const token = await getUserAuthTokenWithRestore();
      if (!token) {
        router.replace(`/login?returnUrl=${encodeURIComponent(currentPath)}`);
        return;
      }

      const fetched = await getSessionById(routeId);
      if (!active) return;
      if (fetched.error?.status === 401) {
        router.replace(`/login?returnUrl=${encodeURIComponent(currentPath)}`);
        return;
      }

      if (fetched.data) {
        setSession(fetched.data);
        const resolved = await resolveCompanionRouteProfile(fetched.data.companionId);
        if (!active) return;
        if (resolved) setCompanion(resolved);
        setLoading(false);
        return;
      }

      const companionId = preferredCompanionId || routeId;
      const resolved = await resolveCompanionRouteProfile(companionId);
      if (!active) return;
      if (!resolved) {
        setError("Unable to start video call. Please open the companion profile and try again.");
        setLoading(false);
        return;
      }

      const created = await createSession({ companionId: resolved.id, serviceType: "video" });
      if (!active) return;
      if (created.error?.status === 401) {
        router.replace(`/login?returnUrl=${encodeURIComponent(currentPath)}`);
        return;
      }
      if (created.error || !created.data?.id) {
        setError(created.error?.message || "Unable to create video call request.");
        setCompanion(resolved);
        setLoading(false);
        return;
      }
      if (created.data.id !== routeId) {
        router.replace(`/call/video/${created.data.id}?companionId=${encodeURIComponent(resolved.id)}`);
        return;
      }
      setSession(created.data);
      setCompanion(resolved);
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [currentPath, preferredCompanionId, routeId, router, searchParams]);

  useEffect(() => {
    if (!session?.id) return;
    let cancelled = false;
    const syncSession = async () => {
      const latest = await getSessionById(session.id);
      if (cancelled || !latest.data) return;
      setSession(latest.data);
      if (isTerminalStatus(latest.data.status)) {
        await cleanupAgora();
      }
    };
    const timer = window.setInterval(() => {
      void syncSession();
    }, 2000);
    void syncSession();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [cleanupAgora, session?.id]);

  useEffect(() => {
    if (session?.status !== "LIVE" && session?.status !== "ACCEPTED") return;
    const timer = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session?.status]);

  useEffect(() => {
    if (!isTerminalStatus(session?.status)) return;
    const timer = window.setTimeout(() => {
      router.push("/connect-now");
    }, 900);
    return () => window.clearTimeout(timer);
  }, [router, session?.status]);

  useEffect(() => {
    if (!isTerminalStatus(session?.status)) return;
    const timer = window.setTimeout(() => {
      void cleanupAgora();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [cleanupAgora, session?.status]);

  const playRemoteAudio = useCallback(async (reason: "auto" | "gesture") => {
    const remoteAudioTrack = remoteAudioTrackRef.current;
    if (!remoteAudioTrack) {
      if (reason === "gesture") {
        setAudioAssistMessage("Remote audio is not available yet.");
      }
      return false;
    }
    setAudioPlaybackAttempted(true);
    setAudioPlaybackError("");

    try {
      const audioElement = remoteAudioElementRef.current as SinkCapableAudioElement | null;
      if (audioElement) {
        const supportsSetSinkId = typeof audioElement.setSinkId === "function";
        setSetSinkIdSupported(supportsSetSinkId);
        const mediaTrack = remoteAudioTrack.getMediaStreamTrack?.();
        if (mediaTrack) {
          audioElement.srcObject = new MediaStream([mediaTrack]);
          await audioElement.play();
        } else {
          remoteAudioTrack.play();
        }
      } else {
        remoteAudioTrack.play();
      }
      setAudioPlaybackReady(true);
      setAudioPlaybackError("");
      return true;
    } catch {
      setAudioPlaybackReady(false);
      setAudioPlaybackError("Playback blocked until user interaction.");
      if (reason === "gesture") {
        setAudioAssistMessage("Speaker switching is limited in this browser. Use phone audio controls.");
      }
      return false;
    }
  }, []);

  const applyOutputRoute = useCallback(
    async (speakerOn: boolean) => {
      const audioElement = remoteAudioElementRef.current as SinkCapableAudioElement | null;
      if (!audioElement) {
        return false;
      }

      const supportsSetSinkId = typeof audioElement.setSinkId === "function";
      setSetSinkIdSupported(supportsSetSinkId);
      setLastOutputSwitchError("");

      if (!supportsSetSinkId) {
        if (speakerOn) {
          setAudioAssistMessage("Speaker switching is limited in this browser. Use phone audio controls.");
        } else {
          setAudioAssistMessage("Ear speaker routing is controlled by your browser/device.");
        }
        return false;
      }

      const outputs = await refreshAudioOutputDevices();
      const targetSinkId = pickOutputSinkId(speakerOn, outputs);

      try {
        await audioElement.setSinkId?.(targetSinkId);
        setSelectedSinkId(targetSinkId);
        if (speakerOn) {
          if (targetSinkId === "default") {
            setAudioAssistMessage("Speaker switching depends on available outputs in your browser.");
          } else {
            setAudioAssistMessage("");
          }
        } else if (targetSinkId === "default") {
          setAudioAssistMessage("Ear speaker routing is controlled by your browser/device.");
        } else {
          setAudioAssistMessage("");
        }
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to switch output device.";
        setLastOutputSwitchError(message);
        if (speakerOn) {
          setAudioAssistMessage("Speaker switching is limited in this browser. Use phone audio controls.");
        } else {
          setAudioAssistMessage("Ear speaker routing is controlled by your browser/device.");
        }
        return false;
      }
    },
    [pickOutputSinkId, refreshAudioOutputDevices],
  );

  const toggleMute = useCallback(async () => {
    const audioTrack = localAudioTrackRef.current;
    if (!audioTrack) {
      setError("Microphone is not ready yet.");
      return;
    }
    const nextMuted = !isMuted;
    try {
      await audioTrack.setEnabled(!nextMuted);
      setIsMuted(nextMuted);
    } catch {
      setError("Unable to update microphone state right now.");
    }
  }, [isMuted]);

  const toggleCamera = useCallback(async () => {
    const videoTrack = localVideoTrackRef.current;
    if (!videoTrack) {
      setError("Camera is not ready yet.");
      return;
    }
    const nextCameraOn = !isCameraOn;
    try {
      await videoTrack.setEnabled(nextCameraOn);
      setIsCameraOn(nextCameraOn);
    } catch {
      setError("Unable to update camera state right now.");
    }
  }, [isCameraOn]);

  const handleFlipCamera = useCallback(async () => {
    const client = clientRef.current;
    const currentTrack = localVideoTrackRef.current;
    if (!client || !currentTrack) {
      setCameraSwitchMessage("Camera switch is not available on this device.");
      return;
    }

    try {
      setCameraSwitchMessage("");
      const AgoraRTC = await import("agora-rtc-sdk-ng");
      const cameras = await AgoraRTC.default.getCameras();
      if (!cameras || cameras.length <= 1) {
        setCameraSwitchMessage("Camera switch is not available on this device.");
        return;
      }

      const nextFrontCamera = !isFrontCamera;
      const frontCamera = cameras.find((camera) => /front|user/i.test(camera.label));
      const rearCamera = cameras.find((camera) => /back|rear|environment/i.test(camera.label));
      const preferredCamera = nextFrontCamera ? frontCamera : rearCamera;

      const mediaTrack = currentTrack.getMediaStreamTrack?.();
      const currentDeviceId = mediaTrack?.getSettings?.().deviceId;
      const currentIndex = currentDeviceId ? cameras.findIndex((camera) => camera.deviceId === currentDeviceId) : -1;
      const fallbackCamera =
        currentIndex >= 0 ? cameras[(currentIndex + 1) % cameras.length] : cameras[nextFrontCamera ? 0 : cameras.length - 1];
      const targetCamera = preferredCamera ?? fallbackCamera;

      const setDeviceTrack = currentTrack as ICameraVideoTrack & { setDevice?: (deviceId: string) => Promise<void> };
      if (typeof setDeviceTrack.setDevice === "function") {
        await setDeviceTrack.setDevice(targetCamera.deviceId);
        setIsFrontCamera(nextFrontCamera);
        return;
      }

      await client.unpublish([currentTrack]);
      currentTrack.stop();
      currentTrack.close();

      const replacementTrack = await AgoraRTC.default.createCameraVideoTrack({
        cameraId: targetCamera.deviceId,
      });
      localVideoTrackRef.current = replacementTrack;
      setLocalVideoReady(true);
      await replacementTrack.setEnabled(isCameraOn);
      await client.publish([replacementTrack]);
      if (localVideoContainerRef.current) {
        replacementTrack.play(localVideoContainerRef.current);
      }
      setIsFrontCamera(nextFrontCamera);
    } catch {
      setCameraSwitchMessage("Camera switch is not available on this device.");
    }
  }, [isCameraOn, isFrontCamera]);

  const joinAgoraVideo = useCallback(async () => {
    if (!session || !companion || joining || joined) return;
    setJoining(true);
    setError("");
    try {
      await requestVideoPermission();
      await refreshAudioOutputDevices();
      setNeedsPermissionAction(false);

      const client = await createAgoraClient();
      clientRef.current = client;

      const subscribeRemoteUser = async (user: IAgoraRTCRemoteUser, mediaType?: "audio" | "video") => {
        setRemoteUserJoined(true);
        const shouldSubscribeVideo = (!mediaType || mediaType === "video") && user.hasVideo;
        const shouldSubscribeAudio = (!mediaType || mediaType === "audio") && user.hasAudio;

        if (shouldSubscribeVideo) {
          try {
            await client.subscribe(user, "video");
          } catch {
            // Agora can throw if a repeated sweep hits an already-subscribed track.
          }
          if (user.videoTrack && remoteVideoContainerRef.current) {
            try {
              user.videoTrack.play(remoteVideoContainerRef.current);
              remoteVideoTrackRef.current = user.videoTrack;
              setRemoteVideoReady(true);
            } catch {
              setRemoteVideoReady(false);
            }
          }
        }

        if (shouldSubscribeAudio) {
          try {
            await client.subscribe(user, "audio");
          } catch {
            // Safe to ignore duplicate subscriptions from delayed remote-user sweeps.
          }
          setRemoteAudioPublished(true);
          setDebugRemoteAudioSubscribed(true);
          setRemoteAudioTrackExists(Boolean(user.audioTrack));
          if (user.audioTrack) {
            remoteAudioTrackRef.current = user.audioTrack;
            await notifyMediaReady();
            await playRemoteAudio("auto");
          }
        }
      };

      const sweepRemoteUsers = async () => {
        if (client.remoteUsers.length > 0) setRemoteUserJoined(true);
        syncRemoteUsersDebug(client);
        await Promise.all(client.remoteUsers.map((remoteUser) => subscribeRemoteUser(remoteUser)));
      };

      client.on("user-joined", (user) => {
        setRemoteUserJoined(true);
        syncRemoteUsersDebug(client);
        void subscribeRemoteUser(user);
      });
      client.on("user-published", async (user, mediaType) => {
        syncRemoteUsersDebug(client);
        if (mediaType !== "audio" && mediaType !== "video") return;
        if (mediaType === "audio") {
          setDebugAudioPublishEvents((count) => count + 1);
        }
        await subscribeRemoteUser(user, mediaType);
      });

      client.on("user-unpublished", (_user, mediaType) => {
        syncRemoteUsersDebug(client);
        if (mediaType === "video") {
          setRemoteVideoReady(false);
          remoteVideoTrackRef.current = null;
        }
        if (mediaType === "audio") {
          setRemoteAudioPublished(false);
          setRemoteAudioTrackExists(false);
          setAudioPlaybackReady(false);
          setAudioPlaybackError("Remote user unpublished audio.");
          remoteAudioTrackRef.current = null;
        }
      });

      client.on("user-left", () => {
        syncRemoteUsersDebug(client);
        setRemoteUserJoined(client.remoteUsers.length > 0);
        setRemoteVideoReady(false);
        setRemoteAudioPublished(false);
        setRemoteAudioTrackExists(false);
        setAudioPlaybackReady(false);
        setAudioPlaybackError("Remote user left the call.");
        remoteVideoTrackRef.current = null;
        remoteAudioTrackRef.current = null;
      });

      const tokenResponse = await getSessionAgoraToken(session.id);
      if (tokenResponse.error || !tokenResponse.data?.token) {
        setError(tokenResponse.error?.message || "Could not prepare secure call token. Please retry.");
        await cleanupAgora();
        return;
      }

      const appId = tokenResponse.data.appId || AGORA_APP_ID;
      if (!appId) {
        setError("Calling is not configured. Missing Agora App ID.");
        await cleanupAgora();
        return;
      }
      const channelName = normalizeChannelName(session.id, tokenResponse.data?.channelName ?? session.channelName);
      const uid = tokenResponse.data?.uid ?? buildAgoraUid(session.id, session.userId ?? "user");
      setDebugChannelName(channelName);
      setDebugTokenFetched(true);
      setDebugAgoraUid(uid);

      await client.join(appId, channelName, tokenResponse.data.token, uid);

      const AgoraRTC = await import("agora-rtc-sdk-ng");
      const [localAudioTrack, localVideoTrack] = await AgoraRTC.default.createMicrophoneAndCameraTracks();
      localAudioTrackRef.current = localAudioTrack;
      localVideoTrackRef.current = localVideoTrack;
      setLocalMicCreated(true);
      setLocalAudioReady(true);
      setLocalVideoReady(true);
      await client.publish([localAudioTrack, localVideoTrack]);
      setLocalAudioPublished(true);
      await notifyMediaReady();
      if (localVideoContainerRef.current) {
        localVideoTrack.play(localVideoContainerRef.current);
      }
      await sweepRemoteUsers();
      syncRemoteUsersDebug(client);
      window.setTimeout(() => {
        void sweepRemoteUsers();
      }, 500);
      window.setTimeout(() => {
        void sweepRemoteUsers();
      }, 1500);
      setJoined(true);
    } catch (joinError) {
      const message = joinError instanceof Error ? joinError.message : "Unable to connect video call.";
      if (/permission|denied|notallowed/i.test(message)) {
        setNeedsPermissionAction(true);
        setError("Camera and microphone permission are required for video calls.");
      } else {
        setError(message);
      }
      await cleanupAgora();
    } finally {
      setJoining(false);
    }
  }, [cleanupAgora, companion, joined, joining, notifyMediaReady, playRemoteAudio, refreshAudioOutputDevices, session, syncRemoteUsersDebug]);

  useEffect(() => {
    if ((session?.status !== "LIVE" && session?.status !== "ACCEPTED") || joined || joining) return;
    const timer = window.setTimeout(() => {
      void joinAgoraVideo();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [joinAgoraVideo, joined, joining, session?.status]);

  const handleSpeakerToggle = useCallback(() => {
    const nextSpeakerState = !speakerEnabled;
    setSpeakerEnabled(nextSpeakerState);
    setLastSpeakerToggleError("");
    setLastOutputSwitchError("");

    void applyOutputRoute(nextSpeakerState).then((switched) => {
      if (!switched && nextSpeakerState) {
        setLastSpeakerToggleError("Speaker switching is limited in this browser. Use phone audio controls.");
      }
      if (!switched && !nextSpeakerState) {
        setLastSpeakerToggleError("Ear speaker routing is controlled by your browser/device.");
      }
    });

    void playRemoteAudio("gesture").then((played) => {
      if (!played) {
        setLastSpeakerToggleError("Speaker switching depends on your browser. Use phone audio output/volume controls.");
      }
    });
  }, [applyOutputRoute, playRemoteAudio, speakerEnabled]);

  const handleCancel = async () => {
    if (!session?.id || isCancelling) return;
    setIsCancelling(true);
    let response;
    if (session.status === "PENDING") {
      response = await cancelSession(session.id);
    } else {
      const nowIso = new Date().toISOString();
      const endPromise = endSession(session.id);
      await cleanupAgora();
      setSession((current) => (current ? { ...current, status: "ENDED", endedAt: current.endedAt ?? nowIso } : current));
      response = await endPromise;
    }
    setIsCancelling(false);
    if (response.data) {
      setSession(response.data);
      return;
    }
    setError(response.error?.message || "Unable to cancel request.");
  };

  const handleConfirmEndSession = useCallback(async () => {
    if (!session?.id) return;
    if (isCancelling) throw new Error("Session is already ending.");
    setIsCancelling(true);
    try {
      const responsePromise = endSession(session.id);
      await cleanupAgora();
      const response = await responsePromise;
      if (!response.data) {
        const message = response.error?.message || "Unable to end this session. Please try again.";
        setError(message);
        throw new Error(message);
      }
      setSession(response.data);
    } finally {
      setIsCancelling(false);
    }
  }, [cleanupAgora, isCancelling, session?.id]);

  const navigateAfterExit = useCallback(() => {
    router.push("/connect-now");
  }, [router]);

  const exitGuard = useSessionExitGuard({
    active: isActiveSessionStatus(session?.status),
    onEndSession: handleConfirmEndSession,
    onNavigateAway: navigateAfterExit,
  });

  const exitConfirmModal = (
    <EndSessionConfirmModal
      open={exitGuard.confirmOpen}
      loading={exitGuard.confirmLoading}
      error={exitGuard.confirmError}
      onStay={exitGuard.stay}
      onEndSession={() => {
        void exitGuard.endAndExit();
      }}
    />
  );

  if (loading) {
    return <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#0b1224] p-4 text-white">Opening video call...</main>;
  }

  if (!session || !companion) {
    return (
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#0b1224] p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-semibold text-amber-800">{error || "Video call request is not available."}</p>
          <button
            type="button"
            onClick={() => router.push("/connect-now")}
            className="mt-4 rounded-xl bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Connect
          </button>
        </div>
      </main>
    );
  }

  if (isTerminalStatus(session.status)) {
    return (
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#0b1224] p-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
          <p className="text-base font-semibold">This call has ended.</p>
          <p className="mt-2 text-xs text-cyan-100">Session ended. Redirecting to Connect Now...</p>
          <button
            type="button"
            onClick={() => router.push("/connect-now")}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Connect
          </button>
        </div>
      </main>
    );
  }

  if (!isPending && session.status !== "LIVE" && session.status !== "ACCEPTED") {
    return (
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#0b1224] p-4 text-white">
        {exitConfirmModal}
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
          <p className="text-base font-semibold">This video call is not active right now.</p>
          <button
            type="button"
            onClick={() => router.push("/connect-now")}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Connect
          </button>
        </div>
      </main>
    );
  }

  return (
    <section
      className="relative h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#020617] text-white"
      onClick={() => {
        if (remoteAudioPublished && !audioPlaybackReady) {
          void playRemoteAudio("gesture");
        }
      }}
    >
      {exitConfirmModal}
      <div ref={remoteVideoContainerRef} className="absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/10 to-black/75" />
      <div className="relative z-10 flex h-full flex-col px-3.5 pt-[max(0.8rem,env(safe-area-inset-top))] pb-[max(0.95rem,env(safe-area-inset-bottom))] sm:px-5">
        {needsPermissionAction ? (
          <button
            type="button"
            onClick={() => {
              void joinAgoraVideo();
            }}
            disabled={joining}
            className="mb-3 rounded-xl border border-white/25 bg-black/35 px-3 py-2 text-xs text-cyan-100 disabled:opacity-70"
          >
            {joining ? "Enabling camera & microphone..." : "Enable camera & microphone"}
          </button>
        ) : null}
        {error ? (
          <p className="mb-3 rounded-xl border border-amber-300/80 bg-amber-100/15 px-3 py-2 text-xs text-amber-100">
            {error}
          </p>
        ) : null}
        {cameraSwitchMessage ? (
          <p className="mb-3 rounded-xl border border-slate-200/40 bg-black/25 px-3 py-2 text-xs text-slate-100">
            {cameraSwitchMessage}
          </p>
        ) : null}
        {audioAssistMessage ? (
          <p className="mb-3 rounded-xl border border-slate-200/40 bg-black/25 px-3 py-2 text-xs text-slate-100">
            {audioAssistMessage}
          </p>
        ) : null}
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Back to Connect"
            onClick={exitGuard.requestExit}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1 px-3">
            <p className="truncate text-sm font-semibold">{companion.name}</p>
            <p className="text-xs text-white/75">{formatTimer(elapsedSeconds)}</p>
          </div>
          <span className="rounded-full border border-cyan-300/40 bg-cyan-400/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-100">
            {remoteVideoReady ? "Secure HD" : "Secure"}
          </span>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          {!remoteVideoReady ? (
            <div className="relative z-10 text-center">
              <span className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-white/10 text-2xl font-semibold">
                {companion.name.slice(0, 1).toUpperCase()}
              </span>
              <p className="mt-3 text-xl font-semibold">{companion.name}</p>
              <p className="mt-1 text-sm text-white/80">
                {isPending
                  ? "Ringing..."
                  : remoteVideoReady
                    ? "Connected"
                    : remoteAudioPublished
                      ? audioPlaybackReady
                        ? "Audio connected. Waiting for video..."
                        : "Tap speaker or screen to enable audio"
                      : remoteUserJoined
                        ? "Connected. Waiting for media..."
                        : "Connecting..."}
              </p>
            </div>
          ) : null}

          <div className="absolute right-0 top-5 h-32 w-[120px] overflow-hidden rounded-[20px] border-2 border-white/85 bg-slate-900 shadow-2xl shadow-black/40 sm:w-[138px]">
            {!isCameraOn ? (
              <div className="flex h-full w-full items-center justify-center bg-slate-950/95 text-center">
                <div>
                  <CameraOff size={20} className="mx-auto text-slate-100" />
                  <p className="mt-1 text-[11px] text-slate-100">Camera Off</p>
                </div>
              </div>
            ) : (
              <div ref={localVideoContainerRef} className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
            )}
            <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
              You
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="flex w-full max-w-[540px] items-center justify-center gap-2.5 rounded-full border border-white/15 bg-black/45 px-3 py-2.5 shadow-2xl backdrop-blur">
          <button
            type="button"
            disabled={!localVideoReady || isPending}
            onClick={() => {
              void toggleCamera();
            }}
            className={`inline-flex h-12 w-12 items-center justify-center rounded-full border ${
              isCameraOn ? "border-white/25 bg-white/10 text-white" : "border-red-300/30 bg-red-500/25 text-red-100"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {isCameraOn ? <Camera size={18} /> : <CameraOff size={18} />}
          </button>
          <button
            type="button"
            disabled={!localAudioReady || isPending}
            onClick={() => {
              void toggleMute();
            }}
            className={`inline-flex h-12 w-12 items-center justify-center rounded-full border ${
              isMuted ? "border-amber-300/40 bg-amber-400/25 text-amber-100" : "border-white/25 bg-white/10 text-white"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <Mic size={18} />
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              handleSpeakerToggle();
            }}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-full border px-3 text-xs font-semibold ${
              speakerEnabled ? "border-cyan-300/60 bg-cyan-400/20 text-cyan-100" : "border-white/25 bg-white/10 text-white"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <Volume2 size={16} />
            <span>{speakerEnabled ? "On" : "Off"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              void handleCancel();
            }}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#dc2626] text-white shadow-lg shadow-red-950/35"
          >
            <PhoneOff size={22} />
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              void handleFlipCamera();
            }}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Switch camera"
            title={isFrontCamera ? "Front camera selected" : "Rear camera selected"}
          >
            <RefreshCcw size={18} />
          </button>
          </div>
        </div>
        {debugCallEnabled ? (
          <div className="mt-2 rounded-xl border border-white/20 bg-black/35 p-3 text-xs text-white/85">
            <p>sessionId: {session.id}</p>
            <p>channelName: {debugChannelName || "-"}</p>
            <p>callType: video</p>
            <p>userType: user</p>
            <p>session status: {session.status}</p>
            <p>token fetched: {String(debugTokenFetched)}</p>
            <p>joined: {String(joined)}</p>
            <p>agora uid: {debugAgoraUid ?? "-"}</p>
            <p>local mic created: {String(localMicCreated)}</p>
            <p>local mic published: {String(localAudioPublished)}</p>
            <p>remote user count: {remoteUserCount}</p>
            <p>remote user uids: {debugRemoteUserUids.length > 0 ? debugRemoteUserUids.join(", ") : "-"}</p>
            <p>audio publish event received: {String(debugAudioPublishEvents)}</p>
            <p>remote audio subscribed: {String(debugRemoteAudioSubscribed)}</p>
            <p>remote audio ready: {String(remoteAudioPublished)}</p>
            <p>remote audio track exists: {String(remoteAudioTrackExists)}</p>
            <p>audio playback attempted: {String(audioPlaybackAttempted)}</p>
            <p>audio playback error: {audioPlaybackError || "-"}</p>
            <p>speakerEnabled: {String(speakerEnabled)}</p>
            <p>last speaker toggle error: {lastSpeakerToggleError || "-"}</p>
            <p>setSinkId supported: {setSinkIdSupported == null ? "unknown" : String(setSinkIdSupported)}</p>
            <p>enumerateDevices supported: {enumerateDevicesSupported == null ? "unknown" : String(enumerateDevicesSupported)}</p>
            <p>audiooutput devices count: {audioOutputDeviceCount}</p>
            <p>audiooutput devices: {audioOutputDevicesDebug || "-"}</p>
            <p>selectedSinkId: {selectedSinkId || "-"}</p>
            <p>last output switch error: {lastOutputSwitchError || "-"}</p>
            <p>userAgent: {browserUserAgent || "-"}</p>
          </div>
        ) : null}
      </div>
      <audio
        ref={remoteAudioElementRef}
        className="hidden"
        autoPlay
        playsInline
        onPlay={() => {
          setAudioPlaybackReady(true);
          setAudioPlaybackError("");
        }}
        onError={() => {
          setAudioPlaybackReady(false);
          setAudioPlaybackError("Audio element playback failed.");
        }}
      />
    </section>
  );
}
