import type { NextConfig } from "next";

const backendManagedApiPrefixes = [
  "/api/companions",
  "/api/sessions",
  "/api/bookings",
  "/api/wallet",
  "/api/payments",
  "/api/reviews",
  "/api/users",
  "/api/partner",
  "/api/admin",
];

function resolveBackendApiBaseUrl() {
  const candidate =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.API_BASE_URL?.trim() ||
    process.env.BACKEND_API_BASE_URL?.trim() ||
    "";

  if (!candidate) return null;
  const normalized = candidate.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(normalized)) return null;
  return normalized;
}

const nextConfig: NextConfig = {
  async rewrites() {
    const backendApiBaseUrl = resolveBackendApiBaseUrl();
    if (!backendApiBaseUrl) {
      return [];
    }

    const proxyRules = backendManagedApiPrefixes.flatMap((prefix) => [
      {
        source: `${prefix}`,
        destination: `${backendApiBaseUrl}${prefix}`,
      },
      {
        source: `${prefix}/:path*`,
        destination: `${backendApiBaseUrl}${prefix}/:path*`,
      },
    ]);

    return {
      beforeFiles: proxyRules,
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
