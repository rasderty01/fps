import { SignInWithToken } from "@/components/auth/sign-in-with-token";

export default function VerifyPage({
  searchParams,
}: {
  searchParams: { token?: string; email?: string; inviteToken?: string };
}) {
  const { token, email, inviteToken } = searchParams;

  if (!token || !email || !inviteToken) {
    return <div>Invalid verification link</div>;
  }

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <SignInWithToken token={token} email={email} inviteToken={inviteToken} />
    </div>
  );
}
