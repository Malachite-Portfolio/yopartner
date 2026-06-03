export type LuckyWheelRewardType = "free_call" | "talktime" | "free_chat" | "video_discount";

export type LuckyWheelReward = {
  id: string;
  label: string;
  shortLabel: string;
  resultLabel: string;
  type: LuckyWheelRewardType;
  value: number;
};

export const luckyWheelRewards: LuckyWheelReward[] = [
  {
    id: "free_call_2",
    label: "1 Free Call\n2 Minutes",
    shortLabel: "Free Call",
    resultLabel: "1 Free Call - 2 Minutes",
    type: "free_call",
    value: 2,
  },
  {
    id: "talktime_20",
    label: "+₹20\nTalktime",
    shortLabel: "Talktime",
    resultLabel: "+₹20 Talktime",
    type: "talktime",
    value: 20,
  },
  {
    id: "free_chat_5",
    label: "5 Free Chat\nMinutes",
    shortLabel: "Chat Minutes",
    resultLabel: "5 Free Chat Minutes",
    type: "free_chat",
    value: 5,
  },
  {
    id: "video_discount_10",
    label: "10% OFF\nVideo Call",
    shortLabel: "Video Offer",
    resultLabel: "10% OFF Video Call",
    type: "video_discount",
    value: 10,
  },
];
