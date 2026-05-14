import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/server/prisma";
import { notImplementedResponse, parseJsonBody } from "@/lib/server/http";
import { requireFirebaseUser } from "@/lib/server/auth";

export const runtime = "nodejs";

const SETTINGS_PREFIX = "partner_settings:";

export async function GET(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireFirebaseUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: auth.error }, { status: auth.status });
  }

  const key = `${SETTINGS_PREFIX}${auth.user.id}`;
  const setting = await prisma.adminSetting.findUnique({ where: { key } });
  return NextResponse.json({ settings: setting?.value ?? {} });
}

export async function PATCH(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();

  const auth = await requireFirebaseUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: auth.error }, { status: auth.status });
  }

  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Invalid request body." }, { status: 400 });
  }

  const key = `${SETTINGS_PREFIX}${auth.user.id}`;
  await prisma.adminSetting.upsert({
    where: { key },
    update: { value: body as Prisma.InputJsonValue },
    create: { key, value: body as Prisma.InputJsonValue },
  });

  return NextResponse.json({ success: true });
}
