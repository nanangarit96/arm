import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  AlertTriangle,
  Search,
  Check,
  X,
  Lock,
  Clock,
  CheckCircle,
  XCircle,
  BanIcon,
  Unlock,
} from "lucide-react";
import type { Withdrawal, Member } from "@shared/schema";

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

const rejectSchema = z.object({
  reason: z.string().min(5, "Alasan minimal 5 karakter"),
  lockWithdrawal: z.boolean().default(false),
});

type RejectForm = z.infer<typeof rejectSchema>;

export default function WithdrawalDetection() {
  const [search, setSearch] = useState("");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const { toast } = useToast();

  const rejectForm = useForm<RejectForm>({
    resolver: zodResolver(rejectSchema),
    defaultValues: {
      reason: "",
      lockWithdrawal: true,
    },
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals"],
  });

  const { data: members } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/withdrawals/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Berhasil",
        description: "Penarikan telah disetujui",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menyetujui penarikan",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({
      id,
      reason,
      lockWithdrawal,
    }: {
      id: string;
      reason: string;
      lockWithdrawal: boolean;
    }) => {
      return apiRequest("POST", `/api/withdrawals/${id}/reject`, { reason, lockWithdrawal });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setIsRejectOpen(false);
      setSelectedWithdrawal(null);
      rejectForm.reset();
      toast({
        title: "Berhasil",
        description: "Penarikan telah ditolak dan notifikasi dikirim",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menolak penarikan",
        variant: "destructive",
      });
    },
  });

  const unlockWithdrawalMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return apiRequest("PATCH", `/api/members/${memberId}/unlock-withdrawal`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Berhasil",
        description: "Penarikan telah dibuka kembali",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal membuka penarikan",
        variant: "destructive",
      });
    },
  });

  const getMember = (memberId: string) => members?.find((m) => m.id === memberId);

  const filteredWithdrawals = withdrawals?.filter((w) => {
    const member = getMember(w.memberId);
    return (
      member?.name.toLowerCase().includes(search.toLowerCase()) ||
      member?.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  const pendingWithdrawals = filteredWithdrawals?.filter((w) => w.status === "pending") || [];
  const approvedWithdrawals = filteredWithdrawals?.filter((w) => w.status === "approved") || [];
  const rejectedWithdrawals = filteredWithdrawals?.filter((w) => w.status === "rejected") || [];
  const lockedWithdrawalMembers = members?.filter((m) => m.withdrawalLocked) || [];

  const handleReject = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setIsRejectOpen(true);
  };

  const onRejectSubmit = (data: RejectForm) => {
    if (selectedWithdrawal) {
      rejectMutation.mutate({
        id: selectedWithdrawal.id,
        reason: data.reason,
        lockWithdrawal: data.lockWithdrawal,
      });
    }
  };

  const WithdrawalCard = ({ withdrawal }: { withdrawal: Withdrawal }) => {
    const member = getMember(withdrawal.memberId);
    return (
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border p-4"
        data-testid={`withdrawal-card-${withdrawal.id}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium shrink-0">
            {member?.name.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{member?.name || "Unknown"}</p>
              {member?.withdrawalLocked && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Penarikan Dikunci
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{member?.email}</p>
            {withdrawal.bankName && (
              <p className="text-xs text-muted-foreground mt-1">
                {withdrawal.bankName} - {withdrawal.accountNumber} ({withdrawal.accountName})
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(withdrawal.createdAt)}
            </p>
            {withdrawal.rejectionReason && (
              <p className="text-sm text-destructive mt-2">
                Alasan: {withdrawal.rejectionReason}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <p className="text-lg font-bold text-primary">
            {formatCurrency(withdrawal.amount)}
          </p>
          {withdrawal.status === "pending" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => approveMutation.mutate(withdrawal.id)}
                disabled={approveMutation.isPending}
                data-testid={`button-approve-withdrawal-${withdrawal.id}`}
              >
                <Check className="h-4 w-4 mr-1" />
                Setujui
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleReject(withdrawal)}
                data-testid={`button-reject-withdrawal-${withdrawal.id}`}
              >
                <X className="h-4 w-4 mr-1" />
                Tolak
              </Button>
            </div>
          )}
          {withdrawal.status === "approved" && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle className="h-3 w-3 mr-1" />
              Disetujui
            </Badge>
          )}
          {withdrawal.status === "rejected" && (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Ditolak
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deteksi Penarikan</h1>
        <p className="text-muted-foreground">
          Kelola permintaan penarikan dan deteksi sistem
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingWithdrawals.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <BanIcon className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lockedWithdrawalMembers.length}</p>
                <p className="text-sm text-muted-foreground">Penarikan Dikunci</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedWithdrawals.length}</p>
                <p className="text-sm text-muted-foreground">Disetujui</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {lockedWithdrawalMembers.length > 0 && (
        <Card className="border-amber-300 dark:border-amber-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Anggota dengan Penarikan Dikunci
            </CardTitle>
            <CardDescription>
              Anggota ini tidak dapat melakukan penarikan. Notifikasi telah dikirim ke akun mereka.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lockedWithdrawalMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border border-amber-200 dark:border-amber-800 p-4 bg-amber-50/50 dark:bg-amber-900/10"
                  data-testid={`locked-member-${member.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      {member.withdrawalLockReason && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                          Alasan: {member.withdrawalLockReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unlockWithdrawalMutation.mutate(member.id)}
                    disabled={unlockWithdrawalMutation.isPending}
                    data-testid={`button-unlock-withdrawal-${member.id}`}
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    Buka Kunci Penarikan
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Daftar Penarikan
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari penarikan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-withdrawal"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="pending" className="flex-1 sm:flex-none" data-testid="tab-withdrawal-pending">
                <Clock className="h-4 w-4 mr-2" />
                Pending ({pendingWithdrawals.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex-1 sm:flex-none" data-testid="tab-withdrawal-approved">
                <CheckCircle className="h-4 w-4 mr-2" />
                Disetujui ({approvedWithdrawals.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex-1 sm:flex-none" data-testid="tab-withdrawal-rejected">
                <XCircle className="h-4 w-4 mr-2" />
                Ditolak ({rejectedWithdrawals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {withdrawalsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : pendingWithdrawals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle className="h-16 w-16 mb-4 opacity-30" />
                  <p className="text-lg font-medium">Tidak ada penarikan pending</p>
                  <p className="text-sm">Semua permintaan telah diproses</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingWithdrawals.map((withdrawal) => (
                    <WithdrawalCard key={withdrawal.id} withdrawal={withdrawal} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-4">
              {approvedWithdrawals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle className="h-16 w-16 mb-4 opacity-30" />
                  <p className="text-sm">Belum ada penarikan yang disetujui</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvedWithdrawals.map((withdrawal) => (
                    <WithdrawalCard key={withdrawal.id} withdrawal={withdrawal} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-4">
              {rejectedWithdrawals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <XCircle className="h-16 w-16 mb-4 opacity-30" />
                  <p className="text-sm">Belum ada penarikan yang ditolak</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rejectedWithdrawals.map((withdrawal) => (
                    <WithdrawalCard key={withdrawal.id} withdrawal={withdrawal} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Tolak Penarikan
            </DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan. Anda dapat memilih untuk mengunci penarikan pelanggan ini.
            </DialogDescription>
          </DialogHeader>
          <Form {...rejectForm}>
            <form onSubmit={rejectForm.handleSubmit(onRejectSubmit)} className="space-y-4">
              {selectedWithdrawal && (
                <div className="rounded-md border p-3 bg-muted/50">
                  <p className="text-sm">
                    <span className="font-medium">Jumlah:</span>{" "}
                    {formatCurrency(selectedWithdrawal.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getMember(selectedWithdrawal.memberId)?.name}
                  </p>
                </div>
              )}
              <FormField
                control={rejectForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alasan Penolakan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Masukkan alasan penolakan..."
                        {...field}
                        data-testid="input-withdrawal-reject-reason"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={rejectForm.control}
                name="lockWithdrawal"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 rounded-md border p-3 bg-amber-50 dark:bg-amber-900/10">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                        data-testid="checkbox-lock-withdrawal"
                      />
                    </FormControl>
                    <div className="flex-1">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Kunci Penarikan
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Pelanggan tidak dapat melakukan penarikan dan akan menerima notifikasi dengan alasan yang ditentukan
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRejectOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={rejectMutation.isPending}
                  data-testid="button-confirm-reject-withdrawal"
                >
                  {rejectMutation.isPending ? "Memproses..." : "Tolak Penarikan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
