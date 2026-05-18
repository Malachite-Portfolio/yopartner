import { redirect } from "next/navigation";

type PartnerChatRedirectPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function PartnerChatRedirectPage({ params }: PartnerChatRedirectPageProps) {
  const { sessionId } = await params;
  redirect(`/partner/chats/${sessionId}`);
}
