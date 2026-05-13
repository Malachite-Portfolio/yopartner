import { notFound } from "next/navigation";
import { AudioCallScreen } from "@/components/call/AudioCallScreen";
import { getCompanionRouteProfile } from "@/lib/companionRoutes";

type AudioCallPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AudioCallPage({ params }: AudioCallPageProps) {
  const { id } = await params;
  const companion = getCompanionRouteProfile(id);

  if (!companion) {
    notFound();
  }

  return (
    <main className="h-screen overflow-hidden bg-[#0b1230]">
      <AudioCallScreen companion={companion} />
    </main>
  );
}
