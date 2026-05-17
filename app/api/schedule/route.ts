import { NextRequest, NextResponse } from "next/server";
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

    const schedules = await prisma.schedule.findMany({
      where: { userId: session.user.id },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(schedules);
  } catch (err) {
    console.error("[schedule GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { day, startTime, endTime, room, courseCode, courseName, lecturerCode, classCode } = body;

    if (!day || !startTime || !endTime || !room || !courseCode || !courseName) {
      return NextResponse.json({ error: "Field wajib tidak boleh kosong" }, { status: 400 });
    }

    const schedule = await prisma.schedule.create({
      data: {
        day: day.toUpperCase(),
        startTime,
        endTime,
        room,
        courseCode,
        courseName,
        lecturerCode: lecturerCode || null,
        classCode: classCode || null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(schedule);
  } catch (err) {
    console.error("[schedule POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
