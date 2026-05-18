import { redirect } from "next/navigation";

type PartnerAudioCallRedirectPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function PartnerAudioCallRedirectPage({ params }: PartnerAudioCallRedirectPageProps) {
  const { sessionId } = await params;
  redirect(`/partner/calls/audio/${sessionId}`);
}
