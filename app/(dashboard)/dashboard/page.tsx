"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CreateOrganizationDialog } from "@/components/organizations/create-organization-dialog";
import { useOrganizationStore } from "@/hooks/store/useOrganizationStore";

export default function DashboardPage() {
  const organizations = useQuery(api.organization.list);
  const { currentOrgId } = useOrganizationStore();

  if (organizations === undefined) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <CreateOrganizationDialog />
      {currentOrgId ? (
        <div>Organization Dashboard Content</div>
      ) : (
        <div className="flex h-[80vh] items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">Welcome to PrintBridge</h2>
            <p className="text-muted-foreground">Creating your print shop...</p>
          </div>
        </div>
      )}
    </>
  );
}
