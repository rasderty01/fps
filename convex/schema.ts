import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// Define enums as unions
const OrganizationStatus = v.union(
  v.literal("active"),
  v.literal("inactive"),
  v.literal("suspended"),
);

const MemberRole = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("member"),
);

const MemberStatus = v.union(v.literal("active"), v.literal("inactive"));

const InviteStatus = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("expired"),
  v.literal("canceled"),
);

const PrintRequestStatus = v.union(
  v.literal("pending"),
  v.literal("processing"),
  v.literal("completed"),
  v.literal("canceled"),
);

export type UsersType = Infer<typeof authTables.users.validator>;

export default defineSchema({
  ...authTables,

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    ownerId: v.id("users"),
    settings: v.object({
      allowMemberInvites: v.boolean(),
      defaultMemberRole: MemberRole,
    }),
    status: OrganizationStatus,
  })
    .index("by_owner", ["ownerId"])
    .index("by_slug", ["slug"]),

  organizationMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: MemberRole,
    joinedAt: v.number(),
    invitedBy: v.id("users"),
    status: MemberStatus,
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_org_user", ["organizationId", "userId"]),

  organizationInvites: defineTable({
    organizationId: v.id("organizations"),
    email: v.string(),
    role: MemberRole,
    token: v.string(),
    expiresAt: v.number(),
    invitedBy: v.id("users"),
    status: InviteStatus,
    lastSentAt: v.optional(v.number()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_email", ["email"])
    .index("by_token", ["token"]),

  printRequests: defineTable({
    organizationId: v.id("organizations"),
    customerName: v.string(),
    customerEmail: v.string(),
    customerContact: v.string(),
    files: v.array(
      v.object({
        storageId: v.string(),
        fileName: v.string(),
        fileSize: v.number(),
        mimeType: v.string(),
        uploadedAt: v.number(),
      }),
    ),
    status: PrintRequestStatus,
    assignedTo: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_status", ["status"])
    .index("by_customer_email", ["customerEmail"]),

  activityLogs: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    action: v.string(),
    entityType: v.union(
      v.literal("printRequest"),
      v.literal("organization"),
      v.literal("member"),
    ),
    entityId: v.string(),
    metadata: v.object({
      previousState: v.optional(v.any()),
      newState: v.optional(v.any()),
      description: v.string(),
    }),
    createdAt: v.number(),
  }).index("by_organization", ["organizationId"]),
});
