import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Demo / Admin Account",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@creator.local" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase() || "demo@creator.local";
        const name = email.split("@")[0].toUpperCase();

        try {
          // Attempt to find or create in DB if database is connected
          let user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                name,
                credits: 50,
              },
            });
          }
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            credits: user.credits,
          };
        } catch (dbError) {
          console.warn("[AUTH_DB_FALLBACK] Database offline or unreachable, using local session user:", dbError.message);
          // Resilient fallback so users can always test and preview the application
          return {
            id: "demo-user-" + Buffer.from(email).toString("hex").slice(0, 12),
            name: name || "Demo User",
            email: email,
            credits: 50,
          };
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.credits = user.credits ?? 50;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id || token.sub;
        session.user.credits = token.credits ?? 50;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "free-ai-social-media-scheduler-fallback-secret-2025",
  pages: {
    signIn: "/login",
  },
};

