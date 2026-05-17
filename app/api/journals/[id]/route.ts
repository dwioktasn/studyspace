import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getSession() {
  cookies();
  return getServerSession(authOptions);
}

// GET — ambil satu entry by id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const entry = await prisma.journal.findUnique({ where: { id } });
    if (!entry || entry.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(entry);
  } catch (err) {
    console.error("[journals GET id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH — edit entry (title, content, mood)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const entry = await prisma.journal.findUnique({ where: { id } });
    if (!entry || entry.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { title, content, mood } = await req.json();
    const updated = await prisma.journal.update({
      where: { id },
      data: {
        title: title?.trim() ?? entry.title,
        content: content?.trim() ?? entry.content,
        mood: mood !== undefined ? mood : entry.mood,
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[journals PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE — hapus entry
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const entry = await prisma.journal.findUnique({ where: { id } });
    if (!entry || entry.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.journal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[journals DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
