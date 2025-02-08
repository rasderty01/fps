import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface InviteMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (emails: string[], role: string) => void;
  loading?: boolean;
}

export function InviteMembersModal({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
}: InviteMembersModalProps) {
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState("member");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const emailList = emails
      .split(/[,\s]+/)
      .map((email) => email.trim())
      .filter((email) => email);
    onSubmit(emailList, role);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-6">
            Invite new members
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Input
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="example@email.com, example2@email.com"
              className="min-h-[120px] resize-none py-2 text-base"
            />
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select value={role} onValueChange={setRole} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
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
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Skip
              </Button>
              <Button type="submit" disabled={!emails.trim() || loading}>
                {loading ? "Sending..." : "Send invitations"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
