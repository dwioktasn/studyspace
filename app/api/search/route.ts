import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getSession() {
  cookies();
  return getServerSession(authOptions);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (q.length < 1) return NextResponse.json({ habits: [], goals: [], journals: [] });

    const userId = session.user.id;

    const [habits, goals, journals] = await Promise.all([
      prisma.habit.findMany({
        where: { userId, name: { contains: q } },
        take: 4,
        select: { id: true, name: true, completed: true, streak: true },
      }),
      prisma.goal.findMany({
        where: { userId, title: { contains: q } },
        take: 4,
        select: { id: true, title: true, progress: true, isCompleted: true },
      }),
      prisma.journal.findMany({
        where: { userId, OR: [{ title: { contains: q } }, { content: { contains: q } }] },
        take: 4,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, content: true, createdAt: true },
      }),
    ]);

    return NextResponse.json({ habits, goals, journals });
  } catch (err) {
    console.error("[search GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
