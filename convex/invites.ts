import { internalMutation, mutation } from "./_generated/server";
import { Resend } from "resend";
import { alphabet, generateRandomString } from "oslo/crypto";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const processInvites = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const pendingInvites = await ctx.db
      .query("organizationInvites")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    const resend = new Resend(process.env.AUTH_RESEND_KEY!);

    for (const invite of pendingInvites) {
      const organization = await ctx.db.get(invite.organizationId);
      if (!organization) continue;

      try {
        // Generate OTP
        const otp = generateVerificationToken();

        const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${otp}&email=${invite.email}&inviteToken=${invite.token}`;

        await resend.emails.send({
          from: "Your Organization <invites@yourorg.com>",
          to: [invite.email],
          subject: `Invitation to Join ${organization.name}`,
          html: `
            <h1>You've been invited to join ${organization.name}</h1>
            <p>Your verification code is: <strong>${otp}</strong></p>
            <p>Or click this link to join automatically:</p>
            <a href="${magicLink}">Accept Invitation</a>
            <p>This link will expire in 15 minutes.</p>
          `,
        });

        await ctx.db.patch(invite._id, {
          lastSentAt: now,
        });
      } catch (error) {
        console.error("Failed to send invite email:", error);
      }
    }
  },
});

async function generateVerificationToken() {
  return generateRandomString(8, alphabet("0-9"));
}

export const acceptInvite = mutation({
  args: { token: v.string(), email: v.string() },
  handler: async (ctx, { token, email }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invite = await ctx.db
      .query("organizationInvites")
      .filter((q) => q.eq(q.field("token"), token))
      .filter((q) => q.eq(q.field("email"), email))
      .first();

    if (!invite) throw new Error("Invalid invitation");

    // Update invite status
    await ctx.db.patch(invite._id, { status: "accepted" });

    // Create organization member
    await ctx.db.insert("organizationMembers", {
      organizationId: invite.organizationId,
      userId, // Use the authenticated user's ID
      role: invite.role,
      joinedAt: Date.now(),
      invitedBy: invite.invitedBy,
      status: "active",
    });

    return invite.organizationId;
  },
});
