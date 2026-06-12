import type { Metadata } from "next";

const siteUrl = "https://yopartner.com";
const defaultImage = "/logo.png";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
};

export function createPageMetadata({ title, description, path }: PageMetadataInput): Metadata {
  const canonicalPath = path === "/" ? "/" : path.replace(/\/+$/, "");

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: "YoPartner",
      url: canonicalPath,
      title,
      description,
      images: [
        {
          url: defaultImage,
          alt: "YoPartner",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultImage],
    },
  };
}

export { siteUrl };
