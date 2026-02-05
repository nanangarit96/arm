import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Phone, Wallet, Shield, Lock } from "lucide-react";
import { useRole } from "@/lib/role-context";
import type { Member } from "@shared/schema";

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
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default function CustomerProfile() {
  const { currentUser } = useRole();

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const customerId = currentUser?.id || "m1";
  const myAccount = members?.find((m) => m.id === customerId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil Saya</h1>
        <p className="text-muted-foreground">
          Lihat dan kelola informasi akun Anda
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Pribadi
              </CardTitle>
              <CardDescription>
                Data pribadi Anda yang terdaftar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nama Lengkap</Label>
                    <Input value={myAccount?.name || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={myAccount?.email || ""} disabled className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nomor Telepon</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={myAccount?.phone || "-"} disabled className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Bergabung</Label>
                    <Input value={formatDate(myAccount?.createdAt || null)} disabled />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Keamanan Akun
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div>
                  <p className="font-medium text-sm">Ubah Password</p>
                  <p className="text-xs text-muted-foreground">
                    Perbarui password Anda secara berkala
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Ubah
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div>
                  <p className="font-medium text-sm">Verifikasi Email</p>
                  <p className="text-xs text-muted-foreground">
                    Email Anda telah terverifikasi
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Terverifikasi
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-3xl font-bold mb-4">
                  {myAccount?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <h3 className="font-semibold text-lg">{myAccount?.name}</h3>
                <p className="text-sm text-muted-foreground">{myAccount?.email}</p>
                <div className="flex gap-2 mt-3">
                  {myAccount?.isLocked ? (
                    <Badge variant="destructive">
                      <Lock className="h-3 w-3 mr-1" />
                      Terkunci
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Aktif
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-4 w-4" />
                Ringkasan Saldo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Saldo</span>
                    <span className="font-semibold">{formatCurrency(myAccount?.balance || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status Penarikan</span>
                    {myAccount?.withdrawalLocked ? (
                      <Badge variant="destructive" className="text-xs">Dikunci</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Tersedia</Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
