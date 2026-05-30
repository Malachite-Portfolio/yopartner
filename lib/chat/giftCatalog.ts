import type { GiftSoundType } from "@/lib/chat/giftSound";

export type GiftCatalogTier = "common" | "hot" | "luxury" | "expensive";
export type GiftMediaType = "svga" | "png";

export type ChatGiftCatalogItem = {
  id: string;
  giftKey: string;
  name: string;
  price: number;
  tier: GiftCatalogTier;
  mediaType: GiftMediaType;
  mediaUrl: string;
  sourceFileName: string;
  sound: GiftSoundType;
  premium: boolean;
};

const SVGA_GIFT_COUNT = 37;
const PNG_GIFT_FILE_NAMES = [
  "Car.png",
  "Eagle.png",
  "Earing.png",
  "Heart.png",
  "Heart3.png",
  "Heartbaloon.png",
  "Kiss.png",
  "Lion.png",
  "Lipstick.png",
  "Love.png",
  "Perfume.png",
  "Propose.png",
  "Queen.png",
  "Red Diamond.png",
  "Ring.png",
  "Rose Bouquet.png",
  "Rose.png",
  "Royal Earing.png",
  "Strawberry.png",
  "Teddy.png",
] as const;

const COMMON_PRICES = [5, 10, 15, 25, 35, 40, 45, 50, 60, 75, 90, 100];
const HOT_PRICES = [280, 300, 320, 340, 350, 360, 380, 400, 420, 450, 480, 500, 520, 550, 580, 600, 620, 650, 680, 700, 750];
const LUXURY_PRICES = [800, 850, 900, 1000, 1050, 1100, 1150, 1200, 1500, 1600, 1800, 2000];
const EXPENSIVE_PRICES = [2100, 2500, 3000, 3500, 4000, 4500, 5000];

const SOUND_BY_TIER: Record<GiftCatalogTier, GiftSoundType> = {
  common: "rose",
  hot: "heart",
  luxury: "diamond",
  expensive: "diamond_rain",
};

type PriceTier = { tier: GiftCatalogTier; price: number };

function pad(num: number) {
  return String(num).padStart(3, "0");
}

function toTitleFromFile(fileName: string) {
  return fileName.replace(/\.png$/i, "").replace(/[_-]+/g, " ").trim();
}

function buildPricePlan(totalCount: number): PriceTier[] {
  const plan: PriceTier[] = [];

  COMMON_PRICES.forEach((price) => plan.push({ tier: "common", price }));
  HOT_PRICES.forEach((price) => plan.push({ tier: "hot", price }));
  LUXURY_PRICES.forEach((price) => plan.push({ tier: "luxury", price }));
  EXPENSIVE_PRICES.forEach((price) => plan.push({ tier: "expensive", price }));

  let cursor = EXPENSIVE_PRICES[EXPENSIVE_PRICES.length - 1];
  while (plan.length < totalCount) {
    cursor += 500;
    plan.push({ tier: "expensive", price: cursor });
  }

  return plan.slice(0, totalCount);
}

function buildSvgaSeedItems() {
  const result: Array<Pick<ChatGiftCatalogItem, "id" | "giftKey" | "name" | "mediaType" | "mediaUrl" | "sourceFileName">> = [];
  for (let i = 1; i <= SVGA_GIFT_COUNT; i += 1) {
    const key = `gift-${pad(i)}`;
    result.push({
      id: key,
      giftKey: key,
      name: `SVGA Gift ${pad(i)}`,
      mediaType: "svga",
      mediaUrl: `/gifts/svga/${key}.svga`,
      sourceFileName: `${key}.svga`,
    });
  }
  return result;
}

function buildPngSeedItems() {
  return PNG_GIFT_FILE_NAMES.map((fileName, index) => {
    const key = `png-gift-${pad(index + 1)}`;
    return {
      id: key,
      giftKey: key,
      name: toTitleFromFile(fileName),
      mediaType: "png" as const,
      mediaUrl: `/gifts/png/${encodeURIComponent(fileName)}`,
      sourceFileName: fileName,
    };
  });
}

function buildCatalog() {
  const seedItems = [...buildSvgaSeedItems(), ...buildPngSeedItems()];
  const pricePlan = buildPricePlan(seedItems.length);

  return seedItems.map((seed, index) => {
    const pricing = pricePlan[index];
    return {
      ...seed,
      price: pricing.price,
      tier: pricing.tier,
      sound: SOUND_BY_TIER[pricing.tier],
      premium: pricing.tier === "luxury" || pricing.tier === "expensive",
    };
  });
}

export const CHAT_GIFT_CATALOG: ChatGiftCatalogItem[] = buildCatalog();

export const CHAT_GIFT_GROUPS: { tier: GiftCatalogTier; label: string }[] = [
  { tier: "common", label: "Common" },
  { tier: "hot", label: "Hot" },
  { tier: "luxury", label: "Luxury" },
  { tier: "expensive", label: "Expensive" },
];

export const PREMIUM_SPOTLIGHT_GIFT_KEYS = new Set([
  "gift-033",
  "gift-036",
  "gift-037",
  "png-gift-019",
  "png-gift-020",
]);

export function getCatalogGiftById(id: string) {
  return CHAT_GIFT_CATALOG.find((gift) => gift.id === id);
}

export function getCatalogGiftByKey(giftKey: string) {
  return CHAT_GIFT_CATALOG.find((gift) => gift.giftKey === giftKey) ?? null;
}

export function getCatalogGiftsByTier(tier: GiftCatalogTier) {
  return CHAT_GIFT_CATALOG.filter((gift) => gift.tier === tier);
}

export function isSpotlightPremiumGift(giftKey: string) {
  return PREMIUM_SPOTLIGHT_GIFT_KEYS.has(giftKey);
}

export function getGiftMediaUrl(gift: Pick<ChatGiftCatalogItem, "mediaUrl">) {
  return gift.mediaUrl.trim();
}

export function getGiftSvgaUrl(gift: Pick<ChatGiftCatalogItem, "mediaType" | "mediaUrl">) {
  return gift.mediaType === "svga" ? gift.mediaUrl.trim() : "";
}

export function getGiftPngUrl(gift: Pick<ChatGiftCatalogItem, "mediaType" | "mediaUrl">) {
  return gift.mediaType === "png" ? gift.mediaUrl.trim() : "";
}
