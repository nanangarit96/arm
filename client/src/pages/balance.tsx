import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Wallet, ArrowUpRight, User, CheckCircle, Search, Phone, XCircle, Loader2 } from "lucide-react";
import type { Member } from "@shared/schema";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function Balance() {
  const [success, setSuccess] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [foundMember, setFoundMember] = useState<Member | null>(null);
  const [searchStatus, setSearchStatus] = useState<"idle" | "searching" | "found" | "not_found">("idle");
  const [amount, setAmount] = useState<number>(0);
  const { toast } = useToast();

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  useEffect(() => {
    if (phoneSearch.length >= 10) {
      setSearchStatus("searching");
      const timer = setTimeout(() => {
        const member = members?.find(
          (m) => m.phone && m.phone.replace(/\D/g, "").includes(phoneSearch.replace(/\D/g, ""))
        );
        if (member) {
          setFoundMember(member);
          setSearchStatus("found");
        } else {
          setFoundMember(null);
          setSearchStatus("not_found");
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setFoundMember(null);
      setSearchStatus("idle");
    }
  }, [phoneSearch, members]);

  const topUpMutation = useMutation({
    mutationFn: async () => {
      if (!foundMember) throw new Error("No member selected");
      return apiRequest("POST", `/api/members/${foundMember.id}/topup`, {
        amount: amount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setSuccess(true);
      toast({
        title: "Berhasil",
        description: "Saldo berhasil ditambahkan",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menambahkan saldo",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundMember) {
      toast({
        title: "Error",
        description: "Pilih pelanggan terlebih dahulu",
        variant: "destructive",
      });
      return;
    }
    if (amount < 1000) {
      toast({
        title: "Error",
        description: "Minimal top up Rp 1.000",
        variant: "destructive",
      });
      return;
    }
    topUpMutation.mutate();
  };

  const resetForm = () => {
    setSuccess(false);
    setPhoneSearch("");
    setFoundMember(null);
    setAmount(0);
    setSearchStatus("idle");
  };

  const quickAmounts = [20000, 100000, 60000, 120000, 1300000,1560000,2560000];

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Top Up Berhasil!</h2>
              <p className="text-muted-foreground mb-4">
                Saldo telah berhasil ditambahkan ke akun pelanggan
              </p>
              <Button onClick={resetForm} data-testid="button-topup-again">
                Top Up Lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Isi Saldo</h1>
        <p className="text-muted-foreground">
          Tambahkan saldo ke akun pelanggan dengan nomor telepon
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Form Top Up Saldo
            </CardTitle>
            <CardDescription>
              Cari pelanggan dengan nomor telepon lalu masukkan jumlah saldo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phone-search">Cari Nomor Telepon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone-search"
                      type="tel"
                      placeholder="Masukkan nomor telepon pelanggan..."
                      className="pl-10"
                      value={phoneSearch}
                      onChange={(e) => setPhoneSearch(e.target.value)}
                      data-testid="input-phone-search"
                    />
                    {searchStatus === "searching" && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {searchStatus === "found" && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                    {searchStatus === "not_found" && (
                      <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                    )}
                  </div>
                  {searchStatus === "not_found" && (
                    <p className="text-sm text-destructive">Pelanggan tidak ditemukan</p>
                  )}
                </div>

                {foundMember && (
                  <div className="rounded-md border p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 font-bold text-lg">
                        {foundMember.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{foundMember.name}</p>
                        <p className="text-sm text-muted-foreground">{foundMember.email}</p>
                        <p className="text-sm text-muted-foreground">{foundMember.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Saldo Saat Ini</p>
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(foundMember.balance || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah Top Up</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0"
                      className="pl-10"
                      value={amount || ""}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      data-testid="input-topup-amount"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Minimal top up Rp 100.000</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Pilihan Cepat</p>
                  <div className="flex flex-wrap gap-2">
                    {quickAmounts.map((amt) => (
                      <Button
                        key={amt}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAmount(amt)}
                        data-testid={`button-quick-${amt}`}
                      >
                        {formatCurrency(amt)}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={topUpMutation.isPending || !foundMember}
                  data-testid="button-submit-topup"
                >
                  {topUpMutation.isPending ? (
                    "Memproses..."
                  ) : (
                    <>
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Top Up Saldo
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Saldo Anggota</CardTitle>
            <CardDescription>
              Lihat saldo terkini semua anggota
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : members?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">Belum ada anggota</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {members
                  ?.sort((a, b) => (b.balance || 0) - (a.balance || 0))
                  .map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-md border p-3 hover-elevate cursor-pointer"
                      onClick={() => {
                        if (member.phone) {
                          setPhoneSearch(member.phone);
                        }
                      }}
                      data-testid={`balance-item-${member.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.phone || member.email}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(member.balance || 0)}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
