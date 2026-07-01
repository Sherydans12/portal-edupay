import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { tenants } from "@/data/tenants";
import { Providers } from "@/app/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Colegio Conquistadores | Portal de Pagos",
  description: "Portal de pagos para apoderados.",
};

const currentTenant = tenants["conquistadores"];
const themeStyles = {
  "--tenant-primary": currentTenant.colors.primary,
  "--tenant-secondary": currentTenant.colors.secondary,
  "--tenant-bg": currentTenant.colors.background,
} as React.CSSProperties;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={themeStyles}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
