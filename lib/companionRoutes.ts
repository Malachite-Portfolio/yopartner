import { connectCompanions, homeVisitCompanions } from "@/lib/data";

export type CompanionRouteProfile = {
  id: string;
  name: string;
  image?: string;
  tagline: string;
  online: boolean;
  chatPrice: number;
  voicePrice: number;
  videoPrice: number;
};

export function getCompanionRouteProfile(id: string): CompanionRouteProfile | null {
  const directCompanion = connectCompanions.find((item) => item.id === id);

  if (directCompanion) {
    return {
      id: directCompanion.id,
      name: directCompanion.name,
      image: directCompanion.image,
      tagline: directCompanion.tagline,
      online: directCompanion.online,
      chatPrice: directCompanion.chatPrice,
      voicePrice: directCompanion.voicePrice,
      videoPrice: directCompanion.videoPrice ?? 20,
    };
  }

  const fallbackCompanion = homeVisitCompanions.find(
    (item) => item.id === id || item.connectProfileId === id,
  );

  if (!fallbackCompanion) {
    return null;
  }

  return {
    id,
    name: fallbackCompanion.name,
    image: fallbackCompanion.image,
    tagline: fallbackCompanion.tagline,
    online: true,
    chatPrice: 10,
    voicePrice: 15,
    videoPrice: 20,
  };
}
