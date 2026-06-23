import { getGuardianPortalData } from "@/lib/edupay";
import { PortalApp } from "@/components/PortalApp";

export default async function Home() {
  const guardian = await getGuardianPortalData();

  return <PortalApp guardian={guardian} />;
}
