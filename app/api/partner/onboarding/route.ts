import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/server/prisma";
import { notImplementedResponse, parseJsonBody } from "@/lib/server/http";
import { requireFirebaseUser } from "@/lib/server/auth";
import { companionFromApplicationPayload } from "@/lib/server/partner";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireFirebaseUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: auth.error }, { status: auth.status });
  }

  const latest = await prisma.partnerApplication.findFirst({
    where: { userId: auth.user.id },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({
    application: latest
      ? {
          id: latest.id,
          status: latest.status,
          submittedAt: latest.submittedAt.toISOString(),
          adminNote: latest.adminNote ?? null,
          payload: latest.payload,
        }
      : null,
  });
}

export async function POST(request: Request) {
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

  const fullName = String(body.fullName ?? "").trim();
  if (!fullName) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Full name is required." }, { status: 400 });
  }

  const created = await prisma.partnerApplication.create({
    data: {
      userId: auth.user.id,
      phone: auth.user.phone ?? "",
      fullName,
      city: body.bornCity ? String(body.bornCity) : null,
      status: "under_review",
      payload: body as Prisma.InputJsonValue,
    },
  });

  const companionData = companionFromApplicationPayload(body, {
    id: auth.user.firebaseUid,
    name: fullName,
    phone: auth.user.phone,
  });

  await prisma.companion.upsert({
    where: { id: auth.user.firebaseUid },
    update: companionData,
    create: companionData,
  });

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { role: "PARTNER", name: fullName },
  });

  return NextResponse.json({ success: true, applicationId: created.id }, { status: 201 });
}
