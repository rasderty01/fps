"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Printer } from "lucide-react";

function SignInMethodDivider() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">or</span>
      </div>
    </div>
  );
}

export default function RegisterPage() {
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
              Join PrintBridge
            </h2>
            <p className="text-sm text-muted-foreground">
              Create an account to manage your print shop
            </p>
            <SignInWithGitHub />
            <SignInMethodDivider />
            <SignInWithMagicLink handleLinkSent={() => setStep("linkSent")} />
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
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
              Back to sign up
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
