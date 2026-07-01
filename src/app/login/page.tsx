import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { authOptions } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === "SUPERADMIN") {
    redirect("/admin");
  }

  if (session?.user?.role === "GUARDIAN") {
    redirect("/");
  }

  return <LoginForm />;
}
