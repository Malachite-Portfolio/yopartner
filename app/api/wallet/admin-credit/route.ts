import { NextResponse } from "next/server";
import { createCode, notImplementedResponse, parseJsonBody } from "@/lib/server/http";
import { getPrismaClient } from "@/lib/server/prisma";
import { requireAdminUser } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireAdminUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "FORBIDDEN", message: auth.error }, { status: auth.status });
  }

  const body = await parseJsonBody<{ userId?: string; amount?: number; reason?: string }>(request);
  if (!body?.userId || !body?.amount || body.amount <= 0) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "userId and positive amount are required." },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: body.userId },
      data: { walletBalance: { increment: Number(body.amount) } },
    }),
    prisma.walletTransaction.create({
      data: {
        transactionId: createCode("TXN"),
        userId: body.userId,
        type: "Admin Credit",
        amount: Number(body.amount),
        status: "Success",
        description: body.reason ?? "Admin wallet credit",
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
