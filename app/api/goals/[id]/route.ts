import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getSession() {
  cookies();
  return getServerSession(authOptions);
}

// PATCH — update progress (0–100) atau tandai selesai
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal || goal.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const progress = body.progress !== undefined ? Math.min(100, Math.max(0, body.progress)) : goal.progress;
    const isCompleted = body.isCompleted !== undefined ? body.isCompleted : progress === 100;

    const updated = await prisma.goal.update({
      where: { id },
      data: { progress, isCompleted },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[goals PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE — hapus goal
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal || goal.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.goal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[goals DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
