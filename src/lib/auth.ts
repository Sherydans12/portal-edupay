import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { formatGuardianRut } from "@/lib/edupay";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        rut: { label: "RUT", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const rawRut = credentials?.rut?.trim();
        const rut = rawRut ? formatGuardianRut(rawRut) : "";
        const password = credentials?.password;

        if (!rut || !password) {
          return null;
        }

        const tenant = await prisma.tenant.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        });

        if (!tenant) {
          return null;
        }

        const guardian = await prisma.guardianUser.findUnique({
          where: {
            tenantId_rut: {
              tenantId: tenant.id,
              rut,
            },
          },
        });

        if (!guardian) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          guardian.passwordHash,
        );

        if (!isPasswordValid) {
          return null;
        }

        await prisma.guardianUser.update({
          where: { id: guardian.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: guardian.id,
          tenantId: guardian.tenantId,
          rut: guardian.rut,
          name: guardian.rut,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tenantId = user.tenantId;
        token.rut = user.rut;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.tenantId = token.tenantId;
        session.user.rut = token.rut;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
