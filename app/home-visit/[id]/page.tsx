import { notFound } from "next/navigation";
import { ConnectAppHeader } from "@/components/ConnectAppHeader";
import { ProfileBookingPanel } from "@/components/ProfileBookingPanel";
import { ProfileGallery } from "@/components/ProfileGallery";
import { ProfileHeroCard } from "@/components/ProfileHeroCard";
import { ProfileInfoSection } from "@/components/ProfileInfoSection";
import { ProfileReviews } from "@/components/ProfileReviews";
import { ProfileVerification } from "@/components/ProfileVerification";
import { connectCompanions, homeVisitCompanions, type ConnectCompanion, type HomeVisitCompanion } from "@/lib/data";

type HomeVisitProfilePageProps = {
  params: Promise<{ id: string }>;
};

function buildHomeVisitProfile(companion: HomeVisitCompanion): ConnectCompanion {
  const normalizedName = companion.name;

  return {
    id: companion.id,
    name: normalizedName,
    tagline: companion.tagline,
    category: companion.category,
    age: 27,
    gender: "Prefer not to say",
    religion: "Not specified",
    bornCity: companion.city,
    nationality: "Indian",
    college: "Not specified",
    qualification: "Not specified",
    languages: ["Hindi", "English"],
    communicationStyle: "Calm, respectful, and supportive",
    hobbies: ["Reading", "Music", "Walking"],
    rating: companion.rating,
    reviewsCount: 9,
    experience: companion.experience,
    online: true,
    image: companion.image,
    galleryImages: [
      companion.image,
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=520&q=80",
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=520&q=80",
    ],
    chatPrice: 10,
    voicePrice: 15,
    videoPrice: 20,
    visitPrice: companion.price,
    serviceAreas: ["India"],
    servicesOffered: companion.services,
    about:
      "I provide respectful, strictly platonic companionship for safe in-person sessions built around comfort, clear boundaries, and meaningful conversation.",
    verification: [
      { label: "ID Verification", status: "Verified" },
      { label: "Police Verification", status: "Verified" },
      { label: "Psychometric Test", status: "Cleared" },
      { label: "Behavioural Interview", status: "Cleared" },
      { label: "Training By YoPartner Team", status: "Trained" },
    ],
    sessions: 180,
    reviews: [
      {
        phone: "******9231",
        date: "10 May 2026",
        rating: 5,
        message: "Professional and very respectful in-person support.",
        recommended: true,
      },
      {
        phone: "******1157",
        date: "06 May 2026",
        rating: 4.9,
        message: "Safe, clear communication and great session experience.",
        recommended: true,
      },
      {
        phone: "******7712",
        date: "30 Apr 2026",
        rating: 4.8,
        message: "Punctual and easy to connect with throughout the session.",
        recommended: true,
      },
    ],
  };
}

export default async function HomeVisitProfilePage({ params }: HomeVisitProfilePageProps) {
  const { id } = await params;
  const listingCompanion = homeVisitCompanions.find((item) => item.id === id);

  if (!listingCompanion) {
    notFound();
  }

  const linkedCompanion = connectCompanions.find(
    (item) => item.id === listingCompanion.connectProfileId || item.id === listingCompanion.id,
  );

  const companionProfile: ConnectCompanion = linkedCompanion
    ? {
        ...linkedCompanion,
        id: listingCompanion.id,
        name: listingCompanion.name,
        tagline: listingCompanion.tagline,
        image: listingCompanion.image,
        rating: listingCompanion.rating,
        experience: listingCompanion.experience,
        category: listingCompanion.category,
        servicesOffered: listingCompanion.services,
        visitPrice: listingCompanion.price,
        bornCity: linkedCompanion.bornCity || listingCompanion.city,
      }
    : buildHomeVisitProfile(listingCompanion);

  return (
    <main className="min-h-screen overflow-x-clip bg-[#f4f7fb]">
      <ConnectAppHeader />

      <div className="mx-auto w-full max-w-[1320px] min-w-0 px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_378px]">
          <div className="space-y-6">
            <ProfileHeroCard companion={companionProfile} />
            <ProfileGallery images={companionProfile.galleryImages} />
            <ProfileInfoSection companion={companionProfile} />
            <ProfileVerification verification={companionProfile.verification} />
            <ProfileReviews reviews={companionProfile.reviews} reviewsCount={companionProfile.reviewsCount} />
          </div>

          <ProfileBookingPanel companion={companionProfile} mode="visit" routeSource="home-visit" initialType="visit" />
        </div>
      </div>
    </main>
  );
}

