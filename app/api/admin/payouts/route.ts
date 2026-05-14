import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/server/prisma";
import { notImplementedResponse, parseJsonBody } from "@/lib/server/http";
import { requireAdminUser } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();
  const auth = await requireAdminUser(request);
  if ("error" in auth) return NextResponse.json({ error: "FORBIDDEN", message: auth.error }, { status: auth.status });
  const payouts = await prisma.payout.findMany({ include: { companion: true }, orderBy: { requestedAt: "desc" } });
  return NextResponse.json({ payouts });
}

export async function POST(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();
  const auth = await requireAdminUser(request);
  if ("error" in auth) return NextResponse.json({ error: "FORBIDDEN", message: auth.error }, { status: auth.status });

  const body = await parseJsonBody<{ id?: string; status?: string; reason?: string }>(request);
  if (!body?.id || !body.status) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Payout id and status are required." }, { status: 400 });
  }
  const payout = await prisma.payout.update({
    where: { id: body.id },
    data: {
      status: body.status,
      reason: body.reason ?? null,
      ...(body.status.toLowerCase() === "paid" ? { processedAt: new Date() } : {}),
    },
  });
  return NextResponse.json({ payout });
}
