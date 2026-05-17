import NextAuth from "next-auth";

// Extend the built-in NextAuth types so TypeScript knows that
// session.user.id exists (populated via the JWT callback).
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
