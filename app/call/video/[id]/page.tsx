import { notFound } from "next/navigation";
import { VideoCallScreen } from "@/components/call/VideoCallScreen";
import { getCompanionRouteProfile } from "@/lib/companionRoutes";

type VideoCallPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VideoCallPage({ params }: VideoCallPageProps) {
  const { id } = await params;
  const companion = getCompanionRouteProfile(id);

  if (!companion) {
    notFound();
  }

  return (
    <main className="h-screen overflow-hidden bg-[#0b1224]">
      <VideoCallScreen companion={companion} />
    </main>
  );
}
