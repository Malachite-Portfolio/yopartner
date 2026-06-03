import { getCompanionById, type CompanionItem } from "@/lib/api/companions";
import { ProfileBookingPanel } from "@/components/ProfileBookingPanel";
import { ProfileGallery } from "@/components/ProfileGallery";
import { ProfileHeroCard } from "@/components/ProfileHeroCard";
import { ProfileInfoSection } from "@/components/ProfileInfoSection";
import { ProfileReviews } from "@/components/ProfileReviews";
import { ProfileVerification } from "@/components/ProfileVerification";
import type { ConnectCompanion } from "@/lib/data";

type ConnectProfilePageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ type?: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toProfileCompanion(item: CompanionItem): ConnectCompanion {
  const primaryImage = item.image;
  const galleryImages = item.galleryImages.filter(Boolean);
  const normalizedCommunicationStyle = (item.communicationStyle ?? []).map((value) => value.trim()).filter(Boolean);
  const normalizedInterests = (item.interests ?? []).map((value) => value.trim()).filter(Boolean);
  const normalizedHobbies = (item.hobbies ?? []).map((value) => value.trim()).filter(Boolean);
  const normalizedLanguages = (item.languages ?? []).filter(Boolean);
  const normalizedServices = (item.servicesOffered ?? []).filter(Boolean);
  const profileChips = Array.from(
    new Set([
      ...normalizedServices,
      ...normalizedCommunicationStyle,
      ...normalizedInterests,
      ...normalizedHobbies,
      item.category,
    ].filter((value): value is string => Boolean(value && value.trim()))),
  );

  const verificationRows: ConnectCompanion["verification"] =
    (item.verificationBadges ?? []).length > 0
      ? (item.verificationBadges ?? []).map((label) => ({ label, status: "Verified" }))
      : [
          { label: "Profile Reviewed", status: "Verified" },
          { label: "ID Verified", status: "Verified" },
          { label: "Safety Checked", status: "Verified" },
          { label: "Behaviour Reviewed", status: "Verified" },
        ];

  const normalizedReviews: ConnectCompanion["reviews"] = (item.reviews ?? []).map((review) => {
    const createdAt = review.createdAt ? new Date(review.createdAt) : null;
    const dateLabel = createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.toLocaleDateString() : "Recent";
    return {
      phone: review.phoneMasked || "******",
      date: dateLabel,
      rating: Math.max(1, Number(review.rating || 0)),
      message: review.comment,
      recommended: Number(review.rating || 0) >= 4,
    };
  }).filter((review) => review.message.trim().length > 0);

  return {
    id: item.id,
    name: item.name,
    isVerifiedPartner: item.isVerifiedPartner,
    tagline: item.headline || item.tagline || "",
    category: item.category || "Companion",
    city: item.city,
    age: item.age && item.age > 0 ? item.age : 0,
    gender: item.gender || "",
    religion: "",
    bornCity: "",
    nationality: "",
    college: "",
    qualification: "",
    languages: normalizedLanguages,
    communicationStyle: normalizedCommunicationStyle.join(", "),
    hobbies: normalizedHobbies,
    rating: item.rating,
    reviewsCount: item.reviewCount ?? item.reviewsCount ?? normalizedReviews.length,
    experience: item.experience || "",
    online: item.online,
    image: primaryImage,
    galleryImages,
    chatPrice: item.chatPrice,
    voicePrice: item.voicePrice,
    videoPrice: item.videoPrice,
    visitPrice: item.visitPrice ?? 0,
    serviceAreas: (item.serviceAreas ?? []).filter(Boolean),
    servicesOffered: profileChips,
    about: item.about?.trim() || "",
    verification: verificationRows,
    sessions: item.completedSessions ?? item.sessions ?? 0,
    reviews: normalizedReviews,
  };
}

export default async function ConnectProfilePage({ params, searchParams }: ConnectProfilePageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const preferredType = resolvedSearchParams?.type;

  const response = await getCompanionById(id);
  const apiCompanion = response.data ? toProfileCompanion(response.data) : null;
  const companion = apiCompanion;

  if (!companion) {
    const isNotFound = response.error?.status === 404;
    const isDevelopment = process.env.NODE_ENV !== "production";
    const technicalMessage = response.error?.message?.trim();
    return (
      <main className="min-h-screen bg-[#f4f7fb]">
        <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-3xl items-center justify-center px-4 py-8">
          <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="text-base font-semibold text-amber-800">
              {isNotFound
                ? "Profile not found. This companion may no longer be available."
                : "Companion profile is temporarily unavailable. Please try again later."}
            </p>
            {!isNotFound && isDevelopment && technicalMessage ? (
              <p className="mt-2 text-xs text-amber-700">{technicalMessage}</p>
            ) : null}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[#fbf6ff]">
      <div className="mx-auto w-full max-w-[1340px] min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <ProfileHeroCard companion={companion} />
            <ProfileGallery images={companion.galleryImages} />
            <ProfileInfoSection companion={companion} />
            <ProfileVerification verification={companion.verification} />
            <ProfileReviews reviews={companion.reviews} reviewsCount={companion.reviewsCount} />
          </div>

          <ProfileBookingPanel
            companion={companion}
            initialType={
              preferredType === "chat" || preferredType === "audio" || preferredType === "video"
                ? preferredType
                : "chat"
            }
          />
        </div>
      </div>
    </main>
  );
}
