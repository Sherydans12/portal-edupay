import { NextResponse } from "next/server";
import { logCriticalError } from "@/lib/critical-error";
import { checkEdupayConnection } from "@/lib/edupay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await checkEdupayConnection();

    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logCriticalError({ path: "/api/health", error });

    return NextResponse.json(
      { status: "unavailable", timestamp: new Date().toISOString() },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
