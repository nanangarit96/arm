import { useQuery } from "@tanstack/react-query";
import { useRole } from "@/lib/role-context";
import { Link } from "wouter";
import { Copy, RefreshCw, ChevronRight, Wallet, ArrowUpCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Member } from "@shared/schema";

const PANEL_PATH = "/wk-panel-2210";

export default function CustomerDashboardNew() {
  const { currentUser } = useRole();
  const { toast } = useToast();

  const { data: members, isRefetching } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const myAccount = members?.find((m) => m.id === currentUser?.id);

  const copyBalance = () => {
    navigator.clipboard.writeText(String(myAccount?.balance || 0));
    toast({ title: "Disalin", description: "Saldo berhasil disalin" });
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/members"] });
    toast({ title: "Memuat ulang...", description: "Data sedang diperbarui" });
  };

  const quickActions = [
    {
      title: "Deposit Saldo",
      description: "Tambah saldo ke akun kerja",
      icon: Wallet,
      color: "bg-blue-500",
      url: `${PANEL_PATH}/deposit`,
      testId: "action-deposit",
    },
    {
      title: "Tarik Saldo",
      description: "Tarik saldo ke rekening bank",
      icon: ArrowUpCircle,
      color: "bg-orange-500",
      url: `${PANEL_PATH}/withdraw`,
      testId: "action-withdraw",
    },
    {
      title: "Start Automated Promotion",
      description: "Mulai promosi otomatis",
      icon: Sparkles,
      color: "bg-purple-500",
      url: `${PANEL_PATH}/automated-promotion`,
      testId: "action-promotion",
    },
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
              {myAccount?.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-lg" data-testid="text-user-phone">{myAccount?.phone || myAccount?.email || "User"}</h2>
            <p className="text-sm text-muted-foreground" data-testid="text-user-email">{myAccount?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={refreshData} disabled={isRefetching} data-testid="button-refresh-user">
          <RefreshCw className={`h-5 w-5 ${isRefetching ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-blue-100 text-sm">Informasi Saldo</span>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            <Sparkles className="h-3 w-3 mr-1" />
            Kredit skor {myAccount?.creditScore ?? 100}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-3xl font-bold" data-testid="text-balance">
            Rp {(myAccount?.balance || 0).toLocaleString("id-ID")}
          </span>
          <Button variant="ghost" size="icon" onClick={copyBalance} className="text-white" data-testid="button-copy-balance">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-blue-100 text-sm">
          <RefreshCw className="h-4 w-4" />
          <span>Pastikan melakukan refresh</span>
        </div>
      </div>
      <Card className="p-5">
        <h3 className="font-semibold text-lg mb-1">Aksi Cepat</h3>
        <p className="text-sm text-muted-foreground mb-4">Akses fitur utama dengan cepat</p>
        
        <div className="space-y-3">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.url}>
              <div className="flex items-center gap-4 p-3 rounded-xl border hover-elevate cursor-pointer mt-[30px] mb-[30px] pl-[16px] pr-[16px] pt-[12px] pb-[12px] ml-[0px] mr-[0px]" data-testid={action.testId}>
                <div className={`h-12 w-12 rounded-xl ${action.color} flex items-center justify-center flex-shrink-0`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">{action.title}</h4>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
