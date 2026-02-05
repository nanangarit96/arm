import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Activity, Search, Clock } from "lucide-react";
import type { ActivityLog, Member } from "@shared/schema";

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

export default function MasterActivities() {
  const [search, setSearch] = useState("");

  const { data: activities, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activities"],
  });

  const { data: members } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const getMember = (memberId: string | null) => {
    if (!memberId) return null;
    return members?.find((m) => m.id === memberId);
  };

  const filteredActivities = activities?.filter(
    (activity) =>
      activity.action.toLowerCase().includes(search.toLowerCase()) ||
      activity.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Log Aktivitas</h1>
        <p className="text-muted-foreground">
          Pantau semua aktivitas dalam sistem
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Semua Aktivitas
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari aktivitas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredActivities?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Activity className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Tidak ada aktivitas</p>
              <p className="text-sm">Belum ada aktivitas yang tercatat</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities?.map((activity) => {
                const member = getMember(activity.memberId);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 rounded-md border p-4 hover-elevate"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{activity.action}</p>
                        {activity.userRole && (
                          <Badge variant="outline" className="text-xs">
                            {activity.userRole}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                      {member && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Terkait: {member.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatDate(activity.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
