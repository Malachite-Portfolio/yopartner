import { redirect } from "next/navigation";

type CompanionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CompanionDetailPage({ params }: CompanionDetailPageProps) {
  const { id } = await params;
  redirect(`/connect-now/${id}`);
}
