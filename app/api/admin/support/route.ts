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
  const tickets = await prisma.supportTicket.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  const prisma = getPrismaClient();
  if (!prisma) return notImplementedResponse();
  const auth = await requireAdminUser(request);
  if ("error" in auth) return NextResponse.json({ error: "FORBIDDEN", message: auth.error }, { status: auth.status });
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return NextResponse.json({ error: "BAD_REQUEST", message: "Invalid request body." }, { status: 400 });
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "BAD_REQUEST", message: "Ticket id is required." }, { status: 400 });

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "NOT_FOUND", message: "Ticket not found." }, { status: 404 });

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: {
      ...(typeof body.status === "string" ? { status: body.status } : {}),
      ...(typeof body.assignedTo === "string" ? { assignedTo: body.assignedTo } : {}),
      ...(typeof body.note === "string" ? { notes: [...ticket.notes, body.note] } : {}),
    },
  });
  return NextResponse.json({ ticket: updated });
}
