"use client";

import { ArrowLeft, Lock, Mic, PhoneOff, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { IAgoraRTCClient, IAgoraRTCRemoteUser, IMicrophoneAudioTrack, IRemoteAudioTrack } from "agora-rtc-sdk-ng";
import { CallBrowserWarning } from "@/components/call/CallBrowserWarning";
import { EndSessionConfirmModal } from "@/components/session/EndSessionConfirmModal";
import { useCallPageResilience } from "@/hooks/useCallPageResilience";
import { useLoopingRingtone } from "@/hooks/useLoopingRingtone";
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
import { resolveCompanionRouteProfile, type CompanionRouteProfile } from "@/lib/companionRoutes";
import {
  buildAgoraUid,
  createAgoraClient,
  getMediaDeviceErrorMessage,
  normalizeChannelName,
  renewAgoraSessionToken,
  shouldRejoinAgora,
} from "@/lib/agora";
import { getUserAuthTokenWithRestore } from "@/lib/auth/userAuth";
import { isActiveSessionStatus } from "@/lib/sessionStatus";
import { VerifiedPartnerBadge } from "@/components/VerifiedPartnerBadge";

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim() ?? "";
const TERMINAL_SESSION_STATUSES: SessionStatus[] = ["DECLINED", "CANCELLED", "ENDED", "EXPIRED", "COMPLETED", "FAILED", "FLAGGED"];
const FREE_CALL_TIME_OVER_MESSAGE = "Your free call time is over. Please add money to continue.";
const SESSION_TIME_OVER_MESSAGE = "Your available balance is over. Please add money to continue.";

function isTerminalStatus(status?: SessionStatus) {
  return Boolean(status && TERMINAL_SESSION_STATUSES.includes(status));
}

function getElapsedSeconds(baseTimeIso: string | null | undefined, nowMs = Date.now()) {
  if (!baseTimeIso) return 0;
  const timestamp = new Date(baseTimeIso).getTime();
  if (Number.isNaN(timestamp)) return 0;
  return Math.max(0, Math.floor((nowMs - timestamp) / 1000));
}

function toLoginUrl(returnUrl: string) {
  return `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
}

type SinkCapableAudioElement = HTMLAudioElement & {
  setSinkId?: (sinkId: string) => Promise<void>;
  sinkId?: string;
};

export default function AudioCallPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const routeId = typeof params?.id === "string" ? params.id : "";
  const preferredCompanionId = searchParams.get("companionId") ?? "";
  const debugCallEnabled = searchParams.get("debugCall") === "1";
  const currentPath = `/call/audio/${routeId}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const [session, setSession] = useState<SessionRecord | null>(null);
  const [companion, setCompanion] = useState<CompanionRouteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [sessionEndNotice, setSessionEndNotice] = useState("");
  const [clockNow, setClockNow] = useState(() => Date.now());

  const [isMuted, setIsMuted] = useState(false);
  const [localAudioReady, setLocalAudioReady] = useState(false);
  const [localAudioPublished, setLocalAudioPublished] = useState(false);
  const [localJoinStartedAt, setLocalJoinStartedAt] = useState<string | null>(null);

  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [needsPermissionAction, setNeedsPermissionAction] = useState(false);

  const [remoteAudioReady, setRemoteAudioReady] = useState(false);
  const [remoteAudioPublished, setRemoteAudioPublished] = useState(false);
  const [remoteAudioTrackExists, setRemoteAudioTrackExists] = useState(false);
  const [audioPlaybackReady, setAudioPlaybackReady] = useState(false);
  const [audioPlaybackAttempted, setAudioPlaybackAttempted] = useState(false);
  const [audioPlaybackError, setAudioPlaybackError] = useState("");
  const [remoteUserCount, setRemoteUserCount] = useState(0);

  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [speakerMessage, setSpeakerMessage] = useState("");
  const [lastSpeakerToggleError, setLastSpeakerToggleError] = useState("");
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

  const [debugChannelName, setDebugChannelName] = useState("");
  const [debugTokenFetched, setDebugTokenFetched] = useState(false);
  const [debugAgoraUid, setDebugAgoraUid] = useState<string | number | null>(null);
  const [debugRemoteUserUids, setDebugRemoteUserUids] = useState<string[]>([]);
  const [debugAudioPublishEvents, setDebugAudioPublishEvents] = useState(0);
  const [debugRemoteAudioSubscribed, setDebugRemoteAudioSubscribed] = useState(false);
  const [debugLocalMicCreated, setDebugLocalMicCreated] = useState(false);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const remoteAudioTrackRef = useRef<IRemoteAudioTrack | null>(null);
  const remoteAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const autoEndedRewardRef = useRef(false);
  const joinedRef = useRef(false);
  const joiningRef = useRef(false);
  const reconnectingRef = useRef(false);
  const renewingTokenRef = useRef(false);
  const endingRef = useRef(false);

  const isPending = session?.status === "PENDING";
  const isActive = session?.status === "LIVE" || session?.status === "ACCEPTED";
  useLoopingRingtone({ enabled: isPending, kind: "ringback", volume: 0.06 });
  const callTimerBase =
    session?.liveStartedAt ??
    (session?.status === "LIVE" ? session?.startedAt : null) ??
    (isActive && localAudioPublished ? localJoinStartedAt : null);
  const elapsedSeconds = getElapsedSeconds(callTimerBase, clockNow);
  const prepaidMaxAllowedSeconds =
    session?.billingLimit?.maxAllowedSeconds ??
    (session?.reward?.shouldAutoEndAtFreeLimit ? session.reward.freeSeconds : null);
  const sessionLimitMessage =
    session?.reward?.appliedRewardType === "FREE_CALL_MINUTES" && session.reward.shouldAutoEndAtFreeLimit
      ? FREE_CALL_TIME_OVER_MESSAGE
      : SESSION_TIME_OVER_MESSAGE;
  const prepaidWarningAtSeconds =
    prepaidMaxAllowedSeconds && prepaidMaxAllowedSeconds > 0
      ? session?.billingLimit?.warningAtSeconds ?? Math.max(0, prepaidMaxAllowedSeconds - 30)
      : null;
  const balanceWarning =
    isActive &&
    prepaidMaxAllowedSeconds &&
    prepaidWarningAtSeconds !== null &&
    elapsedSeconds >= prepaidWarningAtSeconds &&
    elapsedSeconds < prepaidMaxAllowedSeconds
      ? "Your balance is almost over. Add money to continue."
      : "";

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

  const notifyMediaReady = useCallback(async () => {
    if (!session?.id) return;
    const response = await markSessionMediaReady(session.id);
    if (response.data) {
      setSession((current) => (current && current.id === response.data!.id ? response.data : current));
    }
  }, [session]);

  const cleanupAgora = useCallback(async () => {
    joinedRef.current = false;
    joiningRef.current = false;
    try {
      remoteAudioTrackRef.current?.stop();
    } catch {
      // no-op
    }
    try {
      localAudioTrackRef.current?.stop();
      localAudioTrackRef.current?.close();
    } catch {
      // no-op
    }

    localAudioTrackRef.current = null;
    remoteAudioTrackRef.current = null;

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
    setJoining(false);
    setLocalAudioReady(false);
    setLocalAudioPublished(false);
    setLocalJoinStartedAt(null);
    setDebugLocalMicCreated(false);

    setRemoteAudioReady(false);
    setRemoteAudioPublished(false);
    setRemoteAudioTrackExists(false);
    setAudioPlaybackReady(false);
    setAudioPlaybackAttempted(false);
    setAudioPlaybackError("");
    setRemoteUserCount(0);
    setDebugRemoteUserUids([]);
    setDebugRemoteAudioSubscribed(false);
    setDebugAudioPublishEvents(0);

    setSpeakerEnabled(false);
    setSpeakerMessage("");
    setLastSpeakerToggleError("");
    setSetSinkIdSupported(null);
    setSelectedSinkId("");
    setAudioOutputDeviceCount(0);
    setAudioOutputDevicesDebug("");
    setLastOutputSwitchError("");

    setDebugTokenFetched(false);
    setDebugChannelName("");
    setDebugAgoraUid(null);
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
        router.replace(toLoginUrl(currentPath));
        return;
      }

      const fetched = await getSessionById(routeId);
      if (!active) return;

      if (fetched.error?.status === 401) {
        router.replace(toLoginUrl(currentPath));
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
        setError("Unable to start audio call. Please open the companion profile and try again.");
        setLoading(false);
        return;
      }

      const created = await createSession({ companionId: resolved.id, serviceType: "audio" });
      if (!active) return;
      if (created.error?.status === 401) {
        router.replace(toLoginUrl(currentPath));
        return;
      }
      if (created.error || !created.data?.id) {
        setError(created.error?.message || "Unable to create audio call request.");
        setCompanion(resolved);
        setLoading(false);
        return;
      }
      if (created.data.id !== routeId) {
        router.replace(`/call/audio/${created.data.id}?companionId=${encodeURIComponent(resolved.id)}`);
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
    if (!isActive) return;
    const timer = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isActive]);

  useEffect(() => {
    if (!isTerminalStatus(session?.status)) return;
    const timer = window.setTimeout(() => {
      router.push("/connect-now");
    }, 900);
    return () => window.clearTimeout(timer);
  }, [router, session?.status]);

  useEffect(() => {
    if (!localAudioTrackRef.current) return;
    void localAudioTrackRef.current.setEnabled(!isMuted);
  }, [isMuted]);

  const replayRemoteAudio = useCallback(
    async (reason: "auto" | "gesture") => {
      const remoteTrack = remoteAudioTrackRef.current;
      if (!remoteTrack) {
        if (reason === "gesture") {
          setSpeakerMessage("Remote audio is not available yet.");
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

          const mediaTrack = remoteTrack.getMediaStreamTrack?.();
          if (mediaTrack) {
            audioElement.srcObject = new MediaStream([mediaTrack]);
            await audioElement.play();
          } else {
            remoteTrack.play();
          }
        } else {
          remoteTrack.play();
        }

        setAudioPlaybackReady(true);
        setRemoteAudioReady(true);
        return true;
      } catch {
        setAudioPlaybackReady(false);
        setAudioPlaybackError("Playback blocked until user interaction.");
        if (reason === "gesture") {
          setSpeakerMessage("Speaker switching depends on your browser. Use phone volume/output controls.");
        }
        return false;
      }
    },
    [],
  );

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
          setSpeakerMessage("Speaker switching is limited in this browser. Use phone audio controls.");
        } else {
          setSpeakerMessage("Ear speaker routing is controlled by your browser/device.");
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
            setSpeakerMessage("Speaker switching depends on available outputs in your browser.");
          } else {
            setSpeakerMessage("");
          }
        } else if (targetSinkId === "default") {
          setSpeakerMessage("Ear speaker routing is controlled by your browser/device.");
        } else {
          setSpeakerMessage("");
        }
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to switch output device.";
        setLastOutputSwitchError(message);
        if (speakerOn) {
          setSpeakerMessage("Speaker switching is limited in this browser. Use phone audio controls.");
        } else {
          setSpeakerMessage("Ear speaker routing is controlled by your browser/device.");
        }
        return false;
      }
    },
    [pickOutputSinkId, refreshAudioOutputDevices],
  );

  const subscribeRemoteAudioUser = useCallback(
    async (client: IAgoraRTCClient, user: IAgoraRTCRemoteUser) => {
      if (!user.hasAudio && !user.audioTrack) return;

      try {
        await client.subscribe(user, "audio");
      } catch {
        // Repeated publish/foreground sweeps can hit an already-subscribed track.
      }
      const latestUser = client.remoteUsers.find((item) => String(item.uid) === String(user.uid));
      const track = latestUser?.audioTrack ?? user.audioTrack ?? null;

      setRemoteAudioPublished(true);
      setDebugRemoteAudioSubscribed(true);
      setRemoteAudioTrackExists(Boolean(track));

      if (track) {
        remoteAudioTrackRef.current = track;
        setRemoteAudioReady(true);
        await notifyMediaReady();
        await replayRemoteAudio("auto");
      }
    },
    [notifyMediaReady, replayRemoteAudio],
  );

  const joinAgoraAudio = useCallback(async () => {
    if (!session || !companion || joiningRef.current || joinedRef.current || endingRef.current || !isActive) return;

    joiningRef.current = true;
    setJoining(true);
    setError("");

    try {
      await refreshAudioOutputDevices();
      setNeedsPermissionAction(false);

      const client = await createAgoraClient();
      clientRef.current = client;

      client.on("user-joined", (user) => {
        syncRemoteUsersDebug(client);
        if (user.hasAudio || user.audioTrack) {
          void subscribeRemoteAudioUser(client, user);
        }
      });

      client.on("user-published", async (user, mediaType) => {
        syncRemoteUsersDebug(client);
        if (mediaType !== "audio") return;
        setDebugAudioPublishEvents((count) => count + 1);
        await subscribeRemoteAudioUser(client, user);
      });

      client.on("user-unpublished", (user, mediaType) => {
        syncRemoteUsersDebug(client);
        if (mediaType !== "audio") return;
        void user;
        remoteAudioTrackRef.current = null;
        setRemoteAudioReady(false);
        setRemoteAudioPublished(false);
        setRemoteAudioTrackExists(false);
        setAudioPlaybackReady(false);
      });

      client.on("user-left", () => {
        syncRemoteUsersDebug(client);
        remoteAudioTrackRef.current = null;
        setRemoteAudioReady(false);
        setRemoteAudioPublished(false);
        setRemoteAudioTrackExists(false);
        setAudioPlaybackReady(false);
      });

      client.on("connection-state-change", (state, previousState) => {
        if (state === "RECONNECTING") {
          setError("Call connection interrupted. Reconnecting...");
          return;
        }
        if (state === "CONNECTED" && previousState === "RECONNECTING") {
          setError("");
          void replayRemoteAudio("auto");
          return;
        }
        if (shouldRejoinAgora(state) && previousState !== "DISCONNECTING" && document.visibilityState === "visible") {
          setError("Call connection was lost. Rejoining...");
          void cleanupAgora();
        }
      });

      client.on("token-privilege-will-expire", () => {
        if (renewingTokenRef.current) return;
        renewingTokenRef.current = true;
        void renewAgoraSessionToken(client, session.id)
          .catch(() => {
            setError("Secure call token refresh failed. Reconnecting...");
            void cleanupAgora();
          })
          .finally(() => {
            renewingTokenRef.current = false;
          });
      });

      client.on("token-privilege-did-expire", () => {
        setError("Secure call token expired. Reconnecting...");
        void cleanupAgora();
      });

      const tokenResponse = await getSessionAgoraToken(session.id);
      if (tokenResponse.error || !tokenResponse.data?.token) {
        setError(tokenResponse.error?.message || "Could not prepare secure call token. Please retry.");
        await cleanupAgora();
        return;
      }

      setDebugTokenFetched(true);

      const appId = tokenResponse.data.appId || AGORA_APP_ID;
      if (!appId) {
        setError("Calling is not configured. Missing Agora App ID.");
        await cleanupAgora();
        return;
      }

      const channelName = normalizeChannelName(session.id, tokenResponse.data.channelName ?? session.channelName);
      const uid = tokenResponse.data.uid ?? buildAgoraUid(session.id, session.userId ?? "user");
      setDebugChannelName(channelName);
      setDebugAgoraUid(uid);

      await client.join(appId, channelName, tokenResponse.data.token, uid);
      joinedRef.current = true;
      setJoined(true);
      syncRemoteUsersDebug(client);

      const AgoraRTC = await import("agora-rtc-sdk-ng");
      const localAudioTrack = await AgoraRTC.default.createMicrophoneAudioTrack();
      localAudioTrackRef.current = localAudioTrack;
      localAudioTrack.on("track-ended", () => {
        setNeedsPermissionAction(true);
        setError("Microphone stopped. Tap Enable microphone to reconnect it.");
        void cleanupAgora();
      });
      setDebugLocalMicCreated(true);
      setLocalAudioReady(true);

      await client.publish([localAudioTrack]);
      setLocalAudioPublished(true);
      setLocalJoinStartedAt(new Date().toISOString());
      await notifyMediaReady();

      await Promise.all(client.remoteUsers.map(async (remoteUser) => subscribeRemoteAudioUser(client, remoteUser)));
      syncRemoteUsersDebug(client);
    } catch (joinError) {
      const message = getMediaDeviceErrorMessage(joinError, "audio");
      await cleanupAgora();
      setNeedsPermissionAction(/permission|required|busy|unavailable|microphone/i.test(message));
      setError(message);
    } finally {
      joiningRef.current = false;
      setJoining(false);
    }
  }, [cleanupAgora, companion, isActive, notifyMediaReady, refreshAudioOutputDevices, replayRemoteAudio, session, subscribeRemoteAudioUser, syncRemoteUsersDebug]);

  useEffect(() => {
    if (!isActive || joined || joining || needsPermissionAction) return;
    const timer = window.setTimeout(() => {
      void joinAgoraAudio();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [isActive, joinAgoraAudio, joined, joining, needsPermissionAction]);

  const recoverForegroundAudio = useCallback(async () => {
    if (needsPermissionAction || endingRef.current) return;
    const client = clientRef.current;
    const localTrackEnded = localAudioTrackRef.current?.getMediaStreamTrack?.().readyState === "ended";
    if (!client || shouldRejoinAgora(client.connectionState) || localTrackEnded) {
      if (reconnectingRef.current) return;
      reconnectingRef.current = true;
      setError("Restoring call after returning to the screen...");
      await cleanupAgora();
      reconnectingRef.current = false;
      return;
    }
    if (client.connectionState === "CONNECTED") {
      await Promise.all(
        client.remoteUsers.map(async (remoteUser) => {
          if (!remoteUser.hasAudio && !remoteUser.audioTrack) return;
          await subscribeRemoteAudioUser(client, remoteUser);
        }),
      );
      await replayRemoteAudio("auto");
      setError("");
    }
  }, [cleanupAgora, needsPermissionAction, replayRemoteAudio, subscribeRemoteAudioUser]);

  useCallPageResilience({
    active: isActive,
    onForeground: recoverForegroundAudio,
  });

  const toggleMute = useCallback(async () => {
    const track = localAudioTrackRef.current;
    if (!track) {
      setError("Microphone is not ready yet.");
      return;
    }
    const nextMuted = !isMuted;
    try {
      await track.setEnabled(!nextMuted);
      setIsMuted(nextMuted);
    } catch {
      setError("Unable to update microphone state right now.");
    }
  }, [isMuted]);

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

    void replayRemoteAudio("gesture").then((played) => {
      if (!played) {
        setLastSpeakerToggleError("Speaker switching depends on your browser. Use phone audio output/volume controls.");
      }
    });
  }, [applyOutputRoute, replayRemoteAudio, speakerEnabled]);

  const handleCancel = async () => {
    if (!session?.id || isCancelling || endingRef.current) return;
    endingRef.current = true;
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
    endingRef.current = false;
    setError(response.error?.message || "Unable to cancel request.");
  };

  const handleConfirmEndSession = useCallback(async () => {
    if (!session?.id) return;
    if (isCancelling || endingRef.current) throw new Error("Session is already ending.");
    endingRef.current = true;
    setIsCancelling(true);
    try {
      const responsePromise = endSession(session.id);
      await cleanupAgora();
      const response = await responsePromise;
      if (!response.data) {
        endingRef.current = false;
        const message = response.error?.message || "Unable to end this session. Please try again.";
        setError(message);
        throw new Error(message);
      }
      setSession(response.data);
    } finally {
      setIsCancelling(false);
    }
  }, [cleanupAgora, isCancelling, session?.id]);

  useEffect(() => {
    const maxAllowedSeconds =
      session?.billingLimit?.maxAllowedSeconds ??
      (session?.reward?.shouldAutoEndAtFreeLimit ? session.reward.freeSeconds : null);
    if (!session?.id || !isActive || !maxAllowedSeconds || isCancelling) return;

    if (elapsedSeconds < maxAllowedSeconds || autoEndedRewardRef.current) return;

    autoEndedRewardRef.current = true;
    endingRef.current = true;
    setSessionEndNotice(sessionLimitMessage);
    setIsCancelling(true);

    void (async () => {
      try {
        const responsePromise = endSession(session.id);
        await cleanupAgora();
        const response = await responsePromise;
        if (response.data) {
          setSession(response.data);
          return;
        }
        endingRef.current = false;
        setError(response.error?.message || sessionLimitMessage);
      } finally {
        setIsCancelling(false);
      }
    })();
  }, [
    cleanupAgora,
    elapsedSeconds,
    isActive,
    isCancelling,
    session?.billingLimit?.maxAllowedSeconds,
    session?.id,
    session?.reward?.appliedRewardType,
    session?.reward?.freeSeconds,
    session?.reward?.shouldAutoEndAtFreeLimit,
    sessionLimitMessage,
  ]);

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
    return <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#0f1d4d] p-4 text-white">Opening audio call...</main>;
  }

  if (!session || !companion) {
    return (
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#0f1d4d] p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-semibold text-amber-800">{error || "Audio call request is not available."}</p>
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
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#0f1d4d] p-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
          <p className="text-base font-semibold">This call has ended.</p>
          <p className="mt-2 text-xs text-cyan-100">
            {sessionEndNotice || "Session ended. Redirecting to Connect Now..."}
          </p>
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

  if (!isPending && !isActive) {
    return (
      <main className="flex h-[100dvh] min-h-[100dvh] items-center justify-center bg-[#0f1d4d] p-4 text-white">
        {exitConfirmModal}
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-center">
          <p className="text-base font-semibold">This audio call is not active right now.</p>
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
      className="relative h-[100dvh] min-h-[100dvh] overflow-hidden bg-gradient-to-b from-[#f3fbf9] via-[#e8f6f3] to-[#d9efea] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] text-[#0f172a] sm:px-6"
      onClick={() => {
        if (remoteAudioPublished && !audioPlaybackReady) {
          void replayRemoteAudio("gesture");
        }
      }}
    >
      {exitConfirmModal}
      <div className="mx-auto flex h-full w-full max-w-xl flex-col">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Go back"
            onClick={exitGuard.requestExit}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#cde8e2] bg-white/70 text-[#0f172a] transition hover:bg-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="rounded-full border border-[#b7dfd7] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#0f766e]">
            YoPartner Secure Call
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#d6f3ed] px-2.5 py-1 text-[11px] font-semibold text-[#0f766e]">
            <Lock size={12} />
            Secure
          </span>
        </div>

        {needsPermissionAction ? (
          <button
            type="button"
            onClick={() => {
              void joinAgoraAudio();
            }}
            disabled={joining}
            className="mt-4 rounded-xl border border-[#b7dfd7] bg-white/80 px-3 py-2 text-xs text-[#0f766e] disabled:opacity-70"
          >
            {joining ? "Enabling microphone..." : "Enable microphone"}
          </button>
        ) : null}

        <div className="mt-3">
          <CallBrowserWarning />
        </div>

        {error ? <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">{error}</p> : null}

        {balanceWarning ? (
          <p className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-700">
            {balanceWarning}
          </p>
        ) : null}

        {speakerMessage ? (
          <p className="mt-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-600">{speakerMessage}</p>
        ) : null}

        <div className="mt-6 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-[#0f766e]">Audio Call</p>
          <h1 className="mt-2 flex min-w-0 items-center justify-center gap-2 text-[28px] font-semibold leading-tight text-[#0f172a]">
            <span className="min-w-0 truncate">{companion.name}</span>
            {companion.isVerifiedPartner ? <VerifiedPartnerBadge size="md" /> : null}
          </h1>
          <p className="mt-2 text-base text-[#334155]">
            {isPending
              ? "Ringing..."
              : remoteAudioPublished
                ? audioPlaybackReady
                  ? "Audio connected"
                  : "Tap speaker or screen to enable audio"
                : joined
                  ? "Connecting audio..."
                  : "Connecting..."}
          </p>
          <p className="mt-1 text-[30px] font-semibold tabular-nums text-[#0f172a]">
            {String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:{String(elapsedSeconds % 60).padStart(2, "0")}
          </p>
        </div>

        <div className="relative mt-6 flex flex-1 items-center justify-center">
          <span className="absolute h-[280px] w-[280px] rounded-full bg-[#0f766e]/8" />
          <span className="absolute h-[240px] w-[240px] rounded-full border border-[#b7dfd7]" />
          {remoteAudioReady ? <span className="absolute h-[220px] w-[220px] animate-pulse rounded-full border border-[#7dcfbe]/60" /> : null}
          {companion.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={companion.image} alt={companion.name} className="relative h-48 w-48 rounded-full border-4 border-white object-cover shadow-[0_22px_45px_rgba(15,23,42,0.18)]" />
          ) : (
            <span className="relative inline-flex h-48 w-48 items-center justify-center rounded-full border-4 border-white bg-[#d6f3ed] text-4xl font-semibold text-[#0f766e] shadow-[0_22px_45px_rgba(15,23,42,0.18)]">
              {companion.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>

        {remoteAudioPublished && !audioPlaybackReady && !isPending ? (
          <button
            type="button"
            onClick={() => {
              void replayRemoteAudio("gesture");
            }}
            className="mt-2 self-center rounded-full border border-[#b7dfd7] bg-white px-3 py-1.5 text-xs font-semibold text-[#0f766e]"
          >
            Tap to enable call audio
          </button>
        ) : null}

        <div className="pb-2 pt-4">
          <div className="rounded-[28px] border border-[#cde8e2] bg-white/80 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="flex w-full flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                disabled={!localAudioReady || isPending}
                onClick={() => {
                  void toggleMute();
                }}
                className={`inline-flex h-14 w-14 items-center justify-center rounded-full border ${
                  isMuted ? "border-[#0d9488] bg-[#d6f3ed] text-[#0f766e]" : "border-[#cfe7e2] bg-white text-[#334155]"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <Mic size={20} />
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={handleSpeakerToggle}
                className={`inline-flex h-14 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold ${
                  speakerEnabled ? "border-[#0d9488] bg-[#d6f3ed] text-[#0f766e]" : "border-[#cfe7e2] bg-white text-[#334155]"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <Volume2 size={20} />
                <span>{speakerEnabled ? "Speaker On" : "Speaker Off"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  void handleCancel();
                }}
                className="inline-flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#dc2626] text-white shadow-lg shadow-red-700/25 transition hover:bg-red-500"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          </div>
        </div>

        {debugCallEnabled ? (
          <div className="mt-2 rounded-xl border border-slate-300 bg-white/80 p-3 text-xs text-slate-700">
            <p>sessionId: {session.id}</p>
            <p>channelName: {debugChannelName || "-"}</p>
            <p>callType: audio</p>
            <p>userType: user</p>
            <p>session status: {session.status}</p>
            <p>token fetched: {String(debugTokenFetched)}</p>
            <p>agora joined: {String(joined)}</p>
            <p>agora uid: {debugAgoraUid ?? "-"}</p>
            <p>local mic created: {String(debugLocalMicCreated)}</p>
            <p>local mic published: {String(localAudioPublished)}</p>
            <p>remote user count: {remoteUserCount}</p>
            <p>remote user uids: {debugRemoteUserUids.length > 0 ? debugRemoteUserUids.join(", ") : "-"}</p>
            <p>audio publish event received: {String(debugAudioPublishEvents)}</p>
            <p>remote audio subscribed: {String(debugRemoteAudioSubscribed)}</p>
            <p>remote audio ready: {String(remoteAudioReady)}</p>
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
