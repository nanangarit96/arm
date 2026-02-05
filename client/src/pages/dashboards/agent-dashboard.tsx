import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Wallet,
  TrendingUp,
  UserCheck,
  ArrowDownCircle,
  Copy,
  Share2,
  Ticket,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/lib/role-context";
import type { Member, Deposit, User } from "@shared/schema";

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

export default function AgentDashboard() {
  const { currentUser } = useRole();
  const { toast } = useToast();

  const { data: agentData } = useQuery<User>({
    queryKey: ["/api/users", currentUser?.id],
    queryFn: async () => {
      const res = await fetch(`/api/users/${currentUser?.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!currentUser?.id,
  });

  const { data: members, isLoading: membersLoading } = useQuery<Member[]>({
    queryKey: ["/api/members", currentUser?.id],
    queryFn: async () => {
      const res = await fetch(`/api/members?agentId=${currentUser?.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!currentUser?.id,
  });

  const { data: deposits, isLoading: depositsLoading } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits"],
  });

  const myCustomers = members?.filter(m => m.status === "active") || [];
  const totalCustomers = myCustomers.length;
  const totalCustomerBalance = myCustomers.reduce((sum, m) => sum + (m.balance || 0), 0);
  const myCommission = 250000; // Simulated commission

  const myCustomerDeposits = deposits?.filter(d => 
    myCustomers.some(c => c.id === d.memberId) && d.status === "pending"
  ).slice(0, 5) || [];

  const invitationCode = agentData?.invitationCode || "N/A";

  const copyInvitationCode = () => {
    navigator.clipboard.writeText(invitationCode);
    toast({
      title: "Kode Disalin",
      description: "Kode undangan telah disalin ke clipboard",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-green-600">
          <UserCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Dashboard</h1>
          <p className="text-muted-foreground">
            Kelola pelanggan dan pantau komisi Anda
          </p>
        </div>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ticket className="h-5 w-5" />
            Kode Undangan Anda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="text-3xl font-mono font-bold tracking-wider text-primary">
                {invitationCode}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyInvitationCode} data-testid="button-copy-code">
                <Copy className="h-4 w-4 mr-2" />
                Salin Kode
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const text = `Daftar menggunakan kode undangan saya: ${invitationCode}`;
                if (navigator.share) {
                  navigator.share({ text });
                } else {
                  navigator.clipboard.writeText(text);
                  toast({ title: "Teks Disalin", description: "Teks share telah disalin" });
                }
              }} data-testid="button-share-code">
                <Share2 className="h-4 w-4 mr-2" />
                Bagikan
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Bagikan kode ini kepada calon pelanggan untuk mendaftar di bawah Anda
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCustomers}</p>
                <p className="text-sm text-muted-foreground">Pelanggan Saya</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalCustomerBalance)}</p>
                <p className="text-sm text-muted-foreground">Total Saldo Pelanggan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <ArrowDownCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myCustomerDeposits.length}</p>
                <p className="text-sm text-muted-foreground">Deposit Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(myCommission)}
                </p>
                <p className="text-sm text-muted-foreground">Komisi Bulan Ini</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pelanggan Saya
            </CardTitle>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : myCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">Belum ada pelanggan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between rounded-md border p-3 hover-elevate"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {formatCurrency(customer.balance || 0)}
                      </span>
                      {customer.isLocked ? (
                        <Badge variant="destructive" className="text-xs">Terkunci</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Aktif</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5" />
              Deposit Pelanggan Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            {depositsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : myCustomerDeposits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <ArrowDownCircle className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">Tidak ada deposit pending</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myCustomerDeposits.map((deposit) => {
                  const customer = members?.find((m) => m.id === deposit.memberId);
                  return (
                    <div
                      key={deposit.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {customer?.name || "Unknown"}
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
      </div>

      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <TrendingUp className="h-5 w-5" />
            Ringkasan Komisi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-md bg-white dark:bg-card border">
              <p className="text-sm text-muted-foreground">Komisi Bulan Ini</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(myCommission)}
              </p>
            </div>
            <div className="p-4 rounded-md bg-white dark:bg-card border">
              <p className="text-sm text-muted-foreground">Total Komisi</p>
              <p className="text-2xl font-bold">{formatCurrency(1250000)}</p>
            </div>
            <div className="p-4 rounded-md bg-white dark:bg-card border">
              <p className="text-sm text-muted-foreground">Persentase Komisi</p>
              <p className="text-2xl font-bold">5%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
