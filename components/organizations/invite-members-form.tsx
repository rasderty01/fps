"use client";

import React, { useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import TagInputContainer from "../ui/tag-input-presentation";

export const inviteMembersSchema = z.object({
  members: z
    .array(
      z.object({
        email: z.string().email({ message: "Invalid email address" }),
        role: z.enum(["admin", "member"]),
      }),
    )
    .min(1, { message: "Add at least one member" }),
});

export type InviteMembersFormValues = z.infer<typeof inviteMembersSchema>;

interface InviteMembersFormProps {
  onSubmit: (values: InviteMembersFormValues) => Promise<void>;
  onSkip?: () => void;
  loading?: boolean;
  showSkip?: boolean;
}

export function InviteMembersForm({
  onSubmit,
  onSkip,
  loading = false,
  showSkip = false,
}: InviteMembersFormProps) {
  // Track role separately from form state
  const [selectedRole, setSelectedRole] = useState<"admin" | "member">(
    "member",
  );

  const form = useForm<InviteMembersFormValues>({
    resolver: zodResolver(inviteMembersSchema),
    defaultValues: {
      members: [],
    },
  });

  const handleSubmit = async (values: InviteMembersFormValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="members"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Members</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <TagInputContainer
                    tags={field.value.map((m) => m.email)}
                    onTagsChange={(emails) => {
                      field.onChange(
                        emails.map((email) => ({
                          email,
                          role: selectedRole,
                        })),
                      );
                    }}
                    placeholder="Enter email addresses..."
                    disabled={loading}
                  />

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Select
                        value={selectedRole}
                        onValueChange={(value: "admin" | "member") => {
                          setSelectedRole(value);
                          // Update all existing members with the new role
                          const updatedMembers = field.value.map((member) => ({
                            ...member,
                            role: value,
                          }));
                          form.setValue("members", updatedMembers, {
                            shouldValidate: true,
                          });
                        }}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role">
                            {selectedRole === "admin" ? "Admin" : "Member"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {showSkip && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={onSkip}
                        disabled={loading}
                      >
                        Skip
                      </Button>
                    )}
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Inviting...
                        </>
                      ) : (
                        "Invite Members"
                      )}
                    </Button>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
