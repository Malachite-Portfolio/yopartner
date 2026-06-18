import { NextResponse } from "next/server";
import { createCode, notImplementedResponse, parseJsonBody } from "@/lib/server/http";
import { getPrismaClient } from "@/lib/server/prisma";
import { requireFirebaseUser } from "@/lib/server/auth";
import { WALLET_PLANS } from "@/lib/platformPricing";

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
  const plan = WALLET_PLANS.find((item) => item.pay === amount);
  if (!plan) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Select a valid recharge plan." }, { status: 400 });
  }

  const orderId = createCode("ORD");
  await prisma.walletTransaction.create({
    data: {
      transactionId: createCode("TXN"),
      userId: auth.user.id,
      type: "Recharge",
      amount: plan.get,
      status: "Pending",
      gateway: "Demo",
      orderId,
      description: `Recharge order created for INR ${plan.pay}`,
    },
  });

  return NextResponse.json({ orderId, status: "Pending" });
}
