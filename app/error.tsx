"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  const copyError = async () => {
    await navigator.clipboard.writeText(
      error.message || "An unexpected error occurred",
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="max-w-3xl space-y-6 text-center">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <div className="relative rounded-lg bg-muted p-4">
          <p className="break-words p-4 text-left text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred"}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={copyError}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex justify-center gap-4">
          <Button onClick={() => reset()}>Try again</Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
