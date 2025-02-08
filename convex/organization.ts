import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

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

// organization.ts
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get owned organizations
    const ownedOrganizations = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("ownerId"), userId))
      .collect();

    // Get member organizations
    const memberships = await ctx.db
      .query("organizationMembers")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("status"), "active"),
        ),
      )
      .collect();

    const memberOrgIds = memberships.map((m) => m.organizationId);

    const memberOrganizations = await Promise.all(
      memberOrgIds.map((id) => ctx.db.get(id)),
    );

    // Combine and format the results
    const organizations = [
      ...ownedOrganizations.map((org) => ({
        ...org,
        role: "owner" as const,
      })),
      ...memberOrganizations.filter(Boolean).map((org) => ({
        ...org!,
        role: memberships.find((m) => m.organizationId === org!._id)?.role,
      })),
    ];

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
    const results = [];
    const errors = [];

    // Process each invite sequentially
    for (const email of emails) {
      try {
        // Check if an invite has already been sent
        const existingInvite = await ctx.db
          .query("organizationInvites")
          .filter((q) =>
            q.and(
              q.eq(q.field("organizationId"), organizationId),
              q.eq(q.field("email"), email),
              q.eq(q.field("status"), "pending"),
            ),
          )
          .first();

        if (existingInvite) {
          errors.push({
            email,
            error: "Invite already sent to this email",
          });
          continue;
        }

        const inviteId = await createInvite(
          ctx,
          organizationId,
          email,
          role,
          userId,
          timestamp,
        );
        const invite = await ctx.db.get(inviteId);

        results.push({
          email,
          token: invite?.token,
          status: "success",
        });
      } catch (error) {
        errors.push({
          email,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }

    // Return both successful invites and errors
    return {
      successful: results,
      failed: errors,
      totalProcessed: emails.length,
      successCount: results.length,
      failureCount: errors.length,
    };
  },
});

export const listMembers = query({
  args: {
    organizationId: v.id("organizations"),
  },
  async handler(ctx, args) {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check user's role in the organization
    const userMembership = await ctx.db
      .query("organizationMembers")
      .filter((q) =>
        q.and(
          q.eq(q.field("organizationId"), args.organizationId),
          q.eq(q.field("userId"), userId),
          q.eq(q.field("status"), "active"),
        ),
      )
      .first();

    const isOwner = await ctx.db
      .query("organizations")
      .filter((q) =>
        q.and(
          q.eq(q.field("_id"), args.organizationId),
          q.eq(q.field("ownerId"), userId),
        ),
      )
      .first();

    // If user has no relation to the organization, they can't view anything
    if (!userMembership && !isOwner) {
      throw new Error("Not a member of this organization");
    }

    // Get all active members
    const members = await ctx.db
      .query("organizationMembers")
      .filter((q) =>
        q.and(
          q.eq(q.field("organizationId"), args.organizationId),
          q.eq(q.field("status"), "active"),
        ),
      )
      .collect();

    // Get pending invites if user is owner or admin
    let pendingInvites = [] as Doc<"organizationInvites">[];
    if (isOwner || userMembership?.role === "admin") {
      pendingInvites = await ctx.db
        .query("organizationInvites")
        .filter((q) =>
          q.and(
            q.eq(q.field("organizationId"), args.organizationId),
            q.eq(q.field("status"), "pending"),
          ),
        )
        .collect();
    }

    // Get user details for each member
    const memberDetails = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          _id: member._id,
          userId: member.userId,
          email: user?.email,
          name: user?.name,
          role: member.role,
          joinedAt: member.joinedAt,
          invitedBy: member.invitedBy,
          type: "member" as const,
        };
      }),
    );

    // Format pending invites
    const formattedInvites = pendingInvites.map((invite) => ({
      _id: invite._id,
      email: invite.email,
      role: invite.role,
      type: "pending" as const,
      invitedBy: invite.invitedBy,
      expiresAt: invite.expiresAt,
    }));

    // Return combined results with user's permissions
    return {
      members: [...memberDetails, ...formattedInvites],
      userRole: isOwner ? "owner" : userMembership?.role || "member",
      canInvite: isOwner || userMembership?.role === "admin",
    };
  },
});

export const isOrgOwner = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }

    return org.ownerId === userId;
  },
});

export const canInviteMembers = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }

    const membership = await ctx.db
      .query("organizationMembers")
      .filter((q) =>
        q.and(
          q.eq(q.field("organizationId"), args.organizationId),
          q.eq(q.field("userId"), userId),
          q.eq(q.field("status"), "active"),
        ),
      )
      .first();

    return org.ownerId === userId || membership?.role === "admin";
  },
});
