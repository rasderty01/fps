"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CaretSortIcon, PlusIcon, PersonIcon } from "@radix-ui/react-icons";
import { useOrganizationStore } from "@/hooks/store/useOrganizationStore";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { CrownIcon } from "lucide-react";
import { setCurrentOrgId } from "@/actions/cookie-store-orgId";

type OrgSwitcherProps = {
  orgId: string;
};

export function OrganizationSwitcher({ orgId }: OrgSwitcherProps) {
  const organizations = useQuery(api.organization.list);
  const router = useRouter();
  const {
    setShowCreateDialog,
    currentOrgId,
    setCurrentOrgId: setStoreOrgId,
  } = useOrganizationStore();

  const currentOrg = organizations?.find((org) => org._id === currentOrgId);
  const ownedOrgs = organizations?.filter((org) => org.role === "owner") ?? [];
  const memberOrgs = organizations?.filter((org) => org.role !== "owner") ?? [];

  // Effect to handle initial organization selection
  useEffect(() => {
    setStoreOrgId(orgId as Id<"organizations">);
  }, [orgId]);

  const handleOrgSelect = async (orgId: Id<"organizations">) => {
    try {
      await setCurrentOrgId(orgId);
      setStoreOrgId(orgId);
      router.refresh();
    } catch (error) {
      console.error("Failed to update organization:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          <span className="flex items-center gap-2 truncate">
            {currentOrg?.role === "owner" && (
              <CrownIcon className="h-4 w-4 text-amber-500" />
            )}
            {currentOrg?.name ?? "Select organization"}
          </span>
          <CaretSortIcon className="ml-2 h-4 w-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        {ownedOrgs.length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuLabel>Your Organizations</DropdownMenuLabel>
            {ownedOrgs.map((org) => (
              <DropdownMenuItem
                key={org._id}
                onSelect={() => handleOrgSelect(org._id)}
                className="flex items-center gap-2"
              >
                <CrownIcon className="h-4 w-4 text-amber-500" />
                <span className="flex-1 truncate">{org.name}</span>{" "}
                {org._id === currentOrgId && (
                  <span className="text-xs text-muted-foreground">
                    (Current)
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}

        {memberOrgs.length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuLabel>Member Of</DropdownMenuLabel>
            {memberOrgs.map((org) => (
              <DropdownMenuItem
                key={org._id}
                onSelect={() => handleOrgSelect(org._id)}
                className="flex items-center gap-2"
              >
                <PersonIcon className="h-4 w-4 text-gray-500" />
                <span className="flex-1 truncate">{org.name}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {org.role}
                </span>
                {org._id === currentOrgId && (
                  <span className="text-xs text-muted-foreground">
                    (Current)
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setShowCreateDialog(true);
          }}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Create organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
