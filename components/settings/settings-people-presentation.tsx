import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  InviteMembersForm,
  InviteMembersFormValues,
} from "../organizations/invite-members-form";

type Member = {
  _id: string;
  email?: string;
  name?: string;
  role: string;
  joinedAt?: number;
  type: "member" | "pending";
  expiresAt?: number;
};

interface SettingsPeoplePresentationProps {
  members: Member[];
  loading: boolean;
  onInviteMembers: (values: InviteMembersFormValues) => Promise<void>;
  canInvite: boolean;
}

export function SettingsPeoplePresentation({
  members,
  loading,
  onInviteMembers,
  canInvite,
}: SettingsPeoplePresentationProps) {
  const activeMembers = members.filter((m) => m.type === "member");
  const pendingInvites = members.filter((m) => m.type === "pending");

  return (
    <div className="space-y-6 w-full">
      {canInvite && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Team Members</CardTitle>
            <CardDescription>
              Add new members to your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteMembersForm onSubmit={onInviteMembers} loading={loading} />
          </CardContent>
        </Card>
      )}
      {activeMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              People with access to your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border rounded-md border">
              {activeMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {member.name || member.email || "Unknown User"}
                    </p>
                    {member.name && member.email && (
                      <p className="text-sm text-muted-foreground">
                        {member.email}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground capitalize">
                      {member.role}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {member.joinedAt &&
                      `Joined ${new Date(member.joinedAt).toLocaleDateString()}`}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pendingInvites.length > 0 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
            <CardDescription>
              People who have been invited but haven&apos;t joined yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border rounded-md border">
              {pendingInvites.map((invite) => (
                <div
                  key={invite._id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{invite.email}</p>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {invite.role}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Expires {new Date(invite.expiresAt!).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {members.length === 0 && (
        <div className="p-4 text-sm text-muted-foreground text-center">
          No members found
        </div>
      )}
    </div>
  );
}
