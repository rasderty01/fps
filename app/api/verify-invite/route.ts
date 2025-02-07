import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const { token, email } = await req.json();

    // Accept the invitation
    await client.mutation(api.invites.acceptInvite, {
      token,
      email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("Failed to verify invitation:", error);
    return NextResponse.json(
      { error: "Failed to verify invitation" },
      { status: 500 },
    );
  }
}
