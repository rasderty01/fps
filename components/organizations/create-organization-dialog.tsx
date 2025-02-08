"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganizationStore } from "@/hooks/store/useOrganizationStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthActions } from "@convex-dev/auth/react";
import TagInputContainer from "../ui/tag-input-presentation";

type MemberRole = "admin" | "member";

interface TeamMember {
  email: string;
  role: MemberRole;
}

export function CreateOrganizationDialog() {
  const { showCreateDialog, setShowCreateDialog, setCurrentOrgId } =
    useOrganizationStore();
  const { signIn } = useAuthActions();
  const currentUser = useQuery(api.users.currentUser);
  const organizations = useQuery(api.organization.list);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createOrg = useMutation(api.organization.create);
  const inviteMembers = useMutation(api.organization.inviteMembers);

  useEffect(() => {
    if (organizations?.length === 0) {
      setShowCreateDialog(true);
    } else if (organizations?.[0]?._id) {
      setCurrentOrgId(organizations[0]._id);
    }
  }, [organizations, setCurrentOrgId, setShowCreateDialog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const org = await createOrg({ name });

      if (org?._id) {
        setCurrentOrgId(org._id);
        const validMembers = members.filter((member) => member.email);
        const currentUserEmail = currentUser?.email;

        if (!currentUserEmail) {
          throw new Error("User email not found");
        }

        if (validMembers.length > 0) {
          const inviteResults = await inviteMembers({
            organizationId: org._id,
            emails: validMembers.map((m) => m.email),
            role: members[0].role,
          });

          await Promise.all(
            validMembers.map(async (member) => {
              const invite = inviteResults.find(
                (r) => r.email === member.email,
              );
              const formData = new FormData();
              formData.set("email", member.email);
              formData.set(
                "redirectTo",
                `/verify?orgName=${encodeURIComponent(name)}&inviter=${encodeURIComponent(currentUserEmail)}&role=${member.role}&email=${member.email}&orgToken=${invite?.token}`,
              );
              return signIn("org-invite", formData);
            }),
          );
        }

        if (step === 1) {
          toast({ title: "Organization created successfully" });
          setShowCreateDialog(false);
        } else {
          toast({
            title: "Organization created! Let's invite some team members",
          });
          setStep(1);
        }
      }
    } catch (error) {
      toast({
        title: "Failed to create organization",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  http: return (
    <Dialog
      open={showCreateDialog}
      onOpenChange={(open) => {
        if (!open && organizations?.length === 0) return;
        setShowCreateDialog(open);
      }}
    >
      <DialogContent
        onInteractOutside={(e) => {
          if (organizations?.length === 0) {
            e.preventDefault();
          }
        }}
        className="sm:max-w-[425px]"
      >
        <DialogHeader>
          <DialogTitle>Create Print Shop</DialogTitle>
          <DialogDescription>
            {step === 0
              ? "Set up your organization to start managing print requests"
              : "Invite team members to collaborate (optional)"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 0 ? (
            <>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Organization Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your print shop name"
                  required
                  disabled={loading}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  onClick={() => !loading && name.trim() && setStep(1)}
                  disabled={loading || !name.trim()}
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <TagInputContainer
                tags={members.map((m) => m.email)}
                onTagsChange={(emails) => {
                  setMembers(
                    emails.map((email) => ({
                      email,
                      role: members[0]?.role || "member",
                    })),
                  );
                }}
                placeholder="Enter email addresses..."
                disabled={loading}
              />
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Select
                    value={members[0]?.role || "member"}
                    onValueChange={(value: MemberRole) => {
                      setMembers(members.map((m) => ({ ...m, role: value })));
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Role: Member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateDialog(false)}
                  disabled={loading}
                >
                  Skip
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Organization"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
