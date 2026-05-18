import { connectCompanions } from "@/lib/data";
import { getCompanionById, type CompanionItem } from "@/lib/api/companions";

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

  return null;
}

function fromApiCompanion(item: CompanionItem): CompanionRouteProfile {
  return {
    id: item.id,
    name: item.name,
    image: item.image,
    tagline: item.tagline || "Calm, respectful conversations",
    online: item.online,
    chatPrice: item.chatPrice,
    voicePrice: item.voicePrice,
    videoPrice: typeof item.videoPrice === "number" ? item.videoPrice : 0,
  };
}

export async function resolveCompanionRouteProfile(id: string): Promise<CompanionRouteProfile | null> {
  const staticCompanion = getCompanionRouteProfile(id);
  if (staticCompanion) return staticCompanion;

  const apiCompanion = await getCompanionById(id);
  if (apiCompanion.data) {
    return fromApiCompanion(apiCompanion.data);
  }

  return null;
}
