import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PortalApp } from "@/components/PortalApp";
import { authOptions } from "@/lib/auth";
import { getGuardianStatement } from "@/lib/edupay";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === "SUPERADMIN") {
    redirect("/admin");
  }

  if (session?.user?.role !== "GUARDIAN" || !session.user.rut) {
    redirect("/login");
  }

  const statement = await getGuardianStatement(session.user.rut);

  return <PortalApp statement={statement} />;
}
