import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getGuardianStatement } from "@/lib/edupay";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.rut) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const statement = await getGuardianStatement(session.user.rut);

  return NextResponse.json({
    ...statement.guardian,
    students: statement.students,
  });
}
