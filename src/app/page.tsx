import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PortalApp } from "@/components/PortalApp";
import { AccountStatementSkeleton } from "@/components/dashboard/AccountStatementSkeleton";
import { authOptions } from "@/lib/auth";
import {
  getGuardianStatement,
  type EdupayStatementResponse,
} from "@/lib/edupay";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === "SUPERADMIN") {
    redirect("/admin");
  }

  if (session?.user?.role !== "GUARDIAN" || !session.user.rut) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<AccountStatementSkeleton />}>
      <AccountStatementContent guardianRut={session.user.rut} />
    </Suspense>
  );
}

async function AccountStatementContent({ guardianRut }: { guardianRut: string }) {
  let statement: EdupayStatementResponse | null = null;

  try {
    statement = await getGuardianStatement(guardianRut);
  } catch (error) {
    console.error(
      "No se pudo cargar el estado de cuenta desde EduPay:",
      error instanceof Error ? error.message : "Error desconocido",
    );
  }

  return <PortalApp statement={statement} guardianRut={guardianRut} />;
}
