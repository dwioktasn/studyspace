import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getSession() {
  cookies();
  return getServerSession(authOptions);
}

// GET — ambil semua sesi fokus user (untuk statistik)
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sessions = await prisma.focusSession.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(sessions);
  } catch (err) {
    console.error("[focus-sessions GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — simpan sesi fokus yang selesai
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { duration, type } = await req.json();
    if (!duration || !type) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });

    const focusSession = await prisma.focusSession.create({
      data: {
        duration: Number(duration),
        type,
        userId: session.user.id,
      },
    });
    return NextResponse.json(focusSession);
  } catch (err) {
    console.error("[focus-sessions POST]", err);
    return NextResponse.json({ error: "Gagal menyimpan sesi" }, { status: 500 });
  }
}
