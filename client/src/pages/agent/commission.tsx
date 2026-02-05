import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Wallet, Calendar, ArrowUpRight } from "lucide-react";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Demo commission data
const commissionHistory = [
  { id: 1, month: "Januari 2026", amount: 250000, transactions: 12 },
  { id: 2, month: "Desember 2025", amount: 320000, transactions: 15 },
  { id: 3, month: "November 2025", amount: 180000, transactions: 8 },
  { id: 4, month: "Oktober 2025", amount: 290000, transactions: 14 },
  { id: 5, month: "September 2025", amount: 210000, transactions: 10 },
];

export default function AgentCommission() {
  const totalCommission = commissionHistory.reduce((sum, c) => sum + c.amount, 0);
  const thisMonthCommission = commissionHistory[0]?.amount || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Komisi Saya</h1>
        <p className="text-muted-foreground">
          Lihat riwayat dan total komisi Anda
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(thisMonthCommission)}
                </p>
                <p className="text-sm text-muted-foreground">Komisi Bulan Ini</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalCommission)}</p>
                <p className="text-sm text-muted-foreground">Total Komisi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <ArrowUpRight className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">5%</p>
                <p className="text-sm text-muted-foreground">Persentase Komisi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Riwayat Komisi Bulanan
          </CardTitle>
          <CardDescription>
            Komisi dihitung berdasarkan transaksi pelanggan Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {commissionHistory.map((commission) => (
              <div
                key={commission.id}
                className="flex items-center justify-between rounded-md border p-4 hover-elevate"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{commission.month}</p>
                    <p className="text-sm text-muted-foreground">
                      {commission.transactions} transaksi
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    +{formatCurrency(commission.amount)}
                  </p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    Dibayar
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
