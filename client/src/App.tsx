import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RoleProvider, useRole } from "@/lib/role-context";
import { RoleSwitcher } from "@/components/role-switcher";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MasterSidebar } from "@/components/sidebars/master-sidebar";
import { AdminSidebar } from "@/components/sidebars/admin-sidebar";
import { AgentSidebar } from "@/components/sidebars/agent-sidebar";
import NotFound from "@/pages/not-found";

// Dashboards
import MasterDashboard from "@/pages/dashboards/master-dashboard";
import AdminDashboard from "@/pages/dashboards/admin-dashboard";
import AgentDashboard from "@/pages/dashboards/agent-dashboard";
import CustomerDashboard from "@/pages/dashboards/customer-dashboard";

// Admin pages
import AdminMembers from "@/pages/admin/members";
import Balance from "@/pages/balance";
import Deposits from "@/pages/deposits";
import AccountLock from "@/pages/account-lock";
import WithdrawalDetection from "@/pages/withdrawal-detection";
import AdminMemberApproval from "@/pages/admin/member-approval";
import AdminWithdrawalApproval from "@/pages/admin/withdrawal-approval";

// Master pages (placeholder)
import MasterAdmins from "@/pages/master/admins";
import MasterAgents from "@/pages/master/agents";
import MasterMembers from "@/pages/master/members";
import MasterActivities from "@/pages/master/activities";
import MasterSettings from "@/pages/master/settings";

// Agent pages
import AgentCustomers from "@/pages/agent/customers";
import AgentBalance from "@/pages/agent/balance";
import AgentDeposits from "@/pages/agent/deposits";
import AgentCommission from "@/pages/agent/commission";
import AgentMemberApproval from "@/pages/agent/member-approval";
import AgentDepositApproval from "@/pages/agent/deposit-approval";
import AgentWithdrawalApproval from "@/pages/agent/withdrawal-approval";

// Customer pages
import CustomerBalance from "@/pages/customer/balance";
import CustomerDeposit from "@/pages/customer/deposit";
import CustomerWithdraw from "@/pages/customer/withdraw";
import CustomerHistory from "@/pages/customer/history";
import CustomerNotifications from "@/pages/customer/notifications";
import CustomerProfile from "@/pages/customer/profile";
import CustomerBank from "@/pages/customer/bank";
import CustomerDashboardNew from "@/pages/customer/dashboard";
import CustomerMall from "@/pages/customer/mall";
import CustomerAturan from "@/pages/customer/aturan";
import CustomerAkun from "@/pages/customer/akun";
import AutomatedPromotionPage from "@/pages/customer/automated-promotion";
import { CustomerLayout } from "@/components/layouts/customer-layout";
import AuthPage from "@/pages/auth";
import ProductsPage from "@/pages/shared/products";
import SystemBanksPage from "@/pages/shared/system-banks";

// Route guard component to redirect unauthorized access
function RouteGuard({ children, allowedRole }: { children: React.ReactNode; allowedRole: string }) {
  const { currentUser } = useRole();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!currentUser || currentUser.role !== allowedRole) {
      setLocation("/");
    }
  }, [currentUser, allowedRole, setLocation]);

  if (!currentUser || currentUser.role !== allowedRole) {
    return null;
  }
  return <>{children}</>;
}

// Secret paths for each role (can be changed by master)
const PANEL_PATHS = {
  master: "/ms-panel-9921",
  admin: "/ad-panel-4432",
  agent: "/ag-panel-7781",
  customer: "/wk-panel-2210",
};


