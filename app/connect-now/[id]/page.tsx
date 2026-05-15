import { notFound } from "next/navigation";
import { ConnectAppHeader } from "@/components/ConnectAppHeader";
import { ProfileBookingPanel } from "@/components/ProfileBookingPanel";
import { ProfileGallery } from "@/components/ProfileGallery";
import { ProfileHeroCard } from "@/components/ProfileHeroCard";
import { ProfileInfoSection } from "@/components/ProfileInfoSection";
import { ProfileReviews } from "@/components/ProfileReviews";
import { ProfileVerification } from "@/components/ProfileVerification";
import { demoHosts, isClientDemoEnabled } from "@/lib/clientDemoData";
import { IS_PRODUCTION_READY_MODE } from "@/lib/config/runtime";
import { connectCompanions } from "@/lib/data";

type ConnectProfilePageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ type?: string }>;
};

export default async function ConnectProfilePage({ params, searchParams }: ConnectProfilePageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const preferredType = resolvedSearchParams?.type;
  const demoCompanion = isClientDemoEnabled() ? demoHosts.find((item) => item.id === id) : null;

  if (IS_PRODUCTION_READY_MODE && !demoCompanion) {
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

  const companion = demoCompanion ?? connectCompanions.find((item) => item.id === id);

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
