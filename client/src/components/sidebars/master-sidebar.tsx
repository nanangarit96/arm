import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, UserCog, Activity, Settings, Package, Building } from "lucide-react";

const PANEL_PATH = "/ms-panel-9921";

const menuItems = [
  { title: "Dashboard", url: `${PANEL_PATH}/`, icon: LayoutDashboard },
  { title: "Admins", url: `${PANEL_PATH}/admins`, icon: UserCog },
  { title: "Agents", url: `${PANEL_PATH}/agents`, icon: UserCog },
  { title: "Members", url: `${PANEL_PATH}/members`, icon: Users },
  { title: "Products", url: `${PANEL_PATH}/products`, icon: Package },
  { title: "System Banks", url: `${PANEL_PATH}/system-banks`, icon: Building },
  { title: "Activities", url: `${PANEL_PATH}/activities`, icon: Activity },
  { title: "Settings", url: `${PANEL_PATH}/settings`, icon: Settings },
];

export function MasterSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
          <span className="font-bold text-lg">Master Panel</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
