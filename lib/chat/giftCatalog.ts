import type { GiftEffectKey } from "@/lib/chat/giftEffects";

export type GiftCatalogTier = "popular" | "premium" | "luxury" | "legendary";

export type ChatGiftCatalogItem = {
  id: string;
  giftKey: string;
  name: string;
  price: number;
  tier: GiftCatalogTier;
  originalFileName: string;
  svgaFile: string;
  soundType: GiftEffectKey;
  premium: boolean;
};

export const CHAT_GIFT_CATALOG: ChatGiftCatalogItem[] = [
  {
    "id": "gift-001",
    "giftKey": "gift-001",
    "name": "Rose Bloom",
    "price": 10,
    "tier": "popular",
    "originalFileName": "101.svga",
    "svgaFile": "/gifts/svga/gift-001.svga",
    "soundType": "rose",
    "premium": false
  },
  {
    "id": "gift-002",
    "giftKey": "gift-002",
    "name": "Coffee Cheers",
    "price": 25,
    "tier": "popular",
    "originalFileName": "104.svga",
    "svgaFile": "/gifts/svga/gift-002.svga",
    "soundType": "coffee",
    "premium": false
  },
  {
    "id": "gift-003",
    "giftKey": "gift-003",
    "name": "Starlight Spark",
    "price": 50,
    "tier": "popular",
    "originalFileName": "108.svga",
    "svgaFile": "/gifts/svga/gift-003.svga",
    "soundType": "star",
    "premium": false
  },
  {
    "id": "gift-004",
    "giftKey": "gift-004",
    "name": "Heart Beat",
    "price": 100,
    "tier": "popular",
    "originalFileName": "114.svga",
    "svgaFile": "/gifts/svga/gift-004.svga",
    "soundType": "heart",
    "premium": false
  },
  {
    "id": "gift-005",
    "giftKey": "gift-005",
    "name": "Warm Hug",
    "price": 150,
    "tier": "popular",
    "originalFileName": "117.svga",
    "svgaFile": "/gifts/svga/gift-005.svga",
    "soundType": "rose",
    "premium": false
  },
  {
    "id": "gift-006",
    "giftKey": "gift-006",
    "name": "Lucky Charm",
    "price": 250,
    "tier": "popular",
    "originalFileName": "249.svga",
    "svgaFile": "/gifts/svga/gift-006.svga",
    "soundType": "coffee",
    "premium": false
  },
  {
    "id": "gift-007",
    "giftKey": "gift-007",
    "name": "Sweet Wave",
    "price": 10,
    "tier": "popular",
    "originalFileName": "250.svga",
    "svgaFile": "/gifts/svga/gift-007.svga",
    "soundType": "star",
    "premium": false
  },
  {
    "id": "gift-008",
    "giftKey": "gift-008",
    "name": "Blush Burst",
    "price": 25,
    "tier": "popular",
    "originalFileName": "251.svga",
    "svgaFile": "/gifts/svga/gift-008.svga",
    "soundType": "heart",
    "premium": false
  },
  {
    "id": "gift-009",
    "giftKey": "gift-009",
    "name": "Moon Wink",
    "price": 50,
    "tier": "popular",
    "originalFileName": "252.svga",
    "svgaFile": "/gifts/svga/gift-009.svga",
    "soundType": "rose",
    "premium": false
  },
  {
    "id": "gift-010",
    "giftKey": "gift-010",
    "name": "Sunshine Pop",
    "price": 100,
    "tier": "popular",
    "originalFileName": "253.svga",
    "svgaFile": "/gifts/svga/gift-010.svga",
    "soundType": "coffee",
    "premium": false
  },
  {
    "id": "gift-011",
    "giftKey": "gift-011",
    "name": "Wish Lantern",
    "price": 150,
    "tier": "popular",
    "originalFileName": "254.svga",
    "svgaFile": "/gifts/svga/gift-011.svga",
    "soundType": "star",
    "premium": false
  },
  {
    "id": "gift-012",
    "giftKey": "gift-012",
    "name": "Golden Smile",
    "price": 250,
    "tier": "popular",
    "originalFileName": "255.svga",
    "svgaFile": "/gifts/svga/gift-012.svga",
    "soundType": "heart",
    "premium": false
  },
  {
    "id": "gift-013",
    "giftKey": "gift-013",
    "name": "Happy Pulse",
    "price": 10,
    "tier": "popular",
    "originalFileName": "256.svga",
    "svgaFile": "/gifts/svga/gift-013.svga",
    "soundType": "rose",
    "premium": false
  },
  {
    "id": "gift-014",
    "giftKey": "gift-014",
    "name": "Candy Star",
    "price": 25,
    "tier": "popular",
    "originalFileName": "257.svga",
    "svgaFile": "/gifts/svga/gift-014.svga",
    "soundType": "coffee",
    "premium": false
  },
  {
    "id": "gift-015",
    "giftKey": "gift-015",
    "name": "Dream Kiss",
    "price": 50,
    "tier": "popular",
    "originalFileName": "258.svga",
    "svgaFile": "/gifts/svga/gift-015.svga",
    "soundType": "star",
    "premium": false
  },
  {
    "id": "gift-016",
    "giftKey": "gift-016",
    "name": "Royal Aura",
    "price": 500,
    "tier": "premium",
    "originalFileName": "259.svga",
    "svgaFile": "/gifts/svga/gift-016.svga",
    "soundType": "crown",
    "premium": true
  },
  {
    "id": "gift-017",
    "giftKey": "gift-017",
    "name": "Crystal Crown",
    "price": 1000,
    "tier": "premium",
    "originalFileName": "260.svga",
    "svgaFile": "/gifts/svga/gift-017.svga",
    "soundType": "diamond",
    "premium": true
  },
  {
    "id": "gift-018",
    "giftKey": "gift-018",
    "name": "Mystic Flash",
    "price": 500,
    "tier": "premium",
    "originalFileName": "6c2ec2ec1c9f4e079b5bfee5f96b7b3c.svga",
    "svgaFile": "/gifts/svga/gift-018.svga",
    "soundType": "crown",
    "premium": true
  },
  {
    "id": "gift-019",
    "giftKey": "gift-019",
    "name": "Sky Glitter",
    "price": 1000,
    "tier": "premium",
    "originalFileName": "73.svga",
    "svgaFile": "/gifts/svga/gift-019.svga",
    "soundType": "diamond",
    "premium": true
  },
  {
    "id": "gift-020",
    "giftKey": "gift-020",
    "name": "Shimmer Path",
    "price": 500,
    "tier": "premium",
    "originalFileName": "74.svga",
    "svgaFile": "/gifts/svga/gift-020.svga",
    "soundType": "crown",
    "premium": true
  },
  {
    "id": "gift-021",
    "giftKey": "gift-021",
    "name": "Moon Palace",
    "price": 1000,
    "tier": "premium",
    "originalFileName": "75.svga",
    "svgaFile": "/gifts/svga/gift-021.svga",
    "soundType": "diamond",
    "premium": true
  },
  {
    "id": "gift-022",
    "giftKey": "gift-022",
    "name": "Velvet Night",
    "price": 500,
    "tier": "premium",
    "originalFileName": "7c7382698eb64d2794c199f52224688b (2).svga",
    "svgaFile": "/gifts/svga/gift-022.svga",
    "soundType": "crown",
    "premium": true
  },
  {
    "id": "gift-023",
    "giftKey": "gift-023",
    "name": "Neon Crown",
    "price": 1000,
    "tier": "premium",
    "originalFileName": "80.svga",
    "svgaFile": "/gifts/svga/gift-023.svga",
    "soundType": "diamond",
    "premium": true
  },
  {
    "id": "gift-024",
    "giftKey": "gift-024",
    "name": "Star Parade",
    "price": 500,
    "tier": "premium",
    "originalFileName": "84.svga",
    "svgaFile": "/gifts/svga/gift-024.svga",
    "soundType": "crown",
    "premium": true
  },
  {
    "id": "gift-025",
    "giftKey": "gift-025",
    "name": "Diamond Rain",
    "price": 1000,
    "tier": "premium",
    "originalFileName": "93.svga",
    "svgaFile": "/gifts/svga/gift-025.svga",
    "soundType": "diamond",
    "premium": true
  },
  {
    "id": "gift-026",
    "giftKey": "gift-026",
    "name": "Sapphire Jet",
    "price": 2000,
    "tier": "luxury",
    "originalFileName": "95.svga",
    "svgaFile": "/gifts/svga/gift-026.svga",
    "soundType": "diamond",
    "premium": true
  },
  {
    "id": "gift-027",
    "giftKey": "gift-027",
    "name": "Platinum Storm",
    "price": 5000,
    "tier": "luxury",
    "originalFileName": "Ä¦ï¿½ï¿½ï¿½ï¿½05.svga",
    "svgaFile": "/gifts/svga/gift-027.svga",
    "soundType": "crown",
    "premium": true
  },
  {
    "id": "gift-028",
    "giftKey": "gift-028",
    "name": "Royal Blizzard",
    "price": 2000,
    "tier": "luxury",
    "originalFileName": "Ã°â_¬â__Ã_.svga",
    "svgaFile": "/gifts/svga/gift-028.svga",
    "soundType": "diamond",
    "premium": true
  },
  {
    "id": "gift-029",
    "giftKey": "gift-029",
    "name": "Eternal Shine",
    "price": 5000,
    "tier": "luxury",
    "originalFileName": "é__ç¥¨æ_ª.svga",
    "svgaFile": "/gifts/svga/gift-029.svga",
    "soundType": "crown",
    "premium": true
  },
  {
    "id": "gift-030",
    "giftKey": "gift-030",
    "name": "Galaxy Drift",
    "price": 2000,
    "tier": "luxury",
    "originalFileName": "ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½05 (1).svga",
    "svgaFile": "/gifts/svga/gift-030.svga",
    "soundType": "diamond",
    "premium": true
  },
  {
    "id": "gift-031",
    "giftKey": "gift-031",
    "name": "Ocean Legend",
    "price": 5000,
    "tier": "luxury",
    "originalFileName": "ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½.svga",
    "svgaFile": "/gifts/svga/gift-031.svga",
    "soundType": "crown",
    "premium": true
  },
  {
    "id": "gift-032",
    "giftKey": "gift-032",
    "name": "Phoenix Pulse",
    "price": 2000,
    "tier": "luxury",
    "originalFileName": "ï¿½ï¿½ï¿½Õ¿ï¿½ï¿½ï¿½05.svga",
    "svgaFile": "/gifts/svga/gift-032.svga",
    "soundType": "diamond",
    "premium": true
  },
  {
    "id": "gift-033",
    "giftKey": "gift-033",
    "name": "Kiss Gift",
    "price": 10000,
    "tier": "legendary",
    "originalFileName": "kiss gift_56.svga",
    "svgaFile": "/gifts/svga/gift-033.svga",
    "soundType": "diamond",
    "premium": true
  },
  {
    "id": "gift-034",
    "giftKey": "gift-034",
    "name": "Love Ring",
    "price": 12000,
    "tier": "legendary",
    "originalFileName": "Love ring.svga",
    "svgaFile": "/gifts/svga/gift-034.svga",
    "soundType": "diamond",
    "premium": true
  },
  {
    "id": "gift-035",
    "giftKey": "gift-035",
    "name": "Luxury Purse",
    "price": 15000,
    "tier": "legendary",
    "originalFileName": "Luxury purse.svga",
    "svgaFile": "/gifts/svga/gift-035.svga",
    "soundType": "diamond",
    "premium": true
  },
  {
    "id": "gift-036",
    "giftKey": "gift-036",
    "name": "Luxury Watch",
    "price": 18000,
    "tier": "legendary",
    "originalFileName": "Luxury watch.svga",
    "svgaFile": "/gifts/svga/gift-036.svga",
    "soundType": "diamond",
    "premium": true
  },
  {
    "id": "gift-037",
    "giftKey": "gift-037",
    "name": "Marry",
    "price": 20000,
    "tier": "legendary",
    "originalFileName": "marry.svga",
    "svgaFile": "/gifts/svga/gift-037.svga",
    "soundType": "diamond",
    "premium": true
  }
];

export const CHAT_GIFT_GROUPS: { tier: GiftCatalogTier; label: string }[] = [
  { tier: "popular", label: "Popular" },
  { tier: "premium", label: "Premium" },
  { tier: "luxury", label: "Luxury" },
  { tier: "legendary", label: "Legendary" },
];

export function getCatalogGiftById(id: string) {
  return CHAT_GIFT_CATALOG.find((gift) => gift.id === id);
}

export function getCatalogGiftByKey(giftKey: string) {
  return CHAT_GIFT_CATALOG.find((gift) => gift.giftKey === giftKey) ?? CHAT_GIFT_CATALOG[0];
}

export function getCatalogGiftsByTier(tier: GiftCatalogTier) {
  return CHAT_GIFT_CATALOG.filter((gift) => gift.tier === tier);
}
