import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, AlertTriangle, CheckCircle, Info, Clock } from "lucide-react";
import { useRole } from "@/lib/role-context";
import type { Notification } from "@shared/schema";

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

export default function CustomerNotifications() {
  const { currentUser } = useRole();
  const customerId = currentUser?.id || "m1";

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const myNotifications = notifications?.filter((n) => n.memberId === customerId) || [];
  const unreadCount = myNotifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getBgClass = (type: string) => {
    switch (type) {
      case "error":
        return "border-destructive/50 bg-destructive/5";
      case "warning":
        return "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/10";
      case "success":
        return "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/10";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifikasi</h1>
          <p className="text-muted-foreground">
            Lihat semua notifikasi Anda
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive">
            {unreadCount} belum dibaca
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Semua Notifikasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : myNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Tidak ada notifikasi</p>
              <p className="text-sm">Anda akan menerima notifikasi di sini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 rounded-md border p-4 ${getBgClass(notif.type)} ${
                    !notif.isRead ? "ring-2 ring-primary/20" : ""
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{notif.title}</p>
                      {!notif.isRead && (
                        <Badge variant="secondary" className="text-xs">
                          Baru
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notif.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(notif.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
