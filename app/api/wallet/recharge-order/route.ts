import { NextResponse } from "next/server";
import { createCode, notImplementedResponse, parseJsonBody } from "@/lib/server/http";
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

  const body = await parseJsonBody<{ amount?: number }>(request);
  const amount = Number(body?.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Valid amount is required." }, { status: 400 });
  }

  const orderId = createCode("ORD");
  await prisma.walletTransaction.create({
    data: {
      transactionId: createCode("TXN"),
      userId: auth.user.id,
      type: "Recharge",
      amount,
      status: "Pending",
      gateway: "Demo",
      orderId,
      description: `Recharge order created for ₹${amount}`,
    },
  });

  return NextResponse.json({ orderId, status: "Pending" });
}
