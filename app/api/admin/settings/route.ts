import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/server/prisma";
import { notImplementedResponse, parseJsonBody } from "@/lib/server/http";
import { requireAdminUser } from "@/lib/server/auth";

export const runtime = "nodejs";

const SETTINGS_KEY = "platform_settings";

export async function GET(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();
  const auth = await requireAdminUser(request);
  if ("error" in auth) return NextResponse.json({ error: "FORBIDDEN", message: auth.error }, { status: auth.status });
  const setting = await prisma.adminSetting.findUnique({ where: { key: SETTINGS_KEY } });
  return NextResponse.json({ settings: setting?.value ?? {} });
}

export async function POST(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();
  const auth = await requireAdminUser(request);
  if ("error" in auth) return NextResponse.json({ error: "FORBIDDEN", message: auth.error }, { status: auth.status });
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return NextResponse.json({ error: "BAD_REQUEST", message: "Invalid request body." }, { status: 400 });
  const value = body as never;
  const setting = await prisma.adminSetting.upsert({
    where: { key: SETTINGS_KEY },
    update: { value },
    create: { key: SETTINGS_KEY, value },
  });
  return NextResponse.json({ settings: setting.value });
}
