export type LuckyWheelRewardType = "free_call" | "talktime" | "free_chat" | "video_discount";

export type LuckyWheelReward = {
  id: string;
  label: string;
  resultLabel: string;
  type: LuckyWheelRewardType;
  value: number;
};

export const luckyWheelRewards: LuckyWheelReward[] = [
  {
    id: "free_call_2",
    label: "1 Free Call\n2 Minutes",
    resultLabel: "1 Free Call - 2 Minutes",
    type: "free_call",
    value: 2,
  },
  {
    id: "talktime_20",
    label: "+\u20b920\nTalktime",
    resultLabel: "+\u20b920 Talktime",
    type: "talktime",
    value: 20,
  },
  {
    id: "free_chat_5",
    label: "5 Free Chat\nMinutes",
    resultLabel: "5 Free Chat Minutes",
    type: "free_chat",
    value: 5,
  },
  {
    id: "video_discount_10",
    label: "10% OFF\nVideo Call",
    resultLabel: "10% OFF Video Call",
    type: "video_discount",
    value: 10,
  },
];
