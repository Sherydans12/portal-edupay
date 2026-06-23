import { ResetPasswordForm } from "@/app/reset-password/ResetPasswordForm";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;
  const cleanToken = Array.isArray(token) ? (token[0] ?? "") : (token ?? "");

  return <ResetPasswordForm token={cleanToken} />;
}
