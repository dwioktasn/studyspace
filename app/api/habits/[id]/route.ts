import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getSession() {
  cookies();
  return getServerSession(authOptions);
}

// PATCH — Toggle completed / update habit
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const habit = await prisma.habit.findUnique({ where: { id } });
    if (!habit || habit.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const completing = body.completed === true;
    const uncompleting = body.completed === false;
    const now = new Date();
    const todayStr = now.toDateString();
    const lastStr = habit.lastCompletedAt ? new Date(habit.lastCompletedAt).toDateString() : null;
    const alreadyDoneToday = lastStr === todayStr;

    let newStreak = habit.streak;
    let newLastCompletedAt = habit.lastCompletedAt;

    if (completing && !alreadyDoneToday) {
      // Centang hari baru → streak +1
      newStreak = habit.streak + 1;
      newLastCompletedAt = now;
    } else if (uncompleting && alreadyDoneToday) {
      // Un-centang di hari yang sama → batalkan +1 tadi
      newStreak = Math.max(0, habit.streak - 1);
      newLastCompletedAt = null;
    }
    // Kalo skip hari = tidak ada aksi = streak tidak berubah sama sekali


    const updated = await prisma.habit.update({
      where: { id },
      data: {
        completed: body.completed !== undefined ? body.completed : habit.completed,
        streak: newStreak,
        lastCompletedAt: newLastCompletedAt,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[habits PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE — Hapus habit
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const habit = await prisma.habit.findUnique({ where: { id } });
    if (!habit || habit.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.habit.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[habits DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