function AppContent() {
  const { currentUser, refreshSession, isRefreshing, logout } = useRole();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const role = currentUser?.role;

  const handleRefresh = async () => {
    const success = await refreshSession();
    if (success) {
      // Invalidate all queries to refresh all data on the page
      await queryClient.invalidateQueries();
      toast({
        title: "Sesi Diperbarui",
        description: "Data sesi Anda telah diperbarui.",
      });
    } else {
      toast({
        title: "Gagal Memperbarui",
        description: "Sesi tidak valid. Silakan login ulang.",
        variant: "destructive",
      });
      logout();
      setLocation("/");
    }
  };

  // Redirect to secret path on mount or role switch
  useEffect(() => {
    if (currentUser) {
      const targetBase = PANEL_PATHS[role as keyof typeof PANEL_PATHS];
      if (!location.startsWith(targetBase)) {
        setLocation(targetBase + "/");
      }
    } else {
      // If not logged in and not at root, go to root
      if (location !== "/") {
        setLocation("/");
      }
    }
  }, [role, setLocation, location, currentUser]);

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const getSidebar = () => {
    if (!currentUser) return null;
    if (role === "customer") return null;
    switch (role) {
      case "master":
        return <MasterSidebar />;
      case "admin":
        return <AdminSidebar />;
      case "agent":
        return <AgentSidebar />;
      default:
        return null;
    }
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        {getSidebar()}
        <div className="flex flex-col flex-1 overflow-hidden">
          {role !== "customer" && (
            <header className="flex items-center justify-between gap-2 border-b px-4 py-2 bg-card">
              <SidebarTrigger data-testid="button-sidebar-toggle" className={!currentUser ? "hidden" : ""} />
              <div className="flex items-center gap-2 ml-auto">
                {currentUser && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    data-testid="button-refresh-session"
                    title="Perbarui Sesi"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  </Button>
                )}
                <RoleSwitcher />
              </div>
            </header>
          )}
          <main className={`flex-1 overflow-auto ${role === "customer" ? "" : "p-6"}`}>
            <Switch>
              <Route path="/" component={AuthPage} />
              
              {/* Master Panel Routes */}
              <Route path={`${PANEL_PATHS.master}/`}><RouteGuard allowedRole="master"><MasterDashboard /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.master}/admins`}><RouteGuard allowedRole="master"><MasterAdmins /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.master}/agents`}><RouteGuard allowedRole="master"><MasterAgents /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.master}/members`}><RouteGuard allowedRole="master"><MasterMembers /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.master}/activities`}><RouteGuard allowedRole="master"><MasterActivities /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.master}/settings`}><RouteGuard allowedRole="master"><MasterSettings /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.master}/products`}><RouteGuard allowedRole="master"><ProductsPage /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.master}/system-banks`}><RouteGuard allowedRole="master"><SystemBanksPage /></RouteGuard></Route>
              
              {/* Admin Panel Routes */}
              <Route path={`${PANEL_PATHS.admin}/`}><RouteGuard allowedRole="admin"><AdminDashboard /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.admin}/agents`}><RouteGuard allowedRole="admin"><MasterAgents /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.admin}/members`}><RouteGuard allowedRole="admin"><AdminMembers /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.admin}/member-approval`}><RouteGuard allowedRole="admin"><AdminMemberApproval /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.admin}/deposit-approval`}><RouteGuard allowedRole="admin"><Deposits /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.admin}/withdrawal-approval`}><RouteGuard allowedRole="admin"><AdminWithdrawalApproval /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.admin}/balance`}><RouteGuard allowedRole="admin"><Balance /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.admin}/deposits`}><RouteGuard allowedRole="admin"><Deposits /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.admin}/account-lock`}><RouteGuard allowedRole="admin"><AccountLock /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.admin}/withdrawal-detection`}><RouteGuard allowedRole="admin"><WithdrawalDetection /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.admin}/products`}><RouteGuard allowedRole="admin"><ProductsPage /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.admin}/system-banks`}><RouteGuard allowedRole="admin"><SystemBanksPage /></RouteGuard></Route>
              
              {/* Agent Panel Routes */}
              <Route path={`${PANEL_PATHS.agent}/`}><RouteGuard allowedRole="agent"><AgentDashboard /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.agent}/customers`}><RouteGuard allowedRole="agent"><AgentCustomers /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.agent}/member-approval`}><RouteGuard allowedRole="agent"><AgentMemberApproval /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.agent}/deposit-approval`}><RouteGuard allowedRole="agent"><AgentDepositApproval /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.agent}/withdrawal-approval`}><RouteGuard allowedRole="agent"><AgentWithdrawalApproval /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.agent}/balance`}><RouteGuard allowedRole="agent"><AgentBalance /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.agent}/deposits`}><RouteGuard allowedRole="agent"><AgentDeposits /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.agent}/commission`}><RouteGuard allowedRole="agent"><AgentCommission /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.agent}/products`}><RouteGuard allowedRole="agent"><ProductsPage /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.agent}/system-banks`}><RouteGuard allowedRole="agent"><SystemBanksPage /></RouteGuard></Route>
              
              {/* Customer Panel Routes - with mobile layout */}
              <Route path={`${PANEL_PATHS.customer}/`}><RouteGuard allowedRole="customer"><CustomerLayout><CustomerDashboardNew /></CustomerLayout></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.customer}/mall`}><RouteGuard allowedRole="customer"><CustomerLayout><CustomerMall /></CustomerLayout></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.customer}/automated-promotion`}><RouteGuard allowedRole="customer"><AutomatedPromotionPage /></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.customer}/aturan`}><RouteGuard allowedRole="customer"><CustomerLayout><CustomerAturan /></CustomerLayout></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.customer}/akun`}><RouteGuard allowedRole="customer"><CustomerLayout><CustomerAkun /></CustomerLayout></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.customer}/balance`}><RouteGuard allowedRole="customer"><CustomerLayout><CustomerBalance /></CustomerLayout></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.customer}/deposit`}><RouteGuard allowedRole="customer"><CustomerLayout><CustomerDeposit /></CustomerLayout></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.customer}/withdraw`}><RouteGuard allowedRole="customer"><CustomerLayout><CustomerWithdraw /></CustomerLayout></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.customer}/history`}><RouteGuard allowedRole="customer"><CustomerLayout><CustomerHistory /></CustomerLayout></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.customer}/bank`}><RouteGuard allowedRole="customer"><CustomerLayout><CustomerBank /></CustomerLayout></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.customer}/notifications`}><RouteGuard allowedRole="customer"><CustomerLayout><CustomerNotifications /></CustomerLayout></RouteGuard></Route>
              <Route path={`${PANEL_PATHS.customer}/profile`}><RouteGuard allowedRole="customer"><CustomerLayout><CustomerProfile /></CustomerLayout></RouteGuard></Route>
              
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RoleProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </RoleProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
