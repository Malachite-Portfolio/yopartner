import { notFound } from "next/navigation";
import { ConnectAppHeader } from "@/components/ConnectAppHeader";
import { ProfileBookingPanel } from "@/components/ProfileBookingPanel";
import { ProfileGallery } from "@/components/ProfileGallery";
import { ProfileHeroCard } from "@/components/ProfileHeroCard";
import { ProfileInfoSection } from "@/components/ProfileInfoSection";
import { ProfileReviews } from "@/components/ProfileReviews";
import { ProfileVerification } from "@/components/ProfileVerification";
import { connectCompanions } from "@/lib/data";

type ConnectProfilePageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ type?: string }>;
};

export default async function ConnectProfilePage({ params, searchParams }: ConnectProfilePageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const preferredType = resolvedSearchParams?.type;
  const companion = connectCompanions.find((item) => item.id === id);

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
            mode="chat"
            routeSource="connect-now"
            initialType={
              preferredType === "chat" || preferredType === "audio" || preferredType === "video" || preferredType === "visit"
                ? preferredType
                : "chat"
            }
          />
        </div>
      </div>
    </main>
  );
}
