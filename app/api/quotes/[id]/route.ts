import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getSession() {
  cookies();
  return getServerSession(authOptions);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote || quote.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.quote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[quotes DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
