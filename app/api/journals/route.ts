import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getSession() {
  cookies();
  return getServerSession(authOptions);
}

// GET — ambil semua journal entries milik user
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const entries = await prisma.journal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(entries);
  } catch (err) {
    console.error("[journals GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — buat journal entry baru
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, content, mood } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: "Judul tidak boleh kosong" }, { status: 400 });

    const entry = await prisma.journal.create({
      data: {
        title: title.trim(),
        content: content?.trim() || "",
        mood: mood || null,
        userId: session.user.id,
      },
    });
    return NextResponse.json(entry);
  } catch (err) {
    console.error("[journals POST]", err);
    return NextResponse.json({ error: "Gagal menyimpan jurnal" }, { status: 500 });
  }
}
