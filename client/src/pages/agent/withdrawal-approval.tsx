import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { ArrowUpCircle, Check, X, Clock, Wallet, Landmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRole } from "@/lib/role-context";
import type { Withdrawal, Member } from "@shared/schema";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AgentWithdrawalApproval() {
  const { toast } = useToast();
  const { currentUser } = useRole();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: withdrawals, isLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals", currentUser?.id],
    queryFn: async () => {
      const res = await fetch(`/api/withdrawals?agentId=${currentUser?.id}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      return res.json();
    },
    enabled: !!currentUser?.id,
  });

  const { data: members } = useQuery<Member[]>({
    queryKey: ["/api/members", currentUser?.id],
    queryFn: async () => {
      const res = await fetch(`/api/members?agentId=${currentUser?.id}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      return res.json();
    },
    enabled: !!currentUser?.id,
  });

  const getMemberName = (memberId: string) => {
    const member = members?.find((m) => m.id === memberId);
    return member?.name || "Unknown";
  };

  const getMemberBalance = (memberId: string) => {
    const member = members?.find((m) => m.id === memberId);
    return member?.balance || 0;
  };

  const getMemberBankInfo = (memberId: string) => {
    const member = members?.find((m) => m.id === memberId);
    return {
      bankName: member?.bankName || "-",
      bankAccountNumber: member?.bankAccountNumber || "-",
      bankAccountName: member?.bankAccountName || "-",
    };
  };

  const pendingWithdrawals = withdrawals?.filter((w) => w.status === "pending") || [];

  const approveMutation = useMutation({
    mutationFn: async (withdrawalId: string) => {
      return apiRequest("POST", `/api/withdrawals/${withdrawalId}/approve`, {
        processedBy: currentUser?.id,
        processedByRole: currentUser?.role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Berhasil",
        description: "Penarikan telah disetujui",
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal menyetujui penarikan",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ withdrawalId, reason }: { withdrawalId: string; reason: string }) => {
      return apiRequest("POST", `/api/withdrawals/${withdrawalId}/reject`, { 
        reason,
        processedBy: currentUser?.id,
        processedByRole: currentUser?.role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      setRejectDialogOpen(false);
      setSelectedWithdrawal(null);
      setRejectReason("");
      toast({
        title: "Berhasil",
        description: "Penarikan telah ditolak",
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal menolak penarikan",
        variant: "destructive",
      });
    },
  });

  const handleReject = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (selectedWithdrawal && rejectReason.trim()) {
      rejectMutation.mutate({ withdrawalId: selectedWithdrawal.id, reason: rejectReason });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Persetujuan Penarikan</h1>
        <p className="text-muted-foreground">
          Setujui atau tolak permintaan penarikan pelanggan
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5" />
            Penarikan Menunggu ({pendingWithdrawals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : pendingWithdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ArrowUpCircle className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Tidak ada penarikan menunggu</p>
              <p className="text-sm">Semua permintaan penarikan telah diproses</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingWithdrawals.map((withdrawal) => {
                const memberBalance = getMemberBalance(withdrawal.memberId);
                
                return (
                  <div
                    key={withdrawal.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border p-4"
                    data-testid={`pending-withdrawal-${withdrawal.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30">
                        <Wallet className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-medium">{getMemberName(withdrawal.memberId)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Menunggu
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(withdrawal.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Saldo: {formatCurrency(memberBalance)}
                        </p>
                        <div className="flex items-center gap-2 mt-2 p-2 rounded bg-muted/50">
                          <Landmark className="h-4 w-4 text-muted-foreground" />
                          <div className="text-xs">
                            <span className="font-medium">{getMemberBankInfo(withdrawal.memberId).bankName}</span>
                            <span className="mx-1">-</span>
                            <span>{getMemberBankInfo(withdrawal.memberId).bankAccountNumber}</span>
                            <span className="mx-1">a/n</span>
                            <span className="font-medium">{getMemberBankInfo(withdrawal.memberId).bankAccountName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Jumlah</p>
                        <p className="font-semibold text-orange-600">
                          -{formatCurrency(withdrawal.amount)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(withdrawal)}
                          disabled={rejectMutation.isPending}
                          data-testid={`button-reject-withdrawal-${withdrawal.id}`}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Tolak
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(withdrawal.id)}
                          disabled={approveMutation.isPending}
                          data-testid={`button-approve-withdrawal-${withdrawal.id}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          ACC
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Penarikan</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan penarikan
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Alasan penolakan..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
            data-testid="input-reject-withdrawal-reason"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              data-testid="button-confirm-reject-withdrawal"
            >
              Tolak Penarikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
