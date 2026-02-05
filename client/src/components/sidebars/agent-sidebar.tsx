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
import { LayoutDashboard, Users, Wallet, ArrowUpCircle, DollarSign, Package, Building } from "lucide-react";

const PANEL_PATH = "/ag-panel-7781";

const menuItems = [
  { title: "Dashboard", url: `${PANEL_PATH}/`, icon: LayoutDashboard },
  { title: "Customers", url: `${PANEL_PATH}/customers`, icon: Users },
  { title: "Member Approval", url: `${PANEL_PATH}/member-approval`, icon: Users },
  { title: "Deposit Approval", url: `${PANEL_PATH}/deposit-approval`, icon: ArrowUpCircle },
  { title: "Withdrawal Approval", url: `${PANEL_PATH}/withdrawal-approval`, icon: Wallet },
  { title: "Balance", url: `${PANEL_PATH}/balance`, icon: Wallet },
  { title: "Deposits", url: `${PANEL_PATH}/deposits`, icon: ArrowUpCircle },
  { title: "Commission", url: `${PANEL_PATH}/commission`, icon: DollarSign },
  { title: "Products", url: `${PANEL_PATH}/products`, icon: Package },
  { title: "System Banks", url: `${PANEL_PATH}/system-banks`, icon: Building },
];

export function AgentSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
          <span className="font-bold text-lg">Agent Panel</span>
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
