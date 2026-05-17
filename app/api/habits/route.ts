import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getSession() {
  // Panggil cookies() dulu supaya Next.js App Router meneruskan cookies ke getServerSession
  cookies();
  return getServerSession(authOptions);
}

// GET — Ambil semua habit, auto-reset jika belum diselesaikan hari ini
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todayStr = new Date().toDateString();

    const habits = await prisma.habit.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });

    // Auto-reset tiap hari baru: jika lastCompletedAt bukan hari ini → completed=false
    // Streak TIDAK direset — skip hari tidak kena penalti
    // PENTING: hanya reset jika lastCompletedAt ada (tidak null)
    const updates = habits
      .filter(h => h.completed && h.lastCompletedAt && new Date(h.lastCompletedAt).toDateString() !== todayStr)
      .map(h =>
        prisma.habit.update({
          where: { id: h.id },
          data: { completed: false },   // streak dibiarkan
        })
      );

    if (updates.length > 0) await Promise.all(updates);

    // Fetch ulang data terbaru setelah reset
    const fresh = await prisma.habit.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(fresh);
  } catch (err) {
    console.error("[habits GET] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — Tambah habit baru
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nama habit tidak boleh kosong" }, { status: 400 });
    }

    const newHabit = await prisma.habit.create({
      data: {
        name: name.trim(),
        userId: session.user.id,
      },
    });

    return NextResponse.json(newHabit);
  } catch (err) {
    console.error("[habits POST] Error:", err);
    return NextResponse.json({ error: "Gagal menyimpan habit" }, { status: 500 });
  }
}