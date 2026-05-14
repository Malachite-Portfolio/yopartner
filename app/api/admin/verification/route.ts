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
  const verifications = await prisma.verificationRecord.findMany({ include: { companion: true }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ verifications });
}

export async function POST(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();
  const auth = await requireAdminUser(request);
  if ("error" in auth) return NextResponse.json({ error: "FORBIDDEN", message: auth.error }, { status: auth.status });

  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return NextResponse.json({ error: "BAD_REQUEST", message: "Invalid request body." }, { status: 400 });
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "BAD_REQUEST", message: "Verification id is required." }, { status: 400 });

  const updated = await prisma.verificationRecord.update({
    where: { id },
    data: {
      ...(typeof body.idVerification === "string" ? { idVerification: body.idVerification } : {}),
      ...(typeof body.policeVerification === "string" ? { policeVerification: body.policeVerification } : {}),
      ...(typeof body.psychometric === "string" ? { psychometric: body.psychometric } : {}),
      ...(typeof body.interview === "string" ? { interview: body.interview } : {}),
      ...(typeof body.training === "string" ? { training: body.training } : {}),
      ...(typeof body.overallStatus === "string" ? { overallStatus: body.overallStatus } : {}),
    },
  });
  return NextResponse.json({ verification: updated });
}
