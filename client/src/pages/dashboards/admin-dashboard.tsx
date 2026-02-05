import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Wallet,
  ArrowDownCircle,
  Lock,
  Clock,
  CheckCircle,
  Shield,
  UserCheck,
} from "lucide-react";
import type { Member, Deposit, Withdrawal, ActivityLog } from "@shared/schema";

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
  loading,
}: {
  title: string;
  value: string | number;
  icon: typeof Users;
  description?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: members, isLoading: membersLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: deposits, isLoading: depositsLoading } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits"],
  });

  const { data: withdrawals } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activities"],
  });

  const totalMembers = members?.length || 0;
  const activeMembers = members?.filter((m) => m.status === "active").length || 0;
  const lockedMembers = members?.filter((m) => m.isLocked).length || 0;
  const totalBalance = members?.reduce((sum, m) => sum + (m.balance || 0), 0) || 0;
  const pendingDeposits = deposits?.filter((d) => d.status === "pending").length || 0;
  const pendingWithdrawals = withdrawals?.filter((w) => w.status === "pending").length || 0;

  const recentDeposits = deposits?.filter((d) => d.status === "pending").slice(0, 5) || [];
  const recentActivities = activities?.slice(0, 8) || [];

  const isLoading = membersLoading || depositsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-600">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Kelola agent, anggota, deposit, dan penarikan
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Agent"
          value={5}
          icon={UserCheck}
          description="Agent aktif"
          loading={isLoading}
        />
        <StatCard
          title="Total Anggota"
          value={totalMembers}
          icon={Users}
          description={`${activeMembers} aktif`}
          loading={isLoading}
        />
        <StatCard
          title="Deposit Pending"
          value={pendingDeposits}
          icon={ArrowDownCircle}
          description="Menunggu persetujuan"
          loading={isLoading}
        />
        <StatCard
          title="Akun Terkunci"
          value={lockedMembers}
          icon={Lock}
          description="Perlu perhatian"
          loading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Deposit Menunggu Persetujuan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {depositsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : recentDeposits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">Tidak ada deposit pending</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDeposits.map((deposit) => {
                  const member = members?.find((m) => m.id === deposit.memberId);
                  return (
                    <div
                      key={deposit.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {member?.name || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(deposit.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">
                          {formatCurrency(deposit.amount)}
                        </span>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">Belum ada aktivitas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-md p-2 hover-elevate"
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Clock className="h-3 w-3 text-muted-foreground" />
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

      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-md border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeMembers}</p>
                <p className="text-xs text-muted-foreground">Anggota Aktif</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-md border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingDeposits + pendingWithdrawals}</p>
                <p className="text-xs text-muted-foreground">Transaksi Pending</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-md border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
                <p className="text-xs text-muted-foreground">Total Saldo</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
