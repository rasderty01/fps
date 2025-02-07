"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { SignInMethodDivider } from "@/components/SignInMethodDivider";
import { Printer } from "lucide-react";

export default function LoginPage() {
  const [step, setStep] = useState<"signIn" | "linkSent">("signIn");

  return (
    <div className="flex min-h-screen w-full max-w-sm container mx-auto">
      <div className="w-full mx-auto flex flex-col my-auto gap-4 pb-8">
        <Link
          href="/"
          className="text-xl font-bold mb-8 flex items-center gap-2"
        >
          <Printer className="size-5" /> PrintBridge
        </Link>

        {step === "signIn" ? (
          <>
            <h2 className="font-semibold text-2xl tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in to manage your print shop
            </p>
            <SignInWithGitHub />
            <SignInMethodDivider />
            <SignInWithMagicLink handleLinkSent={() => setStep("linkSent")} />
            <p className="text-sm text-muted-foreground text-center">
              {`Don't have an account? `}
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </>
        ) : (
          <>
            <h2 className="font-semibold text-2xl tracking-tight">
              Check your email
            </h2>
            <p className="text-muted-foreground">
              A sign-in link has been sent to your email address.
            </p>
            <Button
              className="p-0 self-start"
              variant="link"
              onClick={() => setStep("signIn")}
            >
              Back to sign in
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function SignInWithGitHub() {
  const { signIn } = useAuthActions();
  return (
    <Button
      className="flex-1"
      variant="outline"
      onClick={() => signIn("github", { redirectTo: "/dashboard" })}
    >
      <GitHubLogoIcon className="mr-2 h-4 w-4" /> Continue with GitHub
    </Button>
  );
}

function SignInWithMagicLink({
  handleLinkSent,
}: {
  handleLinkSent: () => void;
}) {
  const { signIn } = useAuthActions();
  const { toast } = useToast();

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.set("redirectTo", "/dashboard");
        signIn("resend", formData)
          .then(handleLinkSent)
          .catch((error) => {
            console.error(error);
            toast({
              title: "Could not send sign-in link",
              description: "Please try again later",
              variant: "destructive",
            });
          });
      }}
    >
      <label htmlFor="email" className="text-sm font-medium">
        Email address
      </label>
      <Input
        name="email"
        id="email"
        type="email"
        autoComplete="email"
        placeholder="name@example.com"
        required
      />
      <Button type="submit" className="mt-2">
        Continue with Email
      </Button>
      <Toaster />
    </form>
  );
}
