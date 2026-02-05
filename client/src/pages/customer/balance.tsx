import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp } from "lucide-react";
import { useRole } from "@/lib/role-context";
import type { Member } from "@shared/schema";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function CustomerBalance() {
  const { currentUser } = useRole();

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const customerId = currentUser?.id || "m1";
  const myAccount = members?.find((m) => m.id === customerId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saldo Saya</h1>
        <p className="text-muted-foreground">
          Lihat dan kelola saldo Anda
        </p>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center py-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 mb-4">
              <Wallet className="h-10 w-10 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">Saldo Tersedia</p>
            {isLoading ? (
              <Skeleton className="h-12 w-48" />
            ) : (
              <p className="text-4xl font-bold text-primary">
                {formatCurrency(myAccount?.balance || 0)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover-elevate cursor-pointer">
          <CardContent className="pt-6">
            <Link href="/customer/deposit">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <ArrowDownCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Deposit</p>
                  <p className="text-sm text-muted-foreground">Tambah saldo ke akun Anda</p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className={`hover-elevate ${myAccount?.withdrawalLocked ? 'opacity-50' : 'cursor-pointer'}`}>
          <CardContent className="pt-6">
            <Link href="/customer/withdraw">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <ArrowUpCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Tarik Dana</p>
                  <p className="text-sm text-muted-foreground">
                    {myAccount?.withdrawalLocked ? "Penarikan dikunci" : "Tarik saldo ke rekening bank"}
                  </p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ringkasan Akun
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
              <span className="text-sm text-muted-foreground">Status Akun</span>
              <span className="font-medium">
                {myAccount?.isLocked ? "Terkunci" : "Aktif"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
              <span className="text-sm text-muted-foreground">Status Penarikan</span>
              <span className="font-medium">
                {myAccount?.withdrawalLocked ? "Dikunci" : "Tersedia"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-medium">{myAccount?.email || "-"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
