import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/server/prisma";
import { notImplementedResponse, parseJsonBody } from "@/lib/server/http";
import { requireAdminUser } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireAdminUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "FORBIDDEN", message: auth.error }, { status: auth.status });
  }

  const applications = await prisma.partnerApplication.findMany({
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json({ applications });
}

export async function POST(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireAdminUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "FORBIDDEN", message: auth.error }, { status: auth.status });
  }

  const body = await parseJsonBody<{ id?: string; status?: string; adminNote?: string }>(request);
  if (!body?.id || !body.status) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Application id and status are required." }, { status: 400 });
  }

  const application = await prisma.partnerApplication.update({
    where: { id: body.id },
    data: {
      status: body.status,
      adminNote: body.adminNote ?? null,
    },
  });

  if (body.status.toLowerCase() === "approved") {
    const partnerUser = application.userId
      ? await prisma.user.findUnique({ where: { id: application.userId } })
      : null;
    if (partnerUser) {
      await prisma.user.update({
        where: { id: partnerUser.id },
        data: { role: "PARTNER" },
      });
      await prisma.companion.updateMany({
        where: { id: partnerUser.firebaseUid },
        data: { status: "active" },
      });
    }
  }

  return NextResponse.json({ application });
}
