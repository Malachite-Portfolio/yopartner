import { NextResponse } from "next/server";
import { notImplementedResponse, parseJsonBody } from "@/lib/server/http";
import { getPrismaClient } from "@/lib/server/prisma";
import { requireFirebaseUser } from "@/lib/server/auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireFirebaseUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const body = await parseJsonBody<{ status?: string; safetyFlag?: boolean }>(request);
  if (!body) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Invalid request body." }, { status: 400 });
  }

  const session = await prisma.session.findFirst({
    where: {
      id,
      OR: [
        { userId: auth.user.id },
        { companionId: auth.user.firebaseUid },
      ],
    },
  });

  if (!session) {
    return NextResponse.json({ error: "NOT_FOUND", message: "Session not found." }, { status: 404 });
  }

  const nextStatus = body.status ?? session.status;
  const endedAt = nextStatus === "completed" || nextStatus === "failed" ? new Date() : session.endedAt;

  const updated = await prisma.session.update({
    where: { id },
    data: {
      status: nextStatus,
      safetyFlag: typeof body.safetyFlag === "boolean" ? body.safetyFlag : session.safetyFlag,
      endedAt,
    },
  });

  return NextResponse.json({ session: updated });
}
