import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YoPartner",
    short_name: "YoPartner",
    description: "YoPartner partner dashboard alerts and companionship sessions.",
    start_url: "/partner/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#fffdf8",
    theme_color: "#0f766e",
    icons: [
      {
        src: "/images/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
