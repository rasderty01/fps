import { CreateOrganizationDialog } from "@/components/organizations/create-organization-dialog";
import { getCurrentOrgId, hasOrgCookie } from "@/actions/cookie-store-orgId";

export default async function DashboardPage() {
  const currentOrgId = await getCurrentOrgId();
  const hasOrgId = await hasOrgCookie();

  if (!currentOrgId) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <CreateOrganizationDialog hasOrgId />
      {currentOrgId ? (
        <div>Organization Dashboard Content</div>
      ) : (
        <div className="flex h-[80vh] items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">Welcome to PrintBridge</h2>
            <p className="text-muted-foreground">
              {hasOrgId === false
                ? "Creating your print shop..."
                : "Loading..."}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
