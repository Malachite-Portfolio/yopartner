import { NextResponse } from "next/server";
import { notImplementedResponse, parseJsonBody } from "@/lib/server/http";
import { getPrismaClient } from "@/lib/server/prisma";
import { requireFirebaseUser } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireFirebaseUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: auth.error }, { status: auth.status });
  }

  const body = await parseJsonBody<{ orderId?: string }>(request);
  const orderId = body?.orderId?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "orderId is required." }, { status: 400 });
  }

  const transaction = await prisma.walletTransaction.findFirst({
    where: { userId: auth.user.id, orderId },
    orderBy: { createdAt: "desc" },
  });

  if (!transaction) {
    return NextResponse.json({ error: "NOT_FOUND", message: "Recharge order not found." }, { status: 404 });
  }

  if (transaction.status !== "Success") {
    await prisma.$transaction([
      prisma.walletTransaction.update({
        where: { id: transaction.id },
        data: { status: "Success" },
      }),
      prisma.user.update({
        where: { id: auth.user.id },
        data: { walletBalance: { increment: transaction.amount } },
      }),
    ]);
  }

  return NextResponse.json({ success: true });
}
