import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Shield,
  UserCheck,
  Wallet,
  Activity,
  TrendingUp,
  Crown,
} from "lucide-react";
import type { Member, ActivityLog } from "@shared/schema";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | Date | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getRoleBadge(role: string | null | undefined) {
  if (!role) return null;
  const roleConfig: Record<string, { label: string; className: string }> = {
    master: { label: "Master", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    admin: { label: "Admin", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    agent: { label: "Agent", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    customer: { label: "Customer", className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
  };
  const config = roleConfig[role] || { label: role, className: "bg-muted text-muted-foreground" };
  return <Badge className={`text-[10px] ${config.className}`}>{config.label}</Badge>;
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color,
  loading,
}: {
  title: string;
  value: string | number;
  icon: typeof Users;
  description?: string;
  color: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MasterDashboard() {
  const { data: members, isLoading: membersLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activities"],
  });

  // Simulated counts for demo
  const totalAdmins = 3;
  const totalAgents = 5;
  const totalMembers = members?.length || 0;
  const totalBalance = members?.reduce((sum, m) => sum + (m.balance || 0), 0) || 0;

  const recentActivities = activities?.slice(0, 10) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-purple-600">
          <Crown className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Master Dashboard</h1>
          <p className="text-muted-foreground">
            Kontrol penuh sistem - kelola admin, agent, dan seluruh anggota
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Admin"
          value={totalAdmins}
          icon={Shield}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          loading={membersLoading}
        />
        <StatCard
          title="Total Agent"
          value={totalAgents}
          icon={UserCheck}
          color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          loading={membersLoading}
        />
        <StatCard
          title="Total Anggota"
          value={totalMembers}
          icon={Users}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          loading={membersLoading}
        />
        <StatCard
          title="Total Dana Sistem"
          value={formatCurrency(totalBalance)}
          icon={Wallet}
          color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          loading={membersLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ringkasan Hierarki
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md border">
                <div className="flex items-center gap-3">
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    <Crown className="h-3 w-3 mr-1" />
                    Master
                  </Badge>
                  <span className="text-sm">Kontrol Penuh</span>
                </div>
                <span className="font-bold">1</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border ml-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                  <span className="text-sm">Manajemen Operasional</span>
                </div>
                <span className="font-bold">{totalAdmins}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border ml-8">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Agent
                  </Badge>
                  <span className="text-sm">Agen Penjualan</span>
                </div>
                <span className="font-bold">{totalAgents}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border ml-12">
                <div className="flex items-center gap-3">
                  <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <Users className="h-3 w-3 mr-1" />
                    Pelanggan
                  </Badge>
                  <span className="text-sm">Akun Kerja</span>
                </div>
                <span className="font-bold">{totalMembers}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Log Aktivitas Sistem
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">Belum ada aktivitas</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2 rounded-md hover-elevate"
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{activity.action}</p>
                        {activity.userName && (
                          <span className="text-xs text-muted-foreground">oleh {activity.userName}</span>
                        )}
                        {activity.userRole && getRoleBadge(activity.userRole)}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDate(activity.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
