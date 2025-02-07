"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function SignInWithToken({
  token,
  email,
  inviteToken,
}: {
  token: string;
  email: string;
  inviteToken: string;
}) {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const verifyAndSignIn = async () => {
      try {
        // Sign in with OTP
        await signIn("resend-otp", {
          email,
          code: token,
        });

        // Accept invitation (this will run after successful sign-in)
        await fetch("/api/verify-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: inviteToken, email }),
        });

        // Redirect to dashboard
        router.push("/dashboard");
      } catch (err) {
        console.error(err);
        setError("Failed to verify. Please try again.");
      }
    };

    verifyAndSignIn();
  }, [token, email, inviteToken]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return <div>Verifying your invitation...</div>;
}
