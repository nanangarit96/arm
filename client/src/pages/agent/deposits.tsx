import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import type { Deposit, Member } from "@shared/schema";

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

export default function AgentDeposits() {
  const { data: deposits, isLoading: depositsLoading } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits"],
  });

  const { data: members } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  // Simulate agent's customer deposits (first 3 members)
  const myCustomerIds = members?.slice(0, 3).map(m => m.id) || [];
  const myCustomerDeposits = deposits?.filter(d => myCustomerIds.includes(d.memberId)) || [];

  const getMember = (memberId: string) => members?.find((m) => m.id === memberId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deposit Pelanggan</h1>
        <p className="text-muted-foreground">
          Lihat riwayat deposit dari pelanggan Anda
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownCircle className="h-5 w-5" />
            Riwayat Deposit
          </CardTitle>
        </CardHeader>
        <CardContent>
          {depositsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : myCustomerDeposits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ArrowDownCircle className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Tidak ada deposit</p>
              <p className="text-sm">Belum ada deposit dari pelanggan Anda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myCustomerDeposits.map((deposit) => {
                const member = getMember(deposit.memberId);
                return (
                  <div
                    key={deposit.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium shrink-0">
                        {member?.name.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium">{member?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{member?.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(deposit.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(deposit.amount)}
                      </p>
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
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Ditolak
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
