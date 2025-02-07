"use client";
import { FormEvent, useEffect, useState } from "react";
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

type MemberRole = "admin" | "member";

interface TeamMember {
  email: string;
  role: MemberRole;
}

interface CreateOrgFormProps {
  name: string;
  loading: boolean;
  members: TeamMember[];
  step: number;
  onNameChange: (value: string) => void;
  onMemberChange: (
    index: number,
    field: keyof TeamMember,
    value: string,
  ) => void;
  onAddMember: () => void;
  onRemoveMember: (index: number) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onNext: () => void;
  onBack: () => void;
}

const CreateOrgForm = ({
  name,
  loading,
  members,
  step,
  onNameChange,
  onMemberChange,
  onAddMember,
  onRemoveMember,
  onSubmit,
  // onCancel,
  onNext,
  onBack,
}: CreateOrgFormProps) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      if (step === 1) {
        onSubmit(e);
      }
    }}
    className="space-y-4"
  >
    {step === 0 && (
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Organization Name
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter your print shop name"
          required
          disabled={loading}
        />
      </div>
    )}

    {step === 1 && (
      <div className="space-y-4">
        {members.map((member, index) => (
          <div key={index} className="flex gap-2">
            <Input
              type="email"
              value={member.email}
              onChange={(e) => onMemberChange(index, "email", e.target.value)}
              placeholder="team@example.com"
              disabled={loading}
              className="flex-1"
            />
            <Select
              value={member.role}
              onValueChange={(value: MemberRole) =>
                onMemberChange(index, "role", value)
              }
              disabled={loading}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onRemoveMember(index)}
              disabled={loading}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={onAddMember}
          className="w-full"
          disabled={loading}
        >
          Add Member
        </Button>
      </div>
    )}

    <div className="flex justify-end gap-3">
      {step === 1 && (
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
      )}
      {step === 0 ? (
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onNext();
          }}
          disabled={!name.trim()}
        >
          Next
        </Button>
      ) : (
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create"}
        </Button>
      )}
    </div>
  </form>
);

export function CreateOrganizationDialog() {
  const { showCreateDialog, setShowCreateDialog, setCurrentOrgId } =
    useOrganizationStore();
  const { signIn } = useAuthActions();
  const currentUser = useQuery(api.users.currentUser);
  const organizations = useQuery(api.organization.list);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([
    { email: "", role: "member" },
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createOrg = useMutation(api.organization.create);
  const inviteMembers = useMutation(api.organization.inviteMembers);

  useEffect(() => {
    const hasNoOrgs = organizations?.length === 0;
    if (hasNoOrgs) {
      setShowCreateDialog(true);
    } else if (organizations?.[0]?._id) {
      setCurrentOrgId(organizations[0]._id);
    }
  }, [organizations]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
          await Promise.all(
            validMembers.map(async (member) => {
              const signInParams = new URLSearchParams({
                orgName: name,
                inviter: currentUserEmail, // Get from auth context
                role: member.role,
              });

              await signIn("org-invite", {
                email: member.email,
                redirectTo: `/dashboard?${signInParams.toString()}`,
              });

              return inviteMembers({
                organizationId: org._id,
                emails: [member.email],
                role: member.role,
              });
            }),
          );
        }
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

  const handleAddMember = () =>
    setMembers([...members, { email: "", role: "member" }]);

  const handleRemoveMember = (index: number) =>
    setMembers(members.filter((_, i) => i !== index));

  const handleMemberChange = (
    index: number,
    field: keyof TeamMember,
    value: string,
  ) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && organizations?.length === 0) {
      return;
    }
    setShowCreateDialog(open);
  };

  return (
    <Dialog open={showCreateDialog} onOpenChange={handleOpenChange}>
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
        <CreateOrgForm
          name={name}
          loading={loading}
          members={members}
          step={step}
          onNameChange={setName}
          onMemberChange={handleMemberChange}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          onSubmit={handleSubmit}
          onCancel={() => setShowCreateDialog(false)}
          onNext={() => setStep(1)}
          onBack={() => setStep(0)}
        />
      </DialogContent>
    </Dialog>
  );
}
