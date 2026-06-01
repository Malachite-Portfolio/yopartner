import type { GiftSoundType } from "@/lib/chat/giftSound";

export type GiftCatalogTier = "normal" | "premium" | "luxury" | "expensive";
export type GiftMediaType = "svga" | "png";

export type ChatGiftCatalogItem = {
  id: string;
  giftKey: string;
  name: string;
  price: number;
  tier: GiftCatalogTier;
  mediaType: GiftMediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
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

const NORMAL_PNG_PRICES = [5, 10, 15, 25, 35, 40, 45, 50, 60, 75, 90, 100, 150, 200, 250, 300, 350, 400, 450, 500];
const PREMIUM_SVGA_PRICES = [600, 700, 800, 900, 1000, 1200, 1500, 1800, 2000];
const LUXURY_SVGA_PRICES = [2500, 3000, 3500, 4000, 4500, 5000, 6000, 7000, 8000, 9000];
const EXPENSIVE_SVGA_PRICES = [10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19000, 20000, 21000, 22000, 23000, 24000, 25000, 26000, 27000];

const SOUND_BY_TIER: Record<GiftCatalogTier, GiftSoundType> = {
  normal: "rose",
  premium: "heart",
  luxury: "diamond",
  expensive: "diamond_rain",
};

function pad(num: number) {
  return String(num).padStart(3, "0");
}

function toTitleFromFile(fileName: string) {
  return fileName.replace(/\.png$/i, "").replace(/[_-]+/g, " ").trim();
}

function warnCatalogIssue(message: string, meta: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;
  console.warn(`[giftCatalog] ${message}`, meta);
}

function buildSvgaItems() {
  const prices = [...PREMIUM_SVGA_PRICES, ...LUXURY_SVGA_PRICES, ...EXPENSIVE_SVGA_PRICES];
  const items: ChatGiftCatalogItem[] = [];

  for (let i = 1; i <= SVGA_GIFT_COUNT; i += 1) {
    const key = `gift-${pad(i)}`;
    const price = prices[i - 1];
    const tier: GiftCatalogTier =
      i <= PREMIUM_SVGA_PRICES.length
        ? "premium"
        : i <= PREMIUM_SVGA_PRICES.length + LUXURY_SVGA_PRICES.length
          ? "luxury"
          : "expensive";

    items.push({
      id: key,
      giftKey: key,
      name: `SVGA Gift ${pad(i)}`,
      price,
      tier,
      mediaType: "svga",
      mediaUrl: `/gifts/svga/${key}.svga`,
      thumbnailUrl: `/gifts/thumbnails/${key}.png`,
      sourceFileName: `${key}.svga`,
      sound: SOUND_BY_TIER[tier],
      premium: true,
    });
  }

  return items;
}

function buildPngItems() {
  return PNG_GIFT_FILE_NAMES.map((fileName, index): ChatGiftCatalogItem => {
    const key = `png-gift-${pad(index + 1)}`;
    return {
      id: key,
      giftKey: key,
      name: toTitleFromFile(fileName),
      price: NORMAL_PNG_PRICES[index],
      tier: "normal",
      mediaType: "png",
      mediaUrl: `/gifts/png/${encodeURIComponent(fileName)}`,
      sourceFileName: fileName,
      sound: SOUND_BY_TIER.normal,
      premium: false,
    };
  });
}

function normalizeMediaKey(mediaUrl: string) {
  return decodeURIComponent(mediaUrl).trim().toLowerCase();
}

function buildUniqueCatalog(items: ChatGiftCatalogItem[]) {
  const seenGiftKeys = new Set<string>();
  const seenMediaUrls = new Set<string>();
  const uniqueItems: ChatGiftCatalogItem[] = [];

  for (const item of items) {
    const mediaKey = normalizeMediaKey(item.mediaUrl);
    const tierMismatch =
      (item.mediaType === "png" && item.tier !== "normal")
      || (item.mediaType === "svga" && item.tier === "normal");

    if (tierMismatch) {
      warnCatalogIssue("tier/media mismatch removed from catalog", {
        giftKey: item.giftKey,
        tier: item.tier,
        mediaType: item.mediaType,
        mediaUrl: item.mediaUrl,
      });
      continue;
    }

    if (seenGiftKeys.has(item.giftKey)) {
      warnCatalogIssue("duplicate giftKey removed from catalog", {
        giftKey: item.giftKey,
        mediaUrl: item.mediaUrl,
      });
      continue;
    }

    if (seenMediaUrls.has(mediaKey)) {
      warnCatalogIssue("duplicate mediaUrl removed from catalog", {
        giftKey: item.giftKey,
        mediaUrl: item.mediaUrl,
      });
      continue;
    }

    seenGiftKeys.add(item.giftKey);
    seenMediaUrls.add(mediaKey);
    uniqueItems.push(item);
  }

  return uniqueItems;
}

function validateSvgaThumbnailCatalog(items: ChatGiftCatalogItem[]) {
  if (process.env.NODE_ENV === "production") return;

  const svgaItems = items.filter((item) => item.mediaType === "svga");
  const seenThumbnailUrls = new Map<string, string>();

  svgaItems.forEach((item) => {
    const thumbnailUrl = item.thumbnailUrl?.trim();
    if (!thumbnailUrl) {
      warnCatalogIssue("svga gift missing thumbnailUrl", {
        giftKey: item.giftKey,
        mediaUrl: item.mediaUrl,
      });
      return;
    }

    const normalizedThumbnailUrl = normalizeMediaKey(thumbnailUrl);
    const duplicateGiftKey = seenThumbnailUrls.get(normalizedThumbnailUrl);
    if (duplicateGiftKey && duplicateGiftKey !== item.giftKey) {
      warnCatalogIssue("svga gifts share duplicate thumbnailUrl", {
        giftKey: item.giftKey,
        duplicateGiftKey,
        thumbnailUrl,
      });
      return;
    }
    seenThumbnailUrls.set(normalizedThumbnailUrl, item.giftKey);

    const expectedPath = `/gifts/thumbnails/${item.giftKey}.png`;
    if (thumbnailUrl !== expectedPath) {
      warnCatalogIssue("svga thumbnailUrl differs from expected per-gift path", {
        giftKey: item.giftKey,
        thumbnailUrl,
        expectedPath,
      });
    }
  });
}

const RAW_GIFT_CATALOG = [...buildPngItems(), ...buildSvgaItems()];
export const CHAT_GIFT_CATALOG: ChatGiftCatalogItem[] = buildUniqueCatalog(RAW_GIFT_CATALOG);
validateSvgaThumbnailCatalog(CHAT_GIFT_CATALOG);

export const CHAT_GIFT_GROUPS: { tier: GiftCatalogTier; label: string }[] = [
  { tier: "normal", label: "Normal" },
  { tier: "premium", label: "Premium" },
  { tier: "luxury", label: "Luxury" },
  { tier: "expensive", label: "Expensive" },
];

export const PREMIUM_SPOTLIGHT_GIFT_KEYS = new Set([
  "gift-030",
  "gift-033",
  "gift-037",
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

export function getGiftThumbnailUrl(gift: Pick<ChatGiftCatalogItem, "mediaUrl" | "thumbnailUrl">) {
  const thumbnail = gift.thumbnailUrl?.trim();
  if (thumbnail) return thumbnail;
  return gift.mediaUrl.trim();
}
