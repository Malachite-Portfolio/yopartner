import type { GiftSoundType } from "@/lib/chat/giftSound";

export type GiftCatalogTier = "popular" | "premium" | "luxury" | "legendary";

export type ChatGiftCatalogItem = {
  id: string;
  giftKey: string;
  name: string;
  price: number;
  tier: GiftCatalogTier;
  originalFileName: string;
  svga: string;
  sound: GiftSoundType;
  premium: boolean;
};

export const CHAT_GIFT_CATALOG: ChatGiftCatalogItem[] = [
  {
    "id": "gift-001",
    "giftKey": "gift-001",
    "name": "Gift 001",
    "price": 10,
    "tier": "popular",
    "originalFileName": "101.svga",
    "svga": "/gifts/svga/gift-001.svga",
    "sound": "rose",
    "premium": false
  },
  {
    "id": "gift-002",
    "giftKey": "gift-002",
    "name": "Gift 002",
    "price": 25,
    "tier": "popular",
    "originalFileName": "104.svga",
    "svga": "/gifts/svga/gift-002.svga",
    "sound": "coffee",
    "premium": false
  },
  {
    "id": "gift-003",
    "giftKey": "gift-003",
    "name": "Gift 003",
    "price": 50,
    "tier": "popular",
    "originalFileName": "108.svga",
    "svga": "/gifts/svga/gift-003.svga",
    "sound": "star",
    "premium": false
  },
  {
    "id": "gift-004",
    "giftKey": "gift-004",
    "name": "Gift 004",
    "price": 100,
    "tier": "popular",
    "originalFileName": "114.svga",
    "svga": "/gifts/svga/gift-004.svga",
    "sound": "heart",
    "premium": false
  },
  {
    "id": "gift-005",
    "giftKey": "gift-005",
    "name": "Gift 005",
    "price": 150,
    "tier": "popular",
    "originalFileName": "117.svga",
    "svga": "/gifts/svga/gift-005.svga",
    "sound": "rose",
    "premium": false
  },
  {
    "id": "gift-006",
    "giftKey": "gift-006",
    "name": "Gift 006",
    "price": 250,
    "tier": "popular",
    "originalFileName": "249.svga",
    "svga": "/gifts/svga/gift-006.svga",
    "sound": "coffee",
    "premium": false
  },
  {
    "id": "gift-007",
    "giftKey": "gift-007",
    "name": "Gift 007",
    "price": 10,
    "tier": "popular",
    "originalFileName": "250.svga",
    "svga": "/gifts/svga/gift-007.svga",
    "sound": "star",
    "premium": false
  },
  {
    "id": "gift-008",
    "giftKey": "gift-008",
    "name": "Gift 008",
    "price": 25,
    "tier": "popular",
    "originalFileName": "251.svga",
    "svga": "/gifts/svga/gift-008.svga",
    "sound": "heart",
    "premium": false
  },
  {
    "id": "gift-009",
    "giftKey": "gift-009",
    "name": "Gift 009",
    "price": 50,
    "tier": "popular",
    "originalFileName": "252.svga",
    "svga": "/gifts/svga/gift-009.svga",
    "sound": "rose",
    "premium": false
  },
  {
    "id": "gift-010",
    "giftKey": "gift-010",
    "name": "Gift 010",
    "price": 100,
    "tier": "popular",
    "originalFileName": "253.svga",
    "svga": "/gifts/svga/gift-010.svga",
    "sound": "coffee",
    "premium": false
  },
  {
    "id": "gift-011",
    "giftKey": "gift-011",
    "name": "Gift 011",
    "price": 150,
    "tier": "popular",
    "originalFileName": "254.svga",
    "svga": "/gifts/svga/gift-011.svga",
    "sound": "star",
    "premium": false
  },
  {
    "id": "gift-012",
    "giftKey": "gift-012",
    "name": "Gift 012",
    "price": 250,
    "tier": "popular",
    "originalFileName": "255.svga",
    "svga": "/gifts/svga/gift-012.svga",
    "sound": "heart",
    "premium": false
  },
  {
    "id": "gift-013",
    "giftKey": "gift-013",
    "name": "Gift 013",
    "price": 10,
    "tier": "popular",
    "originalFileName": "256.svga",
    "svga": "/gifts/svga/gift-013.svga",
    "sound": "rose",
    "premium": false
  },
  {
    "id": "gift-014",
    "giftKey": "gift-014",
    "name": "Gift 014",
    "price": 25,
    "tier": "popular",
    "originalFileName": "257.svga",
    "svga": "/gifts/svga/gift-014.svga",
    "sound": "coffee",
    "premium": false
  },
  {
    "id": "gift-015",
    "giftKey": "gift-015",
    "name": "Gift 015",
    "price": 50,
    "tier": "popular",
    "originalFileName": "258.svga",
    "svga": "/gifts/svga/gift-015.svga",
    "sound": "star",
    "premium": false
  },
  {
    "id": "gift-016",
    "giftKey": "gift-016",
    "name": "Gift 016",
    "price": 500,
    "tier": "premium",
    "originalFileName": "259.svga",
    "svga": "/gifts/svga/gift-016.svga",
    "sound": "crown",
    "premium": true
  },
  {
    "id": "gift-017",
    "giftKey": "gift-017",
    "name": "Gift 017",
    "price": 1000,
    "tier": "premium",
    "originalFileName": "260.svga",
    "svga": "/gifts/svga/gift-017.svga",
    "sound": "diamond",
    "premium": true
  },
  {
    "id": "gift-018",
    "giftKey": "gift-018",
    "name": "Gift 018",
    "price": 500,
    "tier": "premium",
    "originalFileName": "6c2ec2ec1c9f4e079b5bfee5f96b7b3c.svga",
    "svga": "/gifts/svga/gift-018.svga",
    "sound": "crown",
    "premium": true
  },
  {
    "id": "gift-019",
    "giftKey": "gift-019",
    "name": "Gift 019",
    "price": 1000,
    "tier": "premium",
    "originalFileName": "73.svga",
    "svga": "/gifts/svga/gift-019.svga",
    "sound": "diamond",
    "premium": true
  },
  {
    "id": "gift-020",
    "giftKey": "gift-020",
    "name": "Gift 020",
    "price": 500,
    "tier": "premium",
    "originalFileName": "74.svga",
    "svga": "/gifts/svga/gift-020.svga",
    "sound": "crown",
    "premium": true
  },
  {
    "id": "gift-021",
    "giftKey": "gift-021",
    "name": "Gift 021",
    "price": 1000,
    "tier": "premium",
    "originalFileName": "75.svga",
    "svga": "/gifts/svga/gift-021.svga",
    "sound": "diamond",
    "premium": true
  },
  {
    "id": "gift-022",
    "giftKey": "gift-022",
    "name": "Gift 022",
    "price": 500,
    "tier": "premium",
    "originalFileName": "7c7382698eb64d2794c199f52224688b (2).svga",
    "svga": "/gifts/svga/gift-022.svga",
    "sound": "crown",
    "premium": true
  },
  {
    "id": "gift-023",
    "giftKey": "gift-023",
    "name": "Gift 023",
    "price": 1000,
    "tier": "premium",
    "originalFileName": "80.svga",
    "svga": "/gifts/svga/gift-023.svga",
    "sound": "diamond",
    "premium": true
  },
  {
    "id": "gift-024",
    "giftKey": "gift-024",
    "name": "Gift 024",
    "price": 500,
    "tier": "premium",
    "originalFileName": "84.svga",
    "svga": "/gifts/svga/gift-024.svga",
    "sound": "crown",
    "premium": true
  },
  {
    "id": "gift-025",
    "giftKey": "gift-025",
    "name": "Gift 025",
    "price": 1000,
    "tier": "premium",
    "originalFileName": "93.svga",
    "svga": "/gifts/svga/gift-025.svga",
    "sound": "diamond_rain",
    "premium": true
  },
  {
    "id": "gift-026",
    "giftKey": "gift-026",
    "name": "Gift 026",
    "price": 2000,
    "tier": "luxury",
    "originalFileName": "95.svga",
    "svga": "/gifts/svga/gift-026.svga",
    "sound": "diamond",
    "premium": true
  },
  {
    "id": "gift-027",
    "giftKey": "gift-027",
    "name": "Gift 027",
    "price": 5000,
    "tier": "luxury",
    "originalFileName": "Ä¦ï¿½ï¿½ï¿½ï¿½05.svga",
    "svga": "/gifts/svga/gift-027.svga",
    "sound": "crown",
    "premium": true
  },
  {
    "id": "gift-028",
    "giftKey": "gift-028",
    "name": "Gift 028",
    "price": 2000,
    "tier": "luxury",
    "originalFileName": "Ã°â_¬â__Ã_.svga",
    "svga": "/gifts/svga/gift-028.svga",
    "sound": "diamond",
    "premium": true
  },
  {
    "id": "gift-029",
    "giftKey": "gift-029",
    "name": "Gift 029",
    "price": 5000,
    "tier": "luxury",
    "originalFileName": "é__ç¥¨æ_ª.svga",
    "svga": "/gifts/svga/gift-029.svga",
    "sound": "crown",
    "premium": true
  },
  {
    "id": "gift-030",
    "giftKey": "gift-030",
    "name": "Gift 030",
    "price": 2000,
    "tier": "luxury",
    "originalFileName": "ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½05 (1).svga",
    "svga": "/gifts/svga/gift-030.svga",
    "sound": "diamond",
    "premium": true
  },
  {
    "id": "gift-031",
    "giftKey": "gift-031",
    "name": "Gift 031",
    "price": 5000,
    "tier": "luxury",
    "originalFileName": "ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½.svga",
    "svga": "/gifts/svga/gift-031.svga",
    "sound": "crown",
    "premium": true
  },
  {
    "id": "gift-032",
    "giftKey": "gift-032",
    "name": "Gift 032",
    "price": 2000,
    "tier": "luxury",
    "originalFileName": "ï¿½ï¿½ï¿½Õ¿ï¿½ï¿½ï¿½05.svga",
    "svga": "/gifts/svga/gift-032.svga",
    "sound": "diamond",
    "premium": true
  },
  {
    "id": "gift-033",
    "giftKey": "gift-033",
    "name": "Dream Kiss",
    "price": 10000,
    "tier": "legendary",
    "originalFileName": "kiss gift_56.svga",
    "svga": "/gifts/svga/gift-033.svga",
    "sound": "diamond",
    "premium": true
  },
  {
    "id": "gift-034",
    "giftKey": "gift-034",
    "name": "Love Ring",
    "price": 12000,
    "tier": "legendary",
    "originalFileName": "Love ring.svga",
    "svga": "/gifts/svga/gift-034.svga",
    "sound": "diamond",
    "premium": true
  },
  {
    "id": "gift-035",
    "giftKey": "gift-035",
    "name": "Luxury Purse",
    "price": 15000,
    "tier": "legendary",
    "originalFileName": "Luxury purse.svga",
    "svga": "/gifts/svga/gift-035.svga",
    "sound": "diamond",
    "premium": true
  },
  {
    "id": "gift-036",
    "giftKey": "gift-036",
    "name": "Luxury Watch",
    "price": 18000,
    "tier": "legendary",
    "originalFileName": "Luxury watch.svga",
    "svga": "/gifts/svga/gift-036.svga",
    "sound": "luxury_watch",
    "premium": true
  },
  {
    "id": "gift-037",
    "giftKey": "gift-037",
    "name": "Marry",
    "price": 20000,
    "tier": "legendary",
    "originalFileName": "marry.svga",
    "svga": "/gifts/svga/gift-037.svga",
    "sound": "marry",
    "premium": true
  }
];

export const CHAT_GIFT_GROUPS: { tier: GiftCatalogTier; label: string }[] = [
  { tier: "popular", label: "Popular" },
  { tier: "premium", label: "Premium" },
  { tier: "luxury", label: "Luxury" },
  { tier: "legendary", label: "Legendary" },
];

export const PREMIUM_SPOTLIGHT_GIFT_KEYS = new Set(["gift-025", "gift-036", "gift-037"]);

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

export function getGiftSvgaUrl(gift: Pick<ChatGiftCatalogItem, "svga">) {
  return gift.svga.trim();
}

export function getGiftPreviewImageUrl(gift: Pick<ChatGiftCatalogItem, "svga" | "originalFileName">) {
  const original = gift.originalFileName.trim();
  if (original.toLowerCase().endsWith(".svga")) {
    const baseName = original.slice(0, -5);
    return `/gifts/svga/${encodeURIComponent(baseName)}.png`;
  }

  const svgaPath = getGiftSvgaUrl(gift);
  if (!svgaPath.toLowerCase().endsWith(".svga")) {
    return "";
  }
  return `${svgaPath.slice(0, -5)}.png`;
}

