import { useState } from "react";
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
import { ArrowDownCircle, CheckCircle, Upload, Landmark, Copy, Check } from "lucide-react";
import type { SystemBank } from "@shared/schema";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

const depositSchema = z.object({
  amount: z.coerce.number().min(10000, "Minimal deposit Rp 10.000"),
});

type DepositForm = z.infer<typeof depositSchema>;

export default function CustomerDeposit() {
  const [success, setSuccess] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { currentUser } = useRole();
  const { toast } = useToast();

  const { data: systemBanks } = useQuery<SystemBank[]>({
    queryKey: ["/api/system-banks/active"],
  });

  const form = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const depositMutation = useMutation({
    mutationFn: async (data: DepositForm) => {
      return apiRequest("POST", "/api/deposits", {
        memberId: currentUser?.id || "m1",
        amount: data.amount,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      setDepositAmount(variables.amount);
      setSuccess(true);
      toast({
        title: "Berhasil",
        description: "Permintaan deposit telah dikirim",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal mengirim permintaan deposit",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DepositForm) => {
    depositMutation.mutate(data);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Disalin",
      description: "Nomor rekening telah disalin ke clipboard",
    });
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center">
          <Card className="max-w-lg w-full">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-bold mb-2">Permintaan Terkirim!</h2>
                <p className="text-muted-foreground mb-2">
                  Permintaan deposit sebesar <strong>{formatCurrency(depositAmount)}</strong> telah dibuat.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Silakan transfer ke salah satu rekening di bawah ini:
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {systemBanks?.map((bank) => (
            <Card key={bank.id} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Landmark className="h-4 w-4" />
                  {bank.bankName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Nomor Rekening</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-medium text-lg">{bank.accountNumber}</p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(bank.accountNumber, bank.id)}
                      data-testid={`button-copy-${bank.id}`}
                    >
                      {copiedId === bank.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Atas Nama</p>
                  <p className="font-medium">{bank.accountName}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">Penting!</h3>
              <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <li>1. Transfer sesuai dengan jumlah yang diminta: <strong>{formatCurrency(depositAmount)}</strong></li>
                <li>2. Simpan bukti transfer untuk verifikasi</li>
                <li>3. Saldo akan ditambahkan setelah admin memverifikasi</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button onClick={() => { setSuccess(false); form.reset(); setDepositAmount(0); }} variant="outline">
            Buat Deposit Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deposit</h1>
        <p className="text-muted-foreground">
          Tambah saldo ke akun Anda
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5" />
              Form Deposit
            </CardTitle>
            <CardDescription>
              Masukkan jumlah deposit yang diinginkan
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
                      <FormLabel>Jumlah Deposit</FormLabel>
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
                            data-testid="input-deposit-amount"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Minimal deposit Rp 10.000
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={depositMutation.isPending}
                  data-testid="button-submit-deposit"
                >
                  {depositMutation.isPending ? "Mengirim..." : "Kirim Permintaan Deposit"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Cara Deposit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium text-sm">
                  1
                </div>
                <div>
                  <p className="font-medium">Masukkan Jumlah</p>
                  <p className="text-sm text-muted-foreground">
                    Pilih atau masukkan jumlah deposit yang diinginkan
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium text-sm">
                  2
                </div>
                <div>
                  <p className="font-medium">Kirim Permintaan</p>
                  <p className="text-sm text-muted-foreground">
                    Klik tombol untuk melihat rekening tujuan transfer
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium text-sm">
                  3
                </div>
                <div>
                  <p className="font-medium">Transfer ke Rekening</p>
                  <p className="text-sm text-muted-foreground">
                    Transfer sesuai jumlah ke salah satu rekening yang ditampilkan
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-white font-medium text-sm">
                  4
                </div>
                <div>
                  <p className="font-medium">Saldo Bertambah</p>
                  <p className="text-sm text-muted-foreground">
                    Setelah admin memverifikasi, saldo akan otomatis bertambah
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
