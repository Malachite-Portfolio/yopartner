import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${siteUrl}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/connect-now`, lastModified, changeFrequency: "daily", priority: 0.95 },
    { url: `${siteUrl}/about`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/trust-safety`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/contact`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/partner/login`, lastModified, changeFrequency: "monthly", priority: 0.5 },
  ];
}
