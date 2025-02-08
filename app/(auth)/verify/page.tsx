"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/components/ui/use-toast";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { signIn } = useAuthActions();
  const acceptInvite = useMutation(api.invites.acceptInvite);

  const email = searchParams.get("email");
  const code = searchParams.get("inviteToken");
  const orgToken = searchParams.get("orgToken") || "";

  useEffect(() => {
    if (!email || !code) {
      toast({
        title: "Invalid verification link",
        description: "Please check your email for a valid invite link.",
        variant: "destructive",
      });
      return;
    }
    const formData = new FormData();
    formData.append("email", email);
    formData.append("code", code);
    formData.append("orgToken", orgToken);

    const verifyInvite = async () => {
      try {
        await signIn(
          "org-invite",
          (() => {
            return formData;
          })(),
        );

        await acceptInvite({ orgtoken: orgToken, email });
        toast({ title: "Successfully joined organization!" });
        router.push("/dashboard");
      } catch (error) {
        toast({
          title: "Verification failed",
          description:
            error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });
      }
    };

    verifyInvite();
  }, [email, code, signIn, acceptInvite, router, toast]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Verifying invitation...</h1>
        <p className="text-muted-foreground">
          Please wait while we process your invite.
        </p>
      </div>
    </div>
  );
}
