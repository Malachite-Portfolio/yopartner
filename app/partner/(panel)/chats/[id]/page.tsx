import { redirect } from "next/navigation";

type PartnerPanelChatRedirectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PartnerPanelChatRedirectPage({ params }: PartnerPanelChatRedirectPageProps) {
  const { id } = await params;
  redirect(`/partner/chat/${id}`);
}
