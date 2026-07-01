import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { formatGuardianRut, getEdupayTenantId } from "@/lib/edupay";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        rut: { label: "RUT o correo electrónico", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.rut?.trim() ?? "";
        const password = credentials?.password;

        if (!identifier || !password) {
          return null;
        }

        const isEmail = identifier.includes("@");
        const rut = isEmail ? "" : formatGuardianRut(identifier);
        const configuredTenantId = process.env.NEXT_PUBLIC_TENANT_ID;
        const guardian = configuredTenantId
          ? await prisma.guardianUser.findFirst({
              where: {
                tenantId: configuredTenantId,
                tenant: {
                  is: {
                    isActive: true,
                  },
                },
                ...(isEmail
                  ? {
                      email: {
                        equals: identifier,
                        mode: "insensitive" as const,
                      },
                    }
                  : { rut }),
              },
            })
          : null;

        if (guardian) {
          const tenantId = getEdupayTenantId();
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
            tenantId,
            rut: guardian.rut,
            name: guardian.rut,
            email: guardian.email,
            role: "GUARDIAN",
          };
        }

        if (!isEmail) {
          getEdupayTenantId();
          return null;
        }

        const admin = await prisma.adminUser.findUnique({
          where: {
            email: identifier.toLowerCase(),
          },
        });

        if (!admin || !(await bcrypt.compare(password, admin.password))) {
          return null;
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
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
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.tenantId = token.tenantId;
        session.user.rut = token.rut;
        session.user.role = token.role;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
