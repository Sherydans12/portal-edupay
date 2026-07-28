import { NextResponse } from "next/server";
import { checkEdupayConnection } from "@/lib/edupay";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await Promise.all([
      prisma.$queryRaw`SELECT 1`,
      checkEdupayConnection(),
    ]);

    return NextResponse.json(
      { status: "ok", timestamp, db: "connected" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "Health check failed",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { status: "error", timestamp, db: "disconnected" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
