import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="text-xl font-bold">PrintBridge</div>
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="container mx-auto flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
            Streamline Your Print Shop&apos;s Workflow
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Manage print requests from social media, collaborate with your team,
            and delight your customers.
          </p>
          <div className="mt-8 flex gap-4">
            <Link href="/register">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} PrintBridge. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
