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
  const media = await prisma.mediaItem.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ media });
}

export async function POST(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();
  const auth = await requireAdminUser(request);
  if ("error" in auth) return NextResponse.json({ error: "FORBIDDEN", message: auth.error }, { status: auth.status });
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return NextResponse.json({ error: "BAD_REQUEST", message: "Invalid request body." }, { status: 400 });
  if (body?.action === "delete" && typeof body.id === "string") {
    await prisma.mediaItem.delete({ where: { id: body.id } });
    return NextResponse.json({ success: true });
  }

  const id = typeof body?.id === "string" ? body.id : null;
  if (id) {
    const item = await prisma.mediaItem.update({
      where: { id },
      data: {
        ...(typeof body.type === "string" ? { type: body.type } : {}),
        ...(typeof body.title === "string" ? { title: body.title } : {}),
        ...(typeof body.publisher === "string" ? { publisher: body.publisher } : {}),
        ...(typeof body.imageUrl === "string" ? { imageUrl: body.imageUrl } : {}),
        ...(typeof body.linkUrl === "string" ? { linkUrl: body.linkUrl } : {}),
        ...(typeof body.status === "string" ? { status: body.status } : {}),
      },
    });
    return NextResponse.json({ media: item });
  }

  if (typeof body?.title !== "string" || typeof body?.type !== "string") {
    return NextResponse.json({ error: "BAD_REQUEST", message: "type and title are required." }, { status: 400 });
  }

  const item = await prisma.mediaItem.create({
    data: {
      type: body.type,
      title: body.title,
      publisher: typeof body.publisher === "string" ? body.publisher : null,
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : null,
      linkUrl: typeof body.linkUrl === "string" ? body.linkUrl : null,
      status: typeof body.status === "string" ? body.status : "draft",
    },
  });
  return NextResponse.json({ media: item }, { status: 201 });
}
