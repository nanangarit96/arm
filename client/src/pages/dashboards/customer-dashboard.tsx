import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Bell,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lock,
  RefreshCcw,
  Info,
} from "lucide-react";
import { useRole } from "@/lib/role-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Member, Deposit, Withdrawal, Notification } from "@shared/schema";

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

export default function CustomerDashboard() {
  const { currentUser } = useRole();

  const { data: members, isLoading: membersLoading, refetch: refetchMembers } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: deposits, isLoading: depositsLoading, refetch: refetchDeposits } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits"],
  });

  const { data: withdrawals, isLoading: withdrawalsLoading, refetch: refetchWithdrawals } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals"],
  });

  const { data: notifications, refetch: refetchNotifications } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  // Get current customer's data (using m1 as demo)
  const customerId = currentUser?.id || "m1";
  const myAccount = members?.find((m) => m.id === customerId);
  const myDeposits = deposits?.filter((d) => d.memberId === customerId) || [];
  const myWithdrawals = withdrawals?.filter((w) => w.memberId === customerId) || [];
  const myNotifications = notifications?.filter((n) => n.memberId === customerId) || [];
  const unreadNotifications = myNotifications.filter((n) => !n.isRead);

  const pendingDeposits = myDeposits.filter((d) => d.status === "pending").length;
  const pendingWithdrawals = myWithdrawals.filter((w) => w.status === "pending").length;

  const isLoading = membersLoading || depositsLoading || withdrawalsLoading;

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/notifications/member/${customerId}/read-all`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const handleRefresh = () => {
    refetchMembers();
    refetchDeposits();
    refetchWithdrawals();
    refetchNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-600">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Selamat Datang, {myAccount?.name || currentUser?.name || "Pelanggan"}
            </h1>
            <p className="text-muted-foreground">
              Kelola saldo, deposit, dan penarikan Anda
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            data-testid="button-refresh-dashboard"
          >
            <RefreshCcw className="h-5 w-5" />
          </Button>
          <Popover onOpenChange={(open) => {
            if (open && unreadNotifications.length > 0) {
              markAllReadMutation.mutate();
            }
          }}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {unreadNotifications.length > 9 ? "9+" : unreadNotifications.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between border-b p-3">
                <h4 className="font-semibold">Notifikasi</h4>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {myNotifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Tidak ada notifikasi
                  </div>
                ) : (
                  myNotifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex gap-3 border-b p-3 last:border-0 ${!notification.isRead ? "bg-muted/50" : ""}`}
                      data-testid={`notification-${notification.id}`}
                    >
                      <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${!notification.isRead ? "" : "text-muted-foreground"}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Account Warnings */}
      {myAccount?.isLocked && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/20">
                <Lock className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">Akun Anda Dikunci</h3>
                <p className="text-sm text-muted-foreground">
                  {myAccount.lockReason || "Silakan hubungi admin untuk informasi lebih lanjut."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {myAccount?.withdrawalLocked && !myAccount?.isLocked && (
        <Card className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-700 dark:text-amber-400">Penarikan Dikunci</h3>
                <p className="text-sm text-muted-foreground">
                  {myAccount.withdrawalLockReason || "Anda tidak dapat melakukan penarikan saat ini."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
                <Wallet className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Anda</p>
                {isLoading ? (
                  <Skeleton className="h-10 w-40" />
                ) : (
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(myAccount?.balance || 0)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/wk-panel-2210/deposit">
                  <ArrowDownCircle className="h-4 w-4 mr-2" />
                  Deposit
                </Link>
              </Button>
              <Button variant="outline" asChild disabled={myAccount?.withdrawalLocked}>
                <Link href="/wk-panel-2210/withdraw">
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  Tarik Dana
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingDeposits}</p>
                <p className="text-sm text-muted-foreground">Deposit Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <ArrowUpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingWithdrawals}</p>
                <p className="text-sm text-muted-foreground">Penarikan Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Bell className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myNotifications.length}</p>
                <p className="text-sm text-muted-foreground">Notifikasi Baru</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5" />
              Riwayat Deposit Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            {depositsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : myDeposits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <ArrowDownCircle className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">Belum ada deposit</p>
                <Button variant="outline" size="sm" asChild className="mt-2">
                  <Link href="/customer/deposit">Buat Deposit Pertama</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {myDeposits.slice(0, 5).map((deposit) => (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {formatCurrency(deposit.amount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(deposit.createdAt)}
                      </span>
                    </div>
                    {deposit.status === "pending" && (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    {deposit.status === "approved" && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Disetujui
                      </Badge>
                    )}
                    {deposit.status === "rejected" && (
                      <Badge variant="destructive">Ditolak</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifikasi Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">Tidak ada notifikasi baru</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myNotifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 rounded-md border p-3 ${
                      notif.type === "error"
                        ? "border-destructive/50 bg-destructive/5"
                        : notif.type === "warning"
                        ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/10"
                        : ""
                    }`}
                  >
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      notif.type === "error"
                        ? "bg-destructive/20"
                        : notif.type === "warning"
                        ? "bg-amber-100 dark:bg-amber-900/30"
                        : "bg-muted"
                    }`}>
                      {notif.type === "error" ? (
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                      ) : notif.type === "warning" ? (
                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                      ) : (
                        <Bell className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notif.message}
                      </p>
                    </div>
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
