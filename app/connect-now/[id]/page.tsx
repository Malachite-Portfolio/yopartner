import { notFound } from "next/navigation";
import { getCompanionById, type CompanionItem } from "@/lib/api/companions";
import { ConnectAppHeader } from "@/components/ConnectAppHeader";
import { ProfileBookingPanel } from "@/components/ProfileBookingPanel";
import { ProfileGallery } from "@/components/ProfileGallery";
import { ProfileHeroCard } from "@/components/ProfileHeroCard";
import { ProfileInfoSection } from "@/components/ProfileInfoSection";
import { ProfileReviews } from "@/components/ProfileReviews";
import { ProfileVerification } from "@/components/ProfileVerification";
import { demoHosts, isClientDemoEnabled } from "@/lib/clientDemoData";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { connectCompanions, type ConnectCompanion } from "@/lib/data";

type ConnectProfilePageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ type?: string }>;
};

function toProfileCompanion(item: CompanionItem): ConnectCompanion {
  const fallbackImage =
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80";
  const primaryImage = item.image || fallbackImage;
  const galleryImages = item.galleryImages.length > 0 ? item.galleryImages : [primaryImage];

  return {
    id: item.id,
    name: item.name,
    tagline: item.tagline || "Verified companion",
    category: item.category || "Communication & Emotional Support",
    age: 25,
    gender: "Not specified",
    religion: "Not specified",
    bornCity: "Not specified",
    nationality: "Indian",
    college: "Not specified",
    qualification: "Not specified",
    languages: ["English", "Hindi"],
    communicationStyle: "Calm, respectful, and supportive",
    hobbies: ["Reading", "Music"],
    rating: item.rating,
    reviewsCount: 1,
    experience: item.experience || "Verified companion",
    online: item.online,
    image: primaryImage,
    galleryImages,
    chatPrice: item.chatPrice,
    voicePrice: item.voicePrice,
    videoPrice: item.videoPrice,
    visitPrice: item.visitPrice ?? 0,
    serviceAreas: ["India"],
    servicesOffered:
      item.servicesOffered?.length
        ? item.servicesOffered
        : item.visitPrice && item.visitPrice > 0
          ? ["Chat", "Audio Call", "Video Call", "Home Visit"]
          : ["Chat", "Audio Call", "Video Call"],
    about: "Verified YoPartner companion focused on respectful, strictly platonic conversations.",
    verification: [
      { label: "ID Verification", status: "Verified" },
      { label: "Profile Review", status: "Approved" },
      { label: "Safety Checks", status: "Completed" },
    ],
    sessions: 0,
    reviews: [
      {
        phone: "******0000",
        date: "Recent",
        rating: Math.max(1, item.rating || 5),
        message: "Supportive and respectful session experience.",
        recommended: true,
      },
    ],
  };
}

export default async function ConnectProfilePage({ params, searchParams }: ConnectProfilePageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const preferredType = resolvedSearchParams?.type;

  const demoCompanion = isClientDemoEnabled() ? demoHosts.find((item) => item.id === id) : null;
  const response = await getCompanionById(id);
  const apiCompanion = response.data ? toProfileCompanion(response.data) : null;
  const companion =
    apiCompanion ?? demoCompanion ?? (!IS_PRODUCTION_READY_MODE ? connectCompanions.find((item) => item.id === id) : null);

  if (IS_PRODUCTION_READY_MODE && !companion) {
    return (
      <main className="min-h-screen bg-[#f4f7fb]">
        <ConnectAppHeader />
        <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-3xl items-center justify-center px-4 py-8">
          <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="text-base font-semibold text-amber-800">
              Companion profile is not available right now. Please try again later.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!companion) {
    notFound();
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[#f4f7fb]">
      <ConnectAppHeader />

      <div className="mx-auto w-full max-w-[1500px] min-w-0 px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_370px]">
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
