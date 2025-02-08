import { Book, Home, Inbox, Settings } from "lucide-react";
import { OrganizationSwitcher } from "@/components/organizations/organization-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { getCurrentOrgId } from "@/actions/cookie-store-orgId";
import { NavUser } from "./nav-user";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Print Requests",
    url: "/dashboard/requests",
    icon: Inbox,
  },
  {
    title: "Organization",
    url: "/dashboard/organization",
    icon: Book,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

export async function AppSidebar() {
  const currentOrgId = await getCurrentOrgId();

  const user = await preloadQuery(
    api.users.currentUser,
    {},
    { token: await convexAuthNextjsToken() },
  );
  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4">
          <OrganizationSwitcher orgId={currentOrgId ?? ""} />
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>PrintBridge</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser preloadeduser={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
