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
  const reviews = await prisma.review.findMany({ include: { user: true, companion: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ reviews });
}

export async function POST(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();
  const auth = await requireAdminUser(request);
  if ("error" in auth) return NextResponse.json({ error: "FORBIDDEN", message: auth.error }, { status: auth.status });
  const body = await parseJsonBody<{ id?: string; status?: string; action?: string }>(request);
  if (!body?.id) return NextResponse.json({ error: "BAD_REQUEST", message: "Review id is required." }, { status: 400 });
  if (body.action === "delete") {
    await prisma.review.delete({ where: { id: body.id } });
    return NextResponse.json({ success: true });
  }
  const review = await prisma.review.update({
    where: { id: body.id },
    data: { ...(body.status ? { status: body.status } : {}) },
  });
  return NextResponse.json({ review });
}
