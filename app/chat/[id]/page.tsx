import { notFound } from "next/navigation";
import { ChatScreen } from "@/components/chat/ChatScreen";
import { getCompanionRouteProfile } from "@/lib/companionRoutes";

type ChatPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;
  const companion = getCompanionRouteProfile(id);

  if (!companion) {
    notFound();
  }

  return (
    <main className="h-screen overflow-hidden bg-[#eef3f8]">
      <ChatScreen key={companion.id} companion={companion} />
    </main>
  );
}
