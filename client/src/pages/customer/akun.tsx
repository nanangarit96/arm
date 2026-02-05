import { useQuery } from "@tanstack/react-query";
import { useRole } from "@/lib/role-context";
import { Link } from "wouter";
import { 
  User, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Landmark, 
  History, 
  MessageCircle, 
  Settings, 
  LogOut,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Member } from "@shared/schema";

const PANEL_PATH = "/wk-panel-2210";

const menuGrid = [
  { title: "Info", icon: User, url: `${PANEL_PATH}/profile`, testId: "menu-info" },
  { title: "Deposit", icon: ArrowDownCircle, url: `${PANEL_PATH}/deposit`, testId: "menu-deposit" },
  { title: "Tarik", icon: ArrowUpCircle, url: `${PANEL_PATH}/withdraw`, testId: "menu-withdraw" },
  { title: "Bank", icon: Landmark, url: `${PANEL_PATH}/bank`, testId: "menu-bank" },
  { title: "Riwayat Deposit", icon: History, url: `${PANEL_PATH}/history`, testId: "menu-history-deposit" },
  { title: "Notifikasi", icon: MessageCircle, url: `${PANEL_PATH}/notifications`, testId: "menu-cs" },
  { title: "Pengaturan", icon: Settings, url: `${PANEL_PATH}/profile`, testId: "menu-settings" },
  { title: "Riwayat Tarik", icon: History, url: `${PANEL_PATH}/history`, testId: "menu-history-withdraw" },
];

const infoFields = [
  { label: "No. Telepon", key: "phone" },
  { label: "Email", key: "email" },
  { label: "Nama Lengkap", key: "name" },
  { label: "Total Penghasilan", key: "balance" },
  { label: "Status", key: "status" },
];

export default function CustomerAkun() {
  const { currentUser, logout } = useRole();

  const { data: members } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const myAccount = members?.find((m) => m.id === currentUser?.id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getFieldValue = (key: string) => {
    if (!myAccount) return "-";
    switch (key) {
      case "phone":
        return myAccount.phone || "-";
      case "email":
        return myAccount.email;
      case "name":
        return myAccount.name;
      case "balance":
        return formatCurrency(myAccount.balance || 0);
      case "status":
        return myAccount.status === "active" ? "Aktif" : myAccount.status;
      default:
        return "-";
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
              {myAccount?.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-lg" data-testid="text-user-phone">{myAccount?.phone || myAccount?.email || "User"}</h2>
            <p className="text-sm text-muted-foreground" data-testid="text-akun-email">{myAccount?.email}</p>
            <Badge variant="secondary" className="mt-1" data-testid="badge-credit-score">Kredit skor {myAccount?.creditScore ?? 100}</Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            logout();
            window.location.href = "/";
          }}
          data-testid="button-logout"
        >
          <LogOut className="h-5 w-5 text-destructive" />
        </Button>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
        <span className="text-blue-100 text-sm">Saldo Tersedia</span>
        <h2 className="text-3xl font-bold mt-1" data-testid="text-akun-balance">
          Rp {(myAccount?.balance || 0).toLocaleString("id-ID")}
        </h2>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {menuGrid.slice(0, 4).map((item) => (
          <Link key={item.title} href={item.url}>
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl hover-elevate cursor-pointer" data-testid={item.testId}>
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">{item.title}</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {menuGrid.slice(4).map((item) => (
          <Link key={item.title} href={item.url}>
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl hover-elevate cursor-pointer" data-testid={item.testId}>
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground text-center">{item.title}</span>
            </div>
          </Link>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-lg mb-1">Informasi Akun</h3>
        <p className="text-sm text-muted-foreground mb-4">Detail akun kerja Anda</p>
        
        <div className="space-y-4">
          {infoFields.map((field) => (
            <div key={field.key} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`info-${field.key}`}>
              <span className="text-sm text-primary">{field.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{getFieldValue(field.key)}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
