import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { UserPlus, Check, X, Mail, Phone, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRole } from "@/lib/role-context";
import type { Member } from "@shared/schema";

export default function AdminMemberApproval() {
  const { toast } = useToast();
  const { currentUser } = useRole();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const pendingMembers = members?.filter((m) => m.status === "pending") || [];

  const approveMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return apiRequest("PATCH", `/api/members/${memberId}`, { 
        status: "active",
        processedBy: currentUser?.id,
        processedByRole: currentUser?.role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Berhasil",
        description: "Anggota telah disetujui",
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal menyetujui anggota",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ memberId, reason }: { memberId: string; reason: string }) => {
      return apiRequest("PATCH", `/api/members/${memberId}`, { 
        status: "rejected", 
        rejectionReason: reason,
        processedBy: currentUser?.id,
        processedByRole: currentUser?.role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setRejectDialogOpen(false);
      setSelectedMember(null);
      setRejectReason("");
      toast({
        title: "Berhasil",
        description: "Anggota telah ditolak",
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal menolak anggota",
        variant: "destructive",
      });
    },
  });

  const handleReject = (member: Member) => {
    setSelectedMember(member);
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (selectedMember && rejectReason.trim()) {
      rejectMutation.mutate({ memberId: selectedMember.id, reason: rejectReason });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Persetujuan Anggota</h1>
        <p className="text-muted-foreground">
          Setujui atau tolak pendaftaran anggota baru
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Menunggu Persetujuan ({pendingMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : pendingMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <UserPlus className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Tidak ada pendaftaran baru</p>
              <p className="text-sm">Semua pendaftaran telah diproses</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border p-4"
                  data-testid={`admin-pending-member-${member.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-700 font-medium text-lg dark:bg-yellow-900/30">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Menunggu
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </span>
                        {member.phone && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(member)}
                      disabled={rejectMutation.isPending}
                      data-testid={`button-admin-reject-member-${member.id}`}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Tolak
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(member.id)}
                      disabled={approveMutation.isPending}
                      data-testid={`button-admin-approve-member-${member.id}`}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Setujui
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pendaftaran</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan untuk {selectedMember?.name}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Alasan penolakan..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
            data-testid="input-admin-reject-reason"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              data-testid="button-admin-confirm-reject"
            >
              Tolak Pendaftaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
