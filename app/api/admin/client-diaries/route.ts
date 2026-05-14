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
  const diaries = await prisma.clientDiary.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ diaries });
}

export async function POST(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();
  const auth = await requireAdminUser(request);
  if ("error" in auth) return NextResponse.json({ error: "FORBIDDEN", message: auth.error }, { status: auth.status });
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return NextResponse.json({ error: "BAD_REQUEST", message: "Invalid request body." }, { status: 400 });
  if (body?.action === "delete" && typeof body.id === "string") {
    await prisma.clientDiary.delete({ where: { id: body.id } });
    return NextResponse.json({ success: true });
  }

  const id = typeof body?.id === "string" ? body.id : null;
  if (id) {
    const diary = await prisma.clientDiary.update({
      where: { id },
      data: {
        ...(typeof body.title === "string" ? { title: body.title } : {}),
        ...(typeof body.subtitle === "string" ? { subtitle: body.subtitle } : {}),
        ...(typeof body.imageUrl === "string" ? { imageUrl: body.imageUrl } : {}),
        ...(typeof body.videoUrl === "string" ? { videoUrl: body.videoUrl } : {}),
        ...(typeof body.status === "string" ? { status: body.status } : {}),
      },
    });
    return NextResponse.json({ diary });
  }

  if (typeof body?.title !== "string") {
    return NextResponse.json({ error: "BAD_REQUEST", message: "title is required." }, { status: 400 });
  }

  const diary = await prisma.clientDiary.create({
    data: {
      title: body.title,
      subtitle: typeof body.subtitle === "string" ? body.subtitle : null,
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : null,
      videoUrl: typeof body.videoUrl === "string" ? body.videoUrl : null,
      status: typeof body.status === "string" ? body.status : "draft",
    },
  });

  return NextResponse.json({ diary }, { status: 201 });
}
