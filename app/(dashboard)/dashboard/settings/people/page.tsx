// app/dashboard/settings/people/page.tsx
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { SettingsPeopleContainer } from "@/components/settings/settings-people-container";
import { getCurrentOrgId } from "@/actions/cookie-store-orgId";
import { Id } from "@/convex/_generated/dataModel";

export default async function PeoplePage() {
  // Get organizationId from cookies or other server-side storage
  const currentOrgId = await getCurrentOrgId();

  if (!currentOrgId) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-sm text-muted-foreground">
          No organization selected
        </div>
      </div>
    );
  }

  // Preload queries with the actual organizationId
  const preloadedMembers = await preloadQuery(
    api.organization.listMembers,
    { organizationId: currentOrgId as Id<"organizations"> },
    { token: await convexAuthNextjsToken() },
  );

  return (
    <section className="flex items-center justify-center w-full container mx-auto py-8">
      <SettingsPeopleContainer preloadedMembers={preloadedMembers} />
    </section>
  );
}
