import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Lock, Unlock, Search, Shield, AlertTriangle } from "lucide-react";
import type { Member } from "@shared/schema";

const lockSchema = z.object({
  reason: z.string().min(5, "Alasan minimal 5 karakter"),
});

type LockForm = z.infer<typeof lockSchema>;

export default function AccountLock() {
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isLockOpen, setIsLockOpen] = useState(false);
  const { toast } = useToast();

  const lockForm = useForm<LockForm>({
    resolver: zodResolver(lockSchema),
    defaultValues: {
      reason: "",
    },
  });

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const lockMutation = useMutation({
    mutationFn: async ({ id, isLocked, reason }: { id: string; isLocked: boolean; reason?: string }) => {
      return apiRequest("PATCH", `/api/members/${id}/lock`, { isLocked, lockReason: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setIsLockOpen(false);
      setSelectedMember(null);
      lockForm.reset();
      toast({
        title: "Berhasil",
        description: "Status akun telah diperbarui",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal memperbarui status akun",
        variant: "destructive",
      });
    },
  });

  const filteredMembers = members?.filter(
    (member) =>
      (member.phone && member.phone.includes(search)) ||
      member.name.toLowerCase().includes(search.toLowerCase())
  );

  const lockedMembers = filteredMembers?.filter((m) => m.isLocked) || [];
  const activeMembers = filteredMembers?.filter((m) => !m.isLocked) || [];

  const handleLock = (member: Member) => {
    setSelectedMember(member);
    setIsLockOpen(true);
  };

  const handleUnlock = (member: Member) => {
    lockMutation.mutate({ id: member.id, isLocked: false });
  };

  const onLockSubmit = (data: LockForm) => {
    if (selectedMember) {
      lockMutation.mutate({ id: selectedMember.id, isLocked: true, reason: data.reason });
    }
  };

  const MemberCard = ({ member, showUnlock = false }: { member: Member; showUnlock?: boolean }) => (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border p-4"
      data-testid={`lock-member-${member.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full font-medium shrink-0 ${
          member.isLocked
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary"
        }`}>
          {member.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{member.name}</p>
            {member.isLocked && (
              <Badge variant="destructive" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Terkunci
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{member.email}</p>
          {member.lockReason && (
            <p className="text-sm text-destructive mt-1">
              Alasan: {member.lockReason}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showUnlock ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUnlock(member)}
            disabled={lockMutation.isPending}
            data-testid={`button-unlock-${member.id}`}
          >
            <Unlock className="h-4 w-4 mr-2" />
            Buka Kunci
          </Button>
        ) : (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleLock(member)}
            data-testid={`button-lock-${member.id}`}
          >
            <Lock className="h-4 w-4 mr-2" />
            Kunci Akun
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kunci Akun</h1>
        <p className="text-muted-foreground">
          Kunci akun pelanggan agar tidak dapat login ke dalam sistem
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <Lock className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lockedMembers.length}</p>
                <p className="text-sm text-muted-foreground">Akun Terkunci</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeMembers.length}</p>
                <p className="text-sm text-muted-foreground">Akun Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Akun Terkunci
              </CardTitle>
              <CardDescription>
                Daftar akun yang saat ini terkunci
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nomor telepon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-lock"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : lockedMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Shield className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Tidak ada akun terkunci</p>
              <p className="text-sm">Semua akun dalam status aktif</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lockedMembers.map((member) => (
                <MemberCard key={member.id} member={member} showUnlock />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Akun Aktif
          </CardTitle>
          <CardDescription>
            Pilih akun untuk dikunci
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : activeMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertTriangle className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Tidak ada akun aktif</p>
              <p className="text-sm">Tambahkan anggota baru di menu Anggota</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeMembers.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isLockOpen} onOpenChange={setIsLockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Kunci Akun
            </DialogTitle>
            <DialogDescription>
              Akun yang dikunci tidak dapat login ke sistem. Berikan alasan penguncian.
            </DialogDescription>
          </DialogHeader>
          <Form {...lockForm}>
            <form onSubmit={lockForm.handleSubmit(onLockSubmit)} className="space-y-4">
              {selectedMember && (
                <div className="rounded-md border p-3 bg-muted/50">
                  <p className="font-medium">{selectedMember.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                </div>
              )}
              <FormField
                control={lockForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alasan Penguncian</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Masukkan alasan penguncian akun..."
                        {...field}
                        data-testid="input-lock-reason"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLockOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={lockMutation.isPending}
                  data-testid="button-confirm-lock"
                >
                  {lockMutation.isPending ? "Memproses..." : "Kunci Akun"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
