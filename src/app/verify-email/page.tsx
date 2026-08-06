import { VerifyEmailForm } from "@/app/verify-email/VerifyEmailForm";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { token } = await searchParams;
  const cleanToken = Array.isArray(token) ? (token[0] ?? "") : (token ?? "");

  return <VerifyEmailForm token={cleanToken} />;
}
