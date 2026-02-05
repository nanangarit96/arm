import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowDownCircle,
  Search,
  Check,
  X,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

const rejectSchema = z.object({
  reason: z.string().min(5, "Alasan minimal 5 karakter"),
});

type RejectForm = z.infer<typeof rejectSchema>;

export default function Deposits() {
  const [search, setSearch] = useState("");
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const { toast } = useToast();

  const rejectForm = useForm<RejectForm>({
    resolver: zodResolver(rejectSchema),
    defaultValues: {
      reason: "",
    },
  });

  const { data: deposits, isLoading: depositsLoading } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits"],
  });

  const { data: members } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/deposits/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Berhasil",
        description: "Deposit telah disetujui",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menyetujui deposit",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiRequest("POST", `/api/deposits/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setIsRejectOpen(false);
      setSelectedDeposit(null);
      rejectForm.reset();
      toast({
        title: "Berhasil",
        description: "Deposit telah ditolak",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menolak deposit",
        variant: "destructive",
      });
    },
  });

  const getMember = (memberId: string) => members?.find((m) => m.id === memberId);

  const filteredDeposits = deposits?.filter((deposit) => {
    const member = getMember(deposit.memberId);
    return (
      member?.name.toLowerCase().includes(search.toLowerCase()) ||
      member?.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  const pendingDeposits = filteredDeposits?.filter((d) => d.status === "pending") || [];
  const approvedDeposits = filteredDeposits?.filter((d) => d.status === "approved") || [];
  const rejectedDeposits = filteredDeposits?.filter((d) => d.status === "rejected") || [];

  const handleReject = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setIsRejectOpen(true);
  };

  const onRejectSubmit = (data: RejectForm) => {
    if (selectedDeposit) {
      rejectMutation.mutate({ id: selectedDeposit.id, reason: data.reason });
    }
  };

  const DepositCard = ({ deposit }: { deposit: Deposit }) => {
    const member = getMember(deposit.memberId);
    return (
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border p-4"
        data-testid={`deposit-card-${deposit.id}`}
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
            {deposit.rejectionReason && (
              <p className="text-sm text-destructive mt-2">
                Alasan: {deposit.rejectionReason}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <p className="text-lg font-bold text-primary">
            {formatCurrency(deposit.amount)}
          </p>
          {deposit.status === "pending" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => approveMutation.mutate(deposit.id)}
                disabled={approveMutation.isPending}
                data-testid={`button-approve-${deposit.id}`}
              >
                <Check className="h-4 w-4 mr-1" />
                Setujui
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleReject(deposit)}
                data-testid={`button-reject-${deposit.id}`}
              >
                <X className="h-4 w-4 mr-1" />
                Tolak
              </Button>
            </div>
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
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Persetujuan Deposit</h1>
        <p className="text-muted-foreground">
          Kelola permintaan deposit dari pelanggan
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5" />
              Daftar Deposit
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari deposit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-deposit"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="pending" className="flex-1 sm:flex-none" data-testid="tab-pending">
                <Clock className="h-4 w-4 mr-2" />
                Pending ({pendingDeposits.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex-1 sm:flex-none" data-testid="tab-approved">
                <CheckCircle className="h-4 w-4 mr-2" />
                Disetujui ({approvedDeposits.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex-1 sm:flex-none" data-testid="tab-rejected">
                <XCircle className="h-4 w-4 mr-2" />
                Ditolak ({rejectedDeposits.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {depositsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : pendingDeposits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle className="h-16 w-16 mb-4 opacity-30" />
                  <p className="text-lg font-medium">Tidak ada deposit pending</p>
                  <p className="text-sm">Semua permintaan telah diproses</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingDeposits.map((deposit) => (
                    <DepositCard key={deposit.id} deposit={deposit} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-4">
              {approvedDeposits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle className="h-16 w-16 mb-4 opacity-30" />
                  <p className="text-sm">Belum ada deposit yang disetujui</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvedDeposits.map((deposit) => (
                    <DepositCard key={deposit.id} deposit={deposit} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-4">
              {rejectedDeposits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <XCircle className="h-16 w-16 mb-4 opacity-30" />
                  <p className="text-sm">Belum ada deposit yang ditolak</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rejectedDeposits.map((deposit) => (
                    <DepositCard key={deposit.id} deposit={deposit} />
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
            <DialogTitle>Tolak Deposit</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan deposit ini
            </DialogDescription>
          </DialogHeader>
          <Form {...rejectForm}>
            <form onSubmit={rejectForm.handleSubmit(onRejectSubmit)} className="space-y-4">
              {selectedDeposit && (
                <div className="rounded-md border p-3 bg-muted/50">
                  <p className="text-sm">
                    <span className="font-medium">Jumlah:</span>{" "}
                    {formatCurrency(selectedDeposit.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getMember(selectedDeposit.memberId)?.name}
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
                        data-testid="input-reject-reason"
                      />
                    </FormControl>
                    <FormMessage />
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
                  data-testid="button-confirm-reject"
                >
                  {rejectMutation.isPending ? "Memproses..." : "Tolak Deposit"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
