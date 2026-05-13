import { apiRequest } from "@/lib/api/client";

export type CompanionFilters = {
  search?: string;
  availability?: "all" | "online";
  category?: string | null;
};

export type CompanionItem = {
  id: string;
  name: string;
  tagline: string;
  category: string;
  rating: number;
  experience: string;
  image?: string;
  online: boolean;
  chatPrice: number;
  voicePrice: number;
  videoPrice?: number;
  servicesOffered: string[];
};

export async function listCompanions(filters?: CompanionFilters) {
  const query = new URLSearchParams();
  if (filters?.search) query.set("search", filters.search);
  if (filters?.availability) query.set("availability", filters.availability);
  if (filters?.category) query.set("category", filters.category);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const result = await apiRequest<{ companions: CompanionItem[] }>(`/api/companions${suffix}`);
  if (result.error) {
    return {
      data: [],
      error: { ...result.error, message: "Companions are currently unavailable. Please try again later." },
    };
  }
  return { data: result.data?.companions ?? [], error: null };
}

export async function getCompanionById(id: string) {
  const result = await apiRequest<{ companion: CompanionItem }>(`/api/companions/${id}`);
  if (result.error) {
    return {
      data: null,
      error: { ...result.error, message: "Companions are currently unavailable. Please try again later." },
    };
  }
  return { data: result.data?.companion ?? null, error: null };
}

export async function listFeaturedCompanions() {
  const result = await apiRequest<{ companions: CompanionItem[] }>("/api/companions/featured");
  if (result.error) {
    return {
      data: [],
      error: { ...result.error, message: "Companions are currently unavailable. Please try again later." },
    };
  }
  return { data: result.data?.companions ?? [], error: null };
}
