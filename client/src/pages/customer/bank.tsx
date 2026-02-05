import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Landmark, Save, Lock, MessageSquare, CheckCircle } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import type { Member } from "@shared/schema";

export default function CustomerBank() {
  const { currentUser } = useRole();
  const { toast } = useToast();
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [changeRequested, setChangeRequested] = useState(false);

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const customerId = currentUser?.id || "m1";
  const myAccount = members?.find((m) => m.id === customerId);

  const hasBankInfo = myAccount?.bankName && myAccount?.bankAccountNumber && myAccount?.bankAccountName;

  useEffect(() => {
    if (myAccount) {
      setBankName(myAccount.bankName || "");
      setBankAccountNumber(myAccount.bankAccountNumber || "");
      setBankAccountName(myAccount.bankAccountName || "");
    }
  }, [myAccount]);

  const updateMutation = useMutation({
    mutationFn: async (data: { bankName: string; bankAccountNumber: string; bankAccountName: string }) => {
      return apiRequest("PATCH", `/api/members/${customerId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Berhasil",
        description: "Data rekening bank Anda telah disimpan",
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal menyimpan data rekening bank",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!bankName || !bankAccountNumber || !bankAccountName) {
      toast({
        title: "Error",
        description: "Semua field wajib diisi",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate({
      bankName,
      bankAccountNumber,
      bankAccountName,
    });
  };

  const handleRequestChange = () => {
    setChangeRequested(true);
    toast({
      title: "Permintaan Terkirim",
      description: "Permintaan perubahan rekening akan diproses oleh admin/agent.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rekening Bank Saya</h1>
        <p className="text-muted-foreground">
          Informasi rekening bank untuk penarikan dana
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                Informasi Rekening
              </CardTitle>
              {hasBankInfo && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Terkunci
                </Badge>
              )}
            </div>
            <CardDescription>
              {hasBankInfo 
                ? "Data rekening tidak dapat diubah. Hubungi admin untuk perubahan."
                : "Daftarkan rekening bank Anda untuk menerima penarikan dana"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : hasBankInfo ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Nama Bank</Label>
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 text-sm">
                    {myAccount?.bankName}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Nomor Rekening</Label>
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 text-sm font-mono">
                    {myAccount?.bankAccountNumber}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Nama Pemilik Rekening</Label>
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 text-sm">
                    {myAccount?.bankAccountName}
                  </div>
                </div>

                {changeRequested ? (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Permintaan perubahan telah dikirim
                  </div>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={handleRequestChange}
                    className="w-full"
                    data-testid="button-request-change"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Minta Perubahan Rekening
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bank-name">Nama Bank</Label>
                  <Input
                    id="bank-name"
                    placeholder="BCA, BNI, Mandiri, BRI, dll"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    data-testid="input-bank-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-account">Nomor Rekening</Label>
                  <Input
                    id="bank-account"
                    placeholder="Masukkan nomor rekening"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    data-testid="input-bank-account"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-account-name">Nama Pemilik Rekening</Label>
                  <Input
                    id="bank-account-name"
                    placeholder="Nama sesuai buku tabungan"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    data-testid="input-bank-account-name"
                  />
                </div>
                <Button 
                  onClick={handleSave} 
                  disabled={updateMutation.isPending}
                  className="w-full"
                  data-testid="button-save-bank"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Menyimpan..." : "Simpan Rekening"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Penting!</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                Pastikan nama rekening sesuai dengan buku tabungan
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                Periksa kembali nomor rekening sebelum menyimpan
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                Dana penarikan akan dikirim ke rekening yang terdaftar
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">4.</span>
                <span className="text-amber-600 dark:text-amber-400">
                  Setelah disimpan, data rekening <strong>tidak dapat diubah sendiri</strong>. 
                  Perubahan harus melalui konfirmasi agent atau admin.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
