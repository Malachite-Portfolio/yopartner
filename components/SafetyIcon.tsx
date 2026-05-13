import {
  BadgeCheck,
  ClipboardCheck,
  HeartHandshake,
  LifeBuoy,
  Lock,
  ShieldBan,
} from "lucide-react";

type SafetyIconName =
  | "badge-check"
  | "clipboard-check"
  | "lock"
  | "shield-ban"
  | "life-buoy"
  | "heart-handshake";

type SafetyIconProps = {
  icon: SafetyIconName;
  size?: number;
};

export function SafetyIcon({ icon, size = 18 }: SafetyIconProps) {
  if (icon === "clipboard-check") return <ClipboardCheck size={size} />;
  if (icon === "lock") return <Lock size={size} />;
  if (icon === "shield-ban") return <ShieldBan size={size} />;
  if (icon === "life-buoy") return <LifeBuoy size={size} />;
  if (icon === "heart-handshake") return <HeartHandshake size={size} />;
  return <BadgeCheck size={size} />;
}



