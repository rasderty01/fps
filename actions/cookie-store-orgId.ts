// lib/cookies/organization.ts
"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "currentOrgId";

interface CookieOptions {
  expires?: Date;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

const DEFAULT_OPTIONS: CookieOptions = {
  // Set cookie to expire in 30 days
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  // Restrict cookie to all paths
  path: "/",
  // Only send cookie over HTTPS in production
  secure: process.env.NODE_ENV === "production",
  // Prevent access from client-side JavaScript
  httpOnly: true,
  // Strict same-site policy for security
  sameSite: "strict",
};

export async function setCurrentOrgId(orgId: string, options?: CookieOptions) {
  if (!orgId) {
    throw new Error("Organization ID is required");
  }

  const cookieStore = await cookies();
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    cookieStore.set({
      name: COOKIE_NAME,
      value: orgId,
      ...mergedOptions,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to set organization cookie:", error);
    throw new Error("Failed to set organization cookie");
  }
}

export async function getCurrentOrgId(): Promise<string | null> {
  const cookieStore = await cookies();
  const orgId = cookieStore.get(COOKIE_NAME);

  return orgId?.value ?? null;
}

export async function removeCurrentOrgId() {
  const cookieStore = await cookies();

  try {
    cookieStore.delete(COOKIE_NAME);
    return { success: true };
  } catch (error) {
    console.error("Failed to remove organization cookie:", error);
    throw new Error("Failed to remove organization cookie");
  }
}

// Helper to check if org cookie exists
export async function hasOrgCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(COOKIE_NAME);
}
