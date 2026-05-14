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

  const sessions = await prisma.session.findMany({
    include: { user: true, companion: true },
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireAdminUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "FORBIDDEN", message: auth.error }, { status: auth.status });
  }

  const body = await parseJsonBody<{ id?: string; status?: string; safetyFlag?: boolean }>(request);
  if (!body?.id) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Session id is required." }, { status: 400 });
  }

  const updated = await prisma.session.update({
    where: { id: body.id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(typeof body.safetyFlag === "boolean" ? { safetyFlag: body.safetyFlag } : {}),
      ...(body.status === "completed" ? { endedAt: new Date() } : {}),
    },
  });
  return NextResponse.json({ session: updated });
}
