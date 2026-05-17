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

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const allSessions = await prisma.focusSession.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
    const habits = await prisma.habit.findMany({ where: { userId } });
    const goals = await prisma.goal.findMany({ where: { userId } });

    // Total focus minutes
    const totalMinutes = allSessions.reduce((s, f) => s + f.duration, 0);

    // Best streak across habits
    const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

    // Goals completed
    const goalsCompleted = goals.filter(g => g.isCompleted).length;

    // Total sessions
    const totalSessions = allSessions.length;

    // Avg session duration
    const avgSession = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

    // Focus history — last 12 weeks (minutes per week)
    const weeklyHistory = Array.from({ length: 12 }, (_, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (11 - i) * 7 - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const mins = allSessions
        .filter(s => {
          const d = new Date(s.createdAt);
          return d >= weekStart && d < weekEnd;
        })
        .reduce((sum, s) => sum + s.duration, 0);
      return { week: `W${i + 1}`, minutes: mins };
    });

    // Best day of week
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];
    allSessions.forEach(s => {
      dayTotals[new Date(s.createdAt).getDay()] += s.duration;
    });
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const bestDayIdx = dayTotals.indexOf(Math.max(...dayTotals));
    const bestDayMinutes = dayTotals[bestDayIdx];

    // Favorite session type
    const typeMap: Record<string, number> = {};
    allSessions.forEach(s => { typeMap[s.type] = (typeMap[s.type] || 0) + 1; });
    const favoriteType = Object.entries(typeMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    // Achievements (computed from real data)
    const achievements = [
      { id: "first_session", emoji: "🌱", name: "Sprout", desc: "Complete your first focus session", earned: totalSessions >= 1 },
      { id: "bookworm", emoji: "📚", name: "Bookworm", desc: "Log 5 sessions", earned: totalSessions >= 5 },
      { id: "on_fire", emoji: "🔥", name: "On fire", desc: "3-day habit streak", earned: bestStreak >= 3 },
      { id: "night_owl", emoji: "🌙", name: "Night owl", desc: "Log 10 focus sessions", earned: totalSessions >= 10 },
      { id: "goal_setter", emoji: "🎯", name: "Goal setter", desc: "Complete 3 goals", earned: goalsCompleted >= 3 },
      { id: "champion", emoji: "🏆", name: "Champion", desc: "7-day streak", earned: bestStreak >= 7 },
      { id: "deep_worker", emoji: "💎", name: "Deep worker", desc: "Log 25 focus sessions", earned: totalSessions >= 25 },
      { id: "marathon", emoji: "⚡", name: "Marathon", desc: "Total 10h focus time", earned: totalMinutes >= 600 },
      { id: "journaler", emoji: "✍️", name: "Journaler", desc: "Write 5 journal entries", earned: (await prisma.journal.count({ where: { userId } })) >= 5 },
    ];

    return NextResponse.json({
      username: user?.username || "user",
      joinedAt: user?.createdAt,
      totalMinutes,
      bestStreak,
      goalsCompleted,
      totalSessions,
      avgSession,
      bestDay: dayNames[bestDayIdx],
      bestDayMinutes,
      favoriteType,
      weeklyHistory,
      achievements,
    });
  } catch (err) {
    console.error("[profile GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
