import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useRole } from "@/lib/role-context";
import { ArrowUpCircle, CheckCircle, AlertTriangle, Landmark, AlertCircle, Clock } from "lucide-react";
import { Link } from "wouter";
import type { Member, Withdrawal } from "@shared/schema";

const PANEL_PATHS = {
  customer: "/wk-panel-2210",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

const withdrawSchema = z.object({
  amount: z.coerce.number().min(10000, "Minimal penarikan Rp 10.000"),
});

type WithdrawForm = z.infer<typeof withdrawSchema>;

export default function CustomerWithdraw() {
  const [success, setSuccess] = useState(false);
  const { currentUser } = useRole();
  const { toast } = useToast();

  const { data: members, isLoading: membersLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals"],
  });
  
  const isLoading = membersLoading || withdrawalsLoading;

  const customerId = currentUser?.id || "m1";
  const myAccount = members?.find((m) => m.id === customerId);
  const pendingWithdrawal = withdrawals?.find((w) => w.memberId === customerId && w.status === "pending");

  const hasBankInfo = myAccount?.bankName && myAccount?.bankAccountNumber && myAccount?.bankAccountName;

  const form = useForm<WithdrawForm>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: WithdrawForm) => {
      return apiRequest("POST", "/api/withdrawals", {
        memberId: customerId,
        amount: data.amount,
        bankName: myAccount?.bankName,
        accountNumber: myAccount?.bankAccountNumber,
        accountName: myAccount?.bankAccountName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setSuccess(true);
      toast({
        title: "Berhasil",
        description: "Permintaan penarikan telah dikirim. Saldo Anda telah dikurangi.",
      });
    },
    onError: async (error: any) => {
      let message = "Gagal mengirim permintaan penarikan";
      try {
        // Handle Response object from apiRequest
        if (error instanceof Response) {
          const data = await error.json();
          message = data?.error || message;
        } else if (error?.response instanceof Response) {
          const data = await error.response.json();
          message = data?.error || message;
        } else if (typeof error === "object" && error?.error) {
          message = error.error;
        } else if (error?.message) {
          message = error.message;
        }
      } catch {
        // Use default message
      }
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WithdrawForm) => {
    if (data.amount > (myAccount?.balance || 0)) {
      toast({
        title: "Error",
        description: "Saldo tidak mencukupi",
        variant: "destructive",
      });
      return;
    }
    withdrawMutation.mutate(data);
  };

  // Show loading while fetching data to prevent form flash
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (myAccount?.withdrawalLocked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-destructive mb-2">Deteksi Sistem</h2>
              <p className="text-muted-foreground mb-4">
                {myAccount.withdrawalLockReason || "Sistem mendeteksi aktivitas mencurigakan pada akun Anda. Penarikan dana sementara dibekukan. Silakan hubungi admin untuk informasi lebih lanjut."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pendingWithdrawal) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full border-amber-500">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-amber-600 dark:text-amber-400 mb-2">Penarikan Sedang Diproses</h2>
              <p className="text-muted-foreground mb-2">
                Anda masih memiliki penarikan yang sedang diproses sebesar:
              </p>
              <p className="text-2xl font-bold mb-4">{formatCurrency(pendingWithdrawal.amount)}</p>
              <p className="text-sm text-muted-foreground mb-4">
                Silakan tunggu hingga penarikan sebelumnya disetujui atau ditolak oleh admin sebelum melakukan penarikan baru.
              </p>
              <Link href={`${PANEL_PATHS.customer}/history`}>
                <Button variant="outline">Lihat Riwayat</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Permintaan Terkirim!</h2>
              <p className="text-muted-foreground mb-4">
                Permintaan penarikan Anda sedang diproses. Saldo Anda telah dikurangi dan dana akan ditransfer setelah disetujui.
              </p>
              <Link href={`${PANEL_PATHS.customer}/dashboard`}>
                <Button data-testid="button-back-dashboard">Kembali ke Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tarik Dana</h1>
        <p className="text-muted-foreground">
          Tarik saldo ke rekening bank Anda
        </p>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo Tersedia</p>
              <p className="text-2xl font-bold">{formatCurrency(myAccount?.balance || 0)}</p>
            </div>
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
        </CardContent>
      </Card>

      {!hasBankInfo ? (
        <Card className="border-amber-500">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Rekening Bank Belum Terdaftar</h2>
              <p className="text-muted-foreground mb-4">
                Anda harus mendaftarkan rekening bank terlebih dahulu sebelum melakukan penarikan dana.
              </p>
              <Link href={`${PANEL_PATHS.customer}/bank`}>
                <Button data-testid="button-setup-bank">
                  <Landmark className="h-4 w-4 mr-2" />
                  Daftarkan Rekening Bank
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="h-4 w-4" />
                Rekening Tujuan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="font-medium">{myAccount?.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No. Rekening</span>
                  <span className="font-medium">{myAccount?.bankAccountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Atas Nama</span>
                  <span className="font-medium">{myAccount?.bankAccountName}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5" />
                Form Penarikan
              </CardTitle>
              <CardDescription>
                Masukkan jumlah yang ingin ditarik
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jumlah Penarikan</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              Rp
                            </span>
                            <Input
                              type="number"
                              placeholder="0"
                              className="pl-10"
                              {...field}
                              data-testid="input-withdraw-amount"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Maksimal {formatCurrency(myAccount?.balance || 0)}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={withdrawMutation.isPending}
                    data-testid="button-submit-withdraw"
                  >
                    {withdrawMutation.isPending ? "Mengirim..." : "Kirim Permintaan Penarikan"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
