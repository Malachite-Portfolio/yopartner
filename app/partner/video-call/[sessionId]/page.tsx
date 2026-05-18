import { redirect } from "next/navigation";

type PartnerVideoCallRedirectPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function PartnerVideoCallRedirectPage({ params }: PartnerVideoCallRedirectPageProps) {
  const { sessionId } = await params;
  redirect(`/partner/calls/video/${sessionId}`);
}
