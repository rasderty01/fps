"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CaretSortIcon, PlusIcon } from "@radix-ui/react-icons";
import { useOrganizationStore } from "@/hooks/store/useOrganizationStore";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";

export function OrganizationSwitcher() {
  const organizations = useQuery(api.organization.list);
  const router = useRouter();
  const { setShowCreateDialog, currentOrgId, setCurrentOrgId } =
    useOrganizationStore();

  const currentOrg = organizations?.find((org) => org._id === currentOrgId);

  const handleOrgSelect = (orgId: Id<"organizations">) => {
    setCurrentOrgId(orgId);
    console.log(orgId);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          {currentOrg?.name ??
            organizations?.[0]?.name ??
            "Select organization"}
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        {organizations?.map((org) => (
          <DropdownMenuItem
            key={org._id}
            onSelect={() => handleOrgSelect(org._id)}
          >
            {org.name}
          </DropdownMenuItem>
        ))}
        {organizations?.length ? <DropdownMenuSeparator /> : null}
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
