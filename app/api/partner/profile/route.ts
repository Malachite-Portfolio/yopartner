import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/server/prisma";
import { notImplementedResponse, parseJsonBody } from "@/lib/server/http";
import { requireFirebaseUser } from "@/lib/server/auth";
import { getPartnerCompanion } from "@/lib/server/partner";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireFirebaseUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: auth.error }, { status: auth.status });
  }

  const companion = await getPartnerCompanion(prisma, auth.user);
  const application = await prisma.partnerApplication.findFirst({
    where: { userId: auth.user.id },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({
    profile: {
      uid: auth.user.firebaseUid,
      phone: auth.user.phone,
      name: auth.user.name ?? companion?.name ?? null,
      status: companion?.status ?? "under_review",
      reviewStatus: application?.status ?? "under_review",
      companion,
      application: application?.payload ?? null,
    },
  });
}

export async function PATCH(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireFirebaseUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: auth.error }, { status: auth.status });
  }

  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Invalid request body." }, { status: 400 });
  }

  const updateName = body.fullName ? String(body.fullName) : auth.user.name;
  await prisma.user.update({
    where: { id: auth.user.id },
    data: { name: updateName },
  });

  return NextResponse.json({ success: true });
}
