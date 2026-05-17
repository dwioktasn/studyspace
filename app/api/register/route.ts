import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Username sudah terdaftar' },
        { status: 400 }
      );
    }

    // Create user with plain text password (NOT RECOMMENDED for production)
    const newUser = await prisma.user.create({
      data: {
        username,
        password: password,
      }
    });

    return NextResponse.json(
      { message: 'Registrasi berhasil', user: { username: newUser.username } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan di server' },
      { status: 500 }
    );
  }
}
