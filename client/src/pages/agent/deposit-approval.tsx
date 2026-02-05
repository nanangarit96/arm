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
import { ArrowDownCircle, Check, X, Clock, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRole } from "@/lib/role-context";
import type { Deposit, Member } from "@shared/schema";

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

export default function AgentDepositApproval() {
  const { toast } = useToast();
  const { currentUser } = useRole();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: deposits, isLoading } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits", currentUser?.id],
    queryFn: async () => {
      const res = await fetch(`/api/deposits?agentId=${currentUser?.id}`);
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

  const pendingDeposits = deposits?.filter((d) => d.status === "pending") || [];

  const approveMutation = useMutation({
    mutationFn: async (depositId: string) => {
      return apiRequest("POST", `/api/deposits/${depositId}/approve`, {
        processedBy: currentUser?.id,
        processedByRole: currentUser?.role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Berhasil",
        description: "Deposit telah disetujui",
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal menyetujui deposit",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ depositId, reason }: { depositId: string; reason: string }) => {
      return apiRequest("POST", `/api/deposits/${depositId}/reject`, { 
        reason,
        processedBy: currentUser?.id,
        processedByRole: currentUser?.role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      setRejectDialogOpen(false);
      setSelectedDeposit(null);
      setRejectReason("");
      toast({
        title: "Berhasil",
        description: "Deposit telah ditolak",
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal menolak deposit",
        variant: "destructive",
      });
    },
  });

  const handleReject = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (selectedDeposit && rejectReason.trim()) {
      rejectMutation.mutate({ depositId: selectedDeposit.id, reason: rejectReason });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Persetujuan Deposit</h1>
        <p className="text-muted-foreground">
          Setujui atau tolak permintaan deposit pelanggan
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownCircle className="h-5 w-5" />
            Deposit Menunggu ({pendingDeposits.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : pendingDeposits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ArrowDownCircle className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Tidak ada deposit menunggu</p>
              <p className="text-sm">Semua permintaan deposit telah diproses</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDeposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border p-4"
                  data-testid={`pending-deposit-${deposit.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/30">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium">{getMemberName(deposit.memberId)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Menunggu
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(deposit.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Jumlah</p>
                      <p className="font-semibold text-green-600">
                        +{formatCurrency(deposit.amount)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(deposit)}
                        disabled={rejectMutation.isPending}
                        data-testid={`button-reject-deposit-${deposit.id}`}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Tolak
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(deposit.id)}
                        disabled={approveMutation.isPending}
                        data-testid={`button-approve-deposit-${deposit.id}`}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        ACC
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Deposit</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan deposit
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Alasan penolakan..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
            data-testid="input-reject-deposit-reason"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              data-testid="button-confirm-reject-deposit"
            >
              Tolak Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
