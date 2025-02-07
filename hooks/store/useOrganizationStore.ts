// store/useOrganizationStore.ts
import { create } from "zustand";
import { Id } from "@/convex/_generated/dataModel";

interface OrganizationStore {
  showCreateDialog: boolean;
  setShowCreateDialog: (show: boolean) => void;
  currentOrgId: Id<"organizations"> | null;
  setCurrentOrgId: (id: Id<"organizations"> | null) => void;
}

export const useOrganizationStore = create<OrganizationStore>((set) => ({
  showCreateDialog: false,
  setShowCreateDialog: (show) => set({ showCreateDialog: show }),
  currentOrgId: null,
  setCurrentOrgId: (id) => set({ currentOrgId: id }),
}));
