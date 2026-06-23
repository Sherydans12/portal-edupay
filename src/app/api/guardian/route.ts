import { NextResponse } from "next/server";
import { mockGuardian } from "@/data/mock";

export async function GET() {
  return NextResponse.json(mockGuardian);
}
