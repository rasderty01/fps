"use client";

import { useCallback, useState } from "react";
import {
  Preloaded,
  usePreloadedQuery,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/components/ui/use-toast";
import { useOrganizationStore } from "@/hooks/store/useOrganizationStore";
import { InviteMembersFormValues } from "../organizations/invite-members-form";
import { SettingsPeoplePresentation } from "./settings-people-presentation";
import { useAuthActions } from "@convex-dev/auth/react";

interface SettingsPeopleContainerProps {
  preloadedMembers: Preloaded<typeof api.organization.listMembers>;
}

export function SettingsPeopleContainer({
  preloadedMembers,
}: SettingsPeopleContainerProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { signIn } = useAuthActions();
  const { currentOrgId } = useOrganizationStore();

  const canInviteMembers = useQuery(api.organization.canInviteMembers, {
    organizationId: currentOrgId!,
  });

  const { members } = usePreloadedQuery(preloadedMembers);
  const currentMember = members?.find(
    (m) => m.role === "owner" || m.role === "admin",
  );

  const inviteMembers = useMutation(api.organization.inviteMembers);

  const handleInviteMembers = useCallback(
    async (values: InviteMembersFormValues) => {
      if (!currentOrgId) {
        toast({
          title: "Error",
          description: "Organization not found",
          variant: "destructive",
        });
        return;
      }

      if (!canInviteMembers) {
        toast({
          title: "Error",
          description: "You don't have permission to invite members",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      try {
        const inviteResults = await inviteMembers({
          organizationId: currentOrgId,
          emails: values.members.map((m) => m.email),
          role: values.members[0].role,
        });

        // Process successful invites with signIn
        if (inviteResults.successCount > 0) {
          const signInPromises = inviteResults.successful.map(
            async (invite) => {
              const member = values.members.find(
                (m) => m.email === invite.email,
              );
              if (!member || !invite.token || !currentMember?.email) return;

              const formData = new FormData();
              formData.set("email", member.email);
              formData.set(
                "redirectTo",
                `/verify?${new URLSearchParams({
                  inviter: currentMember.email,
                  role: member.role,
                  email: member.email,
                  orgToken: invite.token,
                }).toString()}`,
              );

              try {
                await signIn("org-invite", formData);
                return { email: member.email, status: "success" };
              } catch (error) {
                return {
                  email: member.email,
                  status: "failed",
                  error:
                    error instanceof Error
                      ? error.message
                      : "Failed to send invite email",
                };
              }
            },
          );

          // Wait for all signIn operations to complete
          const signInResults = await Promise.allSettled(signInPromises);

          // Count successful signIns
          const successfulSignIns = signInResults.filter(
            (result) =>
              result.status === "fulfilled" &&
              result.value?.status === "success",
          ).length;

          // Show success toast
          if (successfulSignIns > 0) {
            toast({
              title: "Invitations sent successfully",
              description: `Successfully invited ${successfulSignIns} team member${
                successfulSignIns > 1 ? "s" : ""
              }`,
            });
          }
        }

        // Handle failed invites
        if (inviteResults.failureCount > 0) {
          inviteResults.failed.forEach(({ email, error }) => {
            toast({
              title: `Failed to invite ${email}`,
              description: error,
              variant: "destructive",
            });
          });
        }

        // Show summary if there were both successes and failures
        if (inviteResults.successCount > 0 && inviteResults.failureCount > 0) {
          toast({
            title: "Invitation Summary",
            description: `${inviteResults.successCount} successful, ${inviteResults.failureCount} failed`,
            variant: "default",
          });
        }
      } catch (error) {
        toast({
          title: "Failed to process invitations",
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [
      currentOrgId,
      inviteMembers,
      toast,
      signIn,
      currentMember,
      canInviteMembers,
    ],
  );

  if (!members) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <SettingsPeoplePresentation
      members={members}
      loading={loading}
      onInviteMembers={handleInviteMembers}
      canInvite={canInviteMembers ?? false}
    />
  );
}
