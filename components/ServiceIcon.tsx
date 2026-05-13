import {
  HeartHandshake,
  MapPin,
  MessageCircle,
  PhoneCall,
  Sparkles,
  Video,
} from "lucide-react";

type ServiceIconName =
  | "message-circle"
  | "phone-call"
  | "video"
  | "map-pin"
  | "sparkles"
  | "heart-handshake";

type ServiceIconProps = {
  icon: ServiceIconName;
  size?: number;
};

export function ServiceIcon({ icon, size = 18 }: ServiceIconProps) {
  if (icon === "phone-call") return <PhoneCall size={size} />;
  if (icon === "video") return <Video size={size} />;
  if (icon === "map-pin") return <MapPin size={size} />;
  if (icon === "sparkles") return <Sparkles size={size} />;
  if (icon === "heart-handshake") return <HeartHandshake size={size} />;
  return <MessageCircle size={size} />;
}



