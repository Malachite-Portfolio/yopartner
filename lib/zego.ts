"use client";

import type { ZegoExpressEngine as ZegoExpressEngineType } from "zego-express-engine-webrtc";

export type ZegoMediaType = "audio" | "video";

type EventName = "user-joined" | "user-published" | "user-unpublished" | "user-left";
type EventHandler = (user: ZegoRemoteUser, mediaType?: ZegoMediaType) => void | Promise<void>;

class ZegoTrack {
  private elements = new Set<HTMLMediaElement>();

  constructor(
    private readonly track: MediaStreamTrack,
    private readonly kind: ZegoMediaType,
  ) {}

  getMediaStreamTrack() {
    return this.track;
  }

  async setEnabled(enabled: boolean) {
    this.track.enabled = enabled;
  }

  async setDevice(deviceId: string) {
    if (this.kind !== "video") return;
    await this.track.applyConstraints({ deviceId: { exact: deviceId } });
  }

  play(target?: HTMLElement) {
    const element = document.createElement(this.kind === "video" ? "video" : "audio");
    element.autoplay = true;
    if (this.kind === "video") {
      (element as HTMLVideoElement).playsInline = true;
      element.muted = true;
      element.style.width = "100%";
      element.style.height = "100%";
      element.style.objectFit = "cover";
    } else {
      element.style.display = "none";
    }
    element.srcObject = new MediaStream([this.track]);
    (target ?? document.body).appendChild(element);
    this.elements.add(element);
    void element.play().catch(() => undefined);
  }

  stop() {
    for (const element of this.elements) {
      element.pause();
      element.srcObject = null;
      element.remove();
    }
    this.elements.clear();
  }

  close() {
    this.stop();
    this.track.stop();
  }
}

export type ZegoMicrophoneAudioTrack = ZegoTrack;
export type ZegoCameraVideoTrack = ZegoTrack;
export type ZegoRemoteAudioTrack = ZegoTrack;
export type ZegoRemoteVideoTrack = ZegoTrack;

export type ZegoRemoteUser = {
  uid: string;
  streamId: string;
  hasAudio: boolean;
  hasVideo: boolean;
  audioTrack?: ZegoRemoteAudioTrack;
  videoTrack?: ZegoRemoteVideoTrack;
};

export class ZegoRtcClient {
  remoteUsers: ZegoRemoteUser[] = [];
  private engine: ZegoExpressEngineType | null = null;
  private handlers = new Map<EventName, Set<EventHandler>>();
  private roomId = "";
  private userId = "";
  private streamId = "";
  private localTracks: ZegoTrack[] = [];

  on(event: EventName, handler: EventHandler) {
    const handlers = this.handlers.get(event) ?? new Set<EventHandler>();
    handlers.add(handler);
    this.handlers.set(event, handlers);
  }

  removeAllListeners() {
    this.handlers.clear();
  }

  private emit(event: EventName, user: ZegoRemoteUser, mediaType?: ZegoMediaType) {
    for (const handler of this.handlers.get(event) ?? []) void handler(user, mediaType);
  }

  async join(appId: number, roomId: string, token: string, userId: string, userName = "YoPartner") {
    const { ZegoExpressEngine } = await import("zego-express-engine-webrtc");
    this.engine = new ZegoExpressEngine(appId, `wss://webliveroom${appId}-api.zegocloud.com/ws`);
    this.roomId = roomId;
    this.userId = userId;
    this.streamId = `stream_${userId}`;
    this.engine.on("roomStreamUpdate", async (_roomID, updateType, streamList) => {
      if (updateType === "ADD") {
        for (const streamInfo of streamList) {
          if (streamInfo.user.userID === this.userId) continue;
          const stream = await this.engine!.startPlayingStream(streamInfo.streamID);
          const audio = stream.getAudioTracks()[0];
          const video = stream.getVideoTracks()[0];
          const user: ZegoRemoteUser = {
            uid: streamInfo.user.userID,
            streamId: streamInfo.streamID,
            hasAudio: Boolean(audio),
            hasVideo: Boolean(video),
            audioTrack: audio ? new ZegoTrack(audio, "audio") : undefined,
            videoTrack: video ? new ZegoTrack(video, "video") : undefined,
          };
          this.remoteUsers = this.remoteUsers.filter((item) => item.streamId !== user.streamId).concat(user);
          this.emit("user-joined", user);
          if (user.hasAudio) this.emit("user-published", user, "audio");
          if (user.hasVideo) this.emit("user-published", user, "video");
        }
      } else {
        for (const streamInfo of streamList) {
          const user = this.remoteUsers.find((item) => item.streamId === streamInfo.streamID);
          if (!user) continue;
          if (user.hasAudio) this.emit("user-unpublished", user, "audio");
          if (user.hasVideo) this.emit("user-unpublished", user, "video");
          this.engine?.stopPlayingStream(streamInfo.streamID);
          this.remoteUsers = this.remoteUsers.filter((item) => item.streamId !== streamInfo.streamID);
          this.emit("user-left", user);
        }
      }
    });
    const loggedIn = await this.engine.loginRoom(roomId, token, { userID: userId, userName }, { userUpdate: true });
    if (!loggedIn) throw new Error("ZEGOCLOUD room login failed.");
    return userId;
  }

