import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getSession() {
  cookies();
  return getServerSession(authOptions);
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const now = new Date();

    // Batas waktu
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOf30Days = new Date(now); startOf30Days.setDate(now.getDate() - 29);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 6); // last 7 days

    // ── Focus sessions ──────────────────────────────────
    const allSessions = await prisma.focusSession.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    // Total focus this month (menit)
    const monthSessions = allSessions.filter(s => new Date(s.createdAt) >= startOfMonth);
    const totalMonthMinutes = monthSessions.reduce((s, f) => s + f.duration, 0);

    // Weekly avg (last 7 days)
    const weekSessions = allSessions.filter(s => new Date(s.createdAt) >= startOfWeek);
    const weekMinutes = weekSessions.reduce((s, f) => s + f.duration, 0);
    const weeklyAvgMinutes = Math.round(weekMinutes / 7);

    // Focus per day (last 7 days) untuk bar chart
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const dayStr = d.toDateString();
      const dayMins = allSessions
        .filter(s => new Date(s.createdAt).toDateString() === dayStr)
        .reduce((sum, s) => sum + s.duration, 0);
      return { day: days[d.getDay()], minutes: dayMins };
    });

    // Focus distribution by type
    const typeMap: Record<string, number> = {};
    monthSessions.forEach(s => {
      typeMap[s.type] = (typeMap[s.type] || 0) + s.duration;
    });
    const totalTypeMins = Object.values(typeMap).reduce((a, b) => a + b, 0);
    const distribution = Object.entries(typeMap).map(([type, mins]) => ({
      type,
      minutes: mins,
      percent: totalTypeMins > 0 ? Math.round((mins / totalTypeMins) * 100) : 0,
    })).sort((a, b) => b.minutes - a.minutes);

    // Last 30 days consistency (berapa menit per hari)
    const consistency = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (29 - i));
      const dayStr = d.toDateString();
      const mins = allSessions
        .filter(s => new Date(s.createdAt).toDateString() === dayStr)
        .reduce((sum, s) => sum + s.duration, 0);
      return { date: d.toISOString().split('T')[0], minutes: mins };
    });

    // ── Habits ──────────────────────────────────────────
    const habits = await prisma.habit.findMany({ where: { userId } });
    const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
    const completedHabitsToday = habits.filter(h => h.completed).length;

    // ── Goals ──────────────────────────────────────────
    const goals = await prisma.goal.findMany({ where: { userId } });
    const completedGoals = goals.filter(g => g.isCompleted).length;
    const goalsHitPercent = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;

    return NextResponse.json({
      totalMonthMinutes,
      weeklyAvgMinutes,
      goalsHitPercent,
      completedGoals,
      totalGoals: goals.length,
      bestStreak,
      completedHabitsToday,
      totalHabits: habits.length,
      weeklyData,
      distribution,
      consistency,
    });
  } catch (err) {
    console.error("[statistics GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
