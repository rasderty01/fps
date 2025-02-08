"use client";

import React, { useEffect, useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganizationStore } from "@/hooks/store/useOrganizationStore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  InviteMembersForm,
  InviteMembersFormValues,
} from "./invite-members-form";

const orgNameSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Organization name must be at least 3 characters" })
    .max(20, { message: "Organization name cannot exceed 20 characters" }),
});

type OrgNameFormValues = z.infer<typeof orgNameSchema>;

type CreateOrganizationDialogProps = {
  hasOrgId: boolean;
};

export function CreateOrganizationDialog({
  hasOrgId,
}: CreateOrganizationDialogProps) {
  const { showCreateDialog, setShowCreateDialog, setCurrentOrgId } =
    useOrganizationStore();
  const { signIn } = useAuthActions();
  const currentUser = useQuery(api.users.currentUser);
  const organizations = useQuery(api.organization.list);
  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState("");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createOrg = useMutation(api.organization.create);
  const inviteMembers = useMutation(api.organization.inviteMembers);

  useEffect(() => {
    if (currentUser && organizations !== undefined) {
      const hasNoOrgs = organizations?.length === 0;
      const isLoggedIn = !!currentUser;

      // Only show dialog automatically if user has no organization ID
      if (isLoggedIn && hasNoOrgs && !showCreateDialog && !hasOrgId) {
        setShowCreateDialog(true);
      }
    }
  }, [
    currentUser,
    organizations,
    showCreateDialog,
    setShowCreateDialog,
    hasOrgId,
  ]);

  const orgNameForm = useForm<OrgNameFormValues>({
    resolver: zodResolver(orgNameSchema),
    defaultValues: {
      name: "",
    },
  });

  const handleOrgNameSubmit = async (values: OrgNameFormValues) => {
    setOrgName(values.name);
    setStep(1);
  };

  const handleCreateWithMembers = async (values: InviteMembersFormValues) => {
    setLoading(true);

    try {
      // Step 1: Create the organization
      const org = await createOrg({ name: orgName });
      if (!org?._id) throw new Error("Failed to create organization");

      setCurrentOrgId(org._id);
      const currentUserEmail = currentUser?.email;
      if (!currentUserEmail) throw new Error("User email not found");

      // Step 2: Handle member invitations if any exist
      if (values.members.length > 0) {
        const inviteResults = await inviteMembers({
          organizationId: org._id,
          emails: values.members.map((m) => m.email),
          role: values.members[0].role,
        });

        // Process successful invites
        const signInPromises = inviteResults.successful.map(async (invite) => {
          const member = values.members.find((m) => m.email === invite.email);
          if (!member || !invite.token) return; // Add null check for token

          const formData = new FormData();
          formData.set("email", member.email);
          formData.set(
            "redirectTo",
            `/verify?${new URLSearchParams({
              orgName: orgName,
              inviter: currentUserEmail,
              role: member.role,
              email: member.email,
              orgToken: invite.token, // Now we know token exists
            }).toString()}`,
          );

          try {
            await signIn("org-invite", formData);
            return { email: member.email, status: "success" as const };
          } catch (error) {
            return {
              email: member.email,
              status: "failed" as const,
              error,
            };
          }
        });

        // Process sign-in results
        const signInResults = await Promise.allSettled(signInPromises);
        // Count successful and failed invites
        const successfulInvites = inviteResults.successCount;
        const failedInvites = inviteResults.failureCount;

        // Show appropriate toast messages
        if (successfulInvites > 0) {
          toast({
            title: `Organization created with ${successfulInvites} team member${successfulInvites > 1 ? "s" : ""}`,
            description:
              failedInvites > 0
                ? `${failedInvites} invitation${failedInvites > 1 ? "s" : ""} failed to send`
                : undefined,
          });
        }

        // Show failed invites in separate toasts
        inviteResults.failed.forEach(({ email, error }) => {
          toast({
            title: `Failed to invite ${email}`,
            description: error,
            variant: "destructive",
          });
        });
      } else {
        // No members to invite
        toast({
          title: "Organization created successfully",
        });
      }

      setShowCreateDialog(false);
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

  const handleSkip = async () => {
    setLoading(true);
    try {
      const org = await createOrg({ name: orgName });
      if (org?._id) {
        setCurrentOrgId(org._id);
        toast({
          title: "Organization created successfully",
        });
        setShowCreateDialog(false);
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

  const canCloseDialog =
    hasOrgId || (organizations && organizations.length > 0);

  return (
    <Dialog
      open={showCreateDialog}
      onOpenChange={(open) => {
        if (!open && !canCloseDialog) return;
        setShowCreateDialog(open);
        if (open) {
          setStep(0);
          setOrgName("");
          orgNameForm.reset();
        }
      }}
    >
      <DialogContent
        onInteractOutside={(e) => {
          if (!canCloseDialog) {
            e.preventDefault();
          }
        }}
        className="sm:max-w-[425px]"
      >
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            {step === 0
              ? "Set up your organization to start managing print requests"
              : "Invite team members to collaborate (optional)"}
          </DialogDescription>
        </DialogHeader>

        {step === 0 ? (
          <Form {...orgNameForm}>
            <form
              onSubmit={orgNameForm.handleSubmit(handleOrgNameSubmit)}
              className="space-y-4"
            >
              <FormField
                control={orgNameForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your print shop name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  Next
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <InviteMembersForm
            onSubmit={handleCreateWithMembers}
            onSkip={handleSkip}
            loading={loading}
            showSkip={true}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
