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

    const quotes = await prisma.quote.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(quotes);
  } catch (err) {
    console.error("[quotes GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { text, author } = await req.json();
    if (!text?.trim()) return NextResponse.json({ error: "Quote tidak boleh kosong" }, { status: 400 });

    const quote = await prisma.quote.create({
      data: { text: text.trim(), author: author?.trim() || "Unknown", userId: session.user.id },
    });
    return NextResponse.json(quote);
  } catch (err) {
    console.error("[quotes POST]", err);
    return NextResponse.json({ error: "Gagal menyimpan quote" }, { status: 500 });
  }
}
