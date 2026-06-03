import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/server/prisma";
import { notImplementedResponse } from "@/lib/server/http";
import { requireFirebaseUser } from "@/lib/server/auth";

export const runtime = "nodejs";

type WalletTransactionItem = {
  amount: number;
  createdAt: Date;
  description?: string | null;
  status: string;
  transactionId: string;
  type: string;
};

export async function GET(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireFirebaseUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: auth.error }, { status: auth.status });
  }

  const transactions = await prisma.walletTransaction.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    transactions: transactions.map((tx: WalletTransactionItem) => ({
      id: tx.transactionId,
      type: tx.type,
      amount: tx.amount,
      status: tx.status,
      createdAt: tx.createdAt.toISOString(),
      description: tx.description ?? undefined,
    })),
  });
}