  async publish(tracks: ZegoTrack[]) {
    if (!this.engine) throw new Error("ZEGOCLOUD is not initialized.");
    for (const track of tracks) {
      this.localTracks = this.localTracks.filter(
        (existing) => existing.getMediaStreamTrack().kind !== track.getMediaStreamTrack().kind,
      );
      this.localTracks.push(track);
    }
    this.engine.stopPublishingStream(this.streamId);
    const stream = new MediaStream(this.localTracks.map((track) => track.getMediaStreamTrack()));
    const published = this.engine.startPublishingStream(this.streamId, stream);
    if (!published) throw new Error("ZEGOCLOUD stream publishing failed.");
  }

  async unpublish(tracks: ZegoTrack[]) {
    const removed = new Set(tracks.map((track) => track.getMediaStreamTrack()));
    this.localTracks = this.localTracks.filter((track) => !removed.has(track.getMediaStreamTrack()));
    if (!this.engine) return;
    this.engine.stopPublishingStream(this.streamId);
    if (this.localTracks.length > 0) {
      this.engine.startPublishingStream(
        this.streamId,
        new MediaStream(this.localTracks.map((track) => track.getMediaStreamTrack())),
      );
    }
  }

  async subscribe(user: ZegoRemoteUser, mediaType: ZegoMediaType) {
    // Remote streams are started once in roomStreamUpdate and exposed through track wrappers.
    void user;
    void mediaType;
  }

  async leave() {
    if (!this.engine) return;
    if (this.streamId) this.engine.stopPublishingStream(this.streamId);
    for (const user of this.remoteUsers) this.engine.stopPlayingStream(user.streamId);
    for (const track of this.localTracks) track.close();
    this.localTracks = [];
    this.remoteUsers = [];
    if (this.roomId) await this.engine.logoutRoom(this.roomId);
    this.engine.off("roomStreamUpdate");
    this.engine.destroyEngine();
    this.engine = null;
  }
}

export function createZegoClient() {
  return new ZegoRtcClient();
}

export async function createMicrophoneAudioTrack(): Promise<ZegoMicrophoneAudioTrack> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  return new ZegoTrack(stream.getAudioTracks()[0], "audio");
}

export async function createMicrophoneAndCameraTracks(): Promise<
  [ZegoMicrophoneAudioTrack, ZegoCameraVideoTrack]
> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  return [
    new ZegoTrack(stream.getAudioTracks()[0], "audio"),
    new ZegoTrack(stream.getVideoTracks()[0], "video"),
  ];
}

export async function createCameraVideoTrack(deviceId?: string): Promise<ZegoCameraVideoTrack> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: deviceId ? { deviceId: { exact: deviceId } } : true,
  });
  return new ZegoTrack(stream.getVideoTracks()[0], "video");
}

export async function getCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === "videoinput");
}

export function buildZegoUserId(sessionId: string, actorId: string) {
  return `${actorId}_${sessionId}`.replace(/[^A-Za-z0-9_]/g, "_").slice(0, 64);
}

export function normalizeRoomId(sessionId: string) {
  return sessionId.replace(/[^A-Za-z0-9_]/g, "_").slice(0, 64);
}

export async function requestAudioPermission() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => track.stop());
}

export async function requestVideoPermission() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  stream.getTracks().forEach((track) => track.stop());
}
