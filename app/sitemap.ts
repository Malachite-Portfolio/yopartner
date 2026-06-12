import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${siteUrl}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/connect-now`, lastModified, changeFrequency: "daily", priority: 0.95 },
    { url: `${siteUrl}/about`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/trust-safety`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/how-it-works`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/become-companion`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/faqs`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/contact`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/support`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/services`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/home-visit`, lastModified, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/client-diaries`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/media`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
