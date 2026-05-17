import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getSession() {
  cookies();
  return getServerSession(authOptions);
}

// GET — ambil semua goals user
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const goals = await prisma.goal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(goals);
  } catch (err) {
    console.error("[goals GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — buat goal baru
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: "Judul tidak boleh kosong" }, { status: 400 });

    const goal = await prisma.goal.create({
      data: { title: title.trim(), userId: session.user.id },
    });
    return NextResponse.json(goal);
  } catch (err) {
    console.error("[goals POST]", err);
    return NextResponse.json({ error: "Gagal menyimpan goal" }, { status: 500 });
  }
}
