import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const get = query({
  args: {
    id: v.id("organizations"),
  },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const org = await ctx.db.get(id);
    if (org?.ownerId !== userId) {
      throw new Error("Not authorized");
    }

    return org;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const timestamp = Date.now();
    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const orgId = await ctx.db.insert("organizations", {
      name,
      slug,
      createdAt: timestamp,
      updatedAt: timestamp,
      ownerId: userId,
      settings: {
        allowMemberInvites: true,
        defaultMemberRole: "member",
      },
      status: "active",
    });

    const org = await ctx.db.get(orgId);
    return org;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const organizations = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("ownerId"), userId))
      .collect();

    return organizations;
  },
});

type MemberRole = "admin" | "member";

async function createInvite(
  ctx: MutationCtx,
  organizationId: string & { __tableName: "organizations" },
  email: string,
  role: MemberRole,
  userId: Id<"users">,
  timestamp: number,
) {
  const token = crypto.randomUUID();
  return ctx.db.insert("organizationInvites", {
    organizationId,
    email,
    role,
    token,
    expiresAt: timestamp + 7 * 24 * 60 * 60 * 1000,
    invitedBy: userId,
    status: "pending",
  });
}

export const inviteMembers = mutation({
  args: {
    organizationId: v.id("organizations"),
    emails: v.array(v.string()),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, { organizationId, emails, role }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const timestamp = Date.now();
    return Promise.all(
      emails.map((email) =>
        createInvite(ctx, organizationId, email, role, userId, timestamp),
      ),
    );
  },
});
