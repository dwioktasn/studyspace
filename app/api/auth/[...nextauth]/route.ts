import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "johndoe" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Tolong masukkan username dan password");
        }

        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username
          }
        });

        if (!user) {
          throw new Error("Username tidak ditemukan");
        }

        const isPasswordValid = credentials.password === user.password;

        if (!isPasswordValid) {
          throw new Error("Password salah");
        }

        return {
          id: user.id,
          name: user.username,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // NextAuth otomatis set token.sub = user.id,
      // tapi kita simpan juga ke token.id sebagai eksplisit
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Gunakan token.id, fallback ke token.sub (yang NextAuth auto-set)
      if (session.user) {
        session.user.id = (token.id ?? token.sub) as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
