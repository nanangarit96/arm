import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import { useRole } from "@/lib/role-context";
import type { Deposit, Withdrawal } from "@shared/schema";

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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function CustomerHistory() {
  const { currentUser } = useRole();
  const customerId = currentUser?.id || "m1";

  const { data: deposits, isLoading: depositsLoading } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits"],
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals"],
  });

  const myDeposits = deposits?.filter((d) => d.memberId === customerId) || [];
  const myWithdrawals = withdrawals?.filter((w) => w.memberId === customerId) || [];

  const isLoading = depositsLoading || withdrawalsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Riwayat Transaksi</h1>
        <p className="text-muted-foreground">
          Lihat semua riwayat deposit dan penarikan Anda
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Riwayat Transaksi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="deposits" className="w-full">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="deposits" className="flex-1 sm:flex-none">
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                Deposit ({myDeposits.length})
              </TabsTrigger>
              <TabsTrigger value="withdrawals" className="flex-1 sm:flex-none">
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Penarikan ({myWithdrawals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deposits" className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : myDeposits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ArrowDownCircle className="h-16 w-16 mb-4 opacity-30" />
                  <p className="text-lg font-medium">Belum ada deposit</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myDeposits.map((deposit) => (
                    <div
                      key={deposit.id}
                      className="flex items-center justify-between rounded-md border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                          <ArrowDownCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium">Deposit</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(deposit.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          +{formatCurrency(deposit.amount)}
                        </p>
                        {deposit.status === "pending" && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {deposit.status === "approved" && (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs mt-1">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Disetujui
                          </Badge>
                        )}
                        {deposit.status === "rejected" && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            <XCircle className="h-3 w-3 mr-1" />
                            Ditolak
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="withdrawals" className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : myWithdrawals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ArrowUpCircle className="h-16 w-16 mb-4 opacity-30" />
                  <p className="text-lg font-medium">Belum ada penarikan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myWithdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="flex items-center justify-between rounded-md border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <ArrowUpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">Penarikan ke {withdrawal.bankName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(withdrawal.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600 dark:text-blue-400">
                          -{formatCurrency(withdrawal.amount)}
                        </p>
                        {withdrawal.status === "pending" && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {withdrawal.status === "approved" && (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs mt-1">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Diproses
                          </Badge>
                        )}
                        {withdrawal.status === "rejected" && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            <XCircle className="h-3 w-3 mr-1" />
                            Ditolak
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
