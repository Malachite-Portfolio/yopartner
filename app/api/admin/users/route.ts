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

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireAdminUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "FORBIDDEN", message: auth.error }, { status: auth.status });
  }

  const body = await parseJsonBody<{ userId?: string; status?: string; walletDelta?: number }>(request);
  if (!body?.userId) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "userId is required." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: body.userId },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(typeof body.walletDelta === "number" ? { walletBalance: { increment: body.walletDelta } } : {}),
    },
  });

  return NextResponse.json({ user: updated });
}
