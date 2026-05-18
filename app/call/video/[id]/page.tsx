import { VideoCallScreen } from "@/components/call/VideoCallScreen";
import { resolveCompanionRouteProfile } from "@/lib/companionRoutes";

type VideoCallPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VideoCallPage({ params }: VideoCallPageProps) {
  const { id } = await params;
  const companion = await resolveCompanionRouteProfile(id);

  if (!companion) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#0b1224] p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-semibold text-amber-800">
            Video call will open after your session is created.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-[#0b1224]">
      <VideoCallScreen companion={companion} />
    </main>
  );
}
