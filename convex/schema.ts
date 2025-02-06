// schema.ts
import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Organizations table
  organizations: defineTable({
    name: v.string(),
    slug: v.string(), // URL-friendly name
    createdAt: v.number(),
    updatedAt: v.number(),
    ownerId: v.id("users"),
    settings: v.object({
      allowMemberInvites: v.boolean(),
      defaultMemberRole: v.string(),
    }),
    status: v.string(), // "active", "inactive", "suspended"
  })
    .index("by_owner", ["ownerId"])
    .index("by_slug", ["slug"]),

  // Organization members
  organizationMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.string(), // "owner", "admin", "member"
    joinedAt: v.number(),
    invitedBy: v.id("users"),
    status: v.string(), // "active", "inactive"
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_org_user", ["organizationId", "userId"]),

  // Member invitations
  organizationInvites: defineTable({
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    invitedBy: v.id("users"),
    status: v.string(), // "pending", "accepted", "expired", "canceled"
  })
    .index("by_organization", ["organizationId"])
    .index("by_email", ["email"])
    .index("by_token", ["token"]),

  // Print requests from customers
  printRequests: defineTable({
    organizationId: v.id("organizations"),
    customerName: v.string(),
    customerEmail: v.string(),
    customerContact: v.string(), // Facebook contact info
    files: v.array(
      v.object({
        storageId: v.string(),
        fileName: v.string(),
        fileSize: v.number(),
        mimeType: v.string(),
        uploadedAt: v.number(),
      }),
    ),
    status: v.string(), // "pending", "processing", "completed", "canceled"
    assignedTo: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_status", ["status"])
    .index("by_customer_email", ["customerEmail"]),

  // Activity logs for audit trail
  activityLogs: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    action: v.string(),
    entityType: v.string(), // "printRequest", "organization", "member"
    entityId: v.string(),
    metadata: v.object({
      previousState: v.optional(v.any()),
      newState: v.optional(v.any()),
      description: v.string(),
    }),
    createdAt: v.number(),
  }).index("by_organization", ["organizationId"]),
});
