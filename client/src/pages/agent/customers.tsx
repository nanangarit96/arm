import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Users, Search, Mail, Phone, Wallet, Lock, Copy, Share2, Ticket, Calendar, CreditCard, Pencil, Save, X, UserPlus, Landmark } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Member, User } from "@shared/schema";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function AgentCustomers() {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Member | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", newPassword: "", withdrawalLocked: false, withdrawalLockReason: "", bankName: "", bankAccountNumber: "", bankAccountName: "", creditScore: 100 });
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
  });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", phone: "", password: "" });
  const { currentUser } = useRole();
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Member> }) => {
      return apiRequest("PATCH", `/api/members/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setIsEditing(false);
      setDetailDialogOpen(false);
      toast({
        title: "Berhasil",
        description: "Data pelanggan telah diperbarui",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal memperbarui data",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string; password: string; agentId: string; invitationCode: string }) => {
      return apiRequest("POST", "/api/members/register", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setRegisterDialogOpen(false);
      setRegisterForm({ name: "", email: "", phone: "", password: "" });
      toast({
        title: "Berhasil",
        description: "Pelanggan baru telah terdaftar",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal mendaftarkan pelanggan",
        variant: "destructive",
      });
    },
  });

  const handleRegister = () => {
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      toast({
        title: "Error",
        description: "Nama, email, dan kata sandi wajib diisi",
        variant: "destructive",
      });
      return;
    }
    if (registerForm.password.length < 6) {
      toast({
        title: "Error",
        description: "Kata sandi minimal 6 karakter",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate({
      name: registerForm.name,
      email: registerForm.email,
      phone: registerForm.phone,
      password: registerForm.password,
      agentId: currentUser?.id || "",
      invitationCode: invitationCode,
    });
  };

  const startEdit = () => {
    if (selectedCustomer) {
      setEditForm({
        name: selectedCustomer.name,
        email: selectedCustomer.email,
        phone: selectedCustomer.phone || "",
        newPassword: "",
        withdrawalLocked: selectedCustomer.withdrawalLocked || false,
        withdrawalLockReason: selectedCustomer.withdrawalLockReason || "",
        bankName: selectedCustomer.bankName || "",
        bankAccountNumber: selectedCustomer.bankAccountNumber || "",
        bankAccountName: selectedCustomer.bankAccountName || "",
        creditScore: selectedCustomer.creditScore ?? 100,
      });
      setIsEditing(true);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const saveEdit = () => {
    if (selectedCustomer) {
      const updateData: Partial<Member> & { password?: string } = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone || null,
        withdrawalLocked: editForm.withdrawalLocked,
        withdrawalLockReason: editForm.withdrawalLocked ? editForm.withdrawalLockReason : null,
        bankName: editForm.bankName || null,
        bankAccountNumber: editForm.bankAccountNumber || null,
        bankAccountName: editForm.bankAccountName || null,
        creditScore: editForm.creditScore,
      };
      if (editForm.newPassword.trim()) {
        updateData.password = editForm.newPassword;
      }
      updateMutation.mutate({
        id: selectedCustomer.id,
        data: updateData,
      });
    }
  };

  const handleBankEdit = (customer: Member) => {
    setSelectedCustomer(customer);
    setBankFormData({
      bankName: customer.bankName || "",
      bankAccountNumber: customer.bankAccountNumber || "",
      bankAccountName: customer.bankAccountName || "",
    });
    setBankDialogOpen(true);
  };

  const handleBankSave = () => {
    if (!selectedCustomer) return;
    updateMutation.mutate({
      id: selectedCustomer.id,
      data: {
        bankName: bankFormData.bankName || undefined,
        bankAccountNumber: bankFormData.bankAccountNumber || undefined,
        bankAccountName: bankFormData.bankAccountName || undefined,
      },
    });
    setBankDialogOpen(false);
    setSelectedCustomer(null);
  };

  const { data: agentData } = useQuery<User>({
    queryKey: ["/api/users", currentUser?.id],
    queryFn: async () => {
      const res = await fetch(`/api/users/${currentUser?.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!currentUser?.id,
  });

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ["/api/members", currentUser?.id],
    queryFn: async () => {
      const res = await fetch(`/api/members?agentId=${currentUser?.id}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      return res.json();
    },
    enabled: !!currentUser?.id,
  });

  // Filter only active members (approved)
  const myCustomers = members?.filter((m) => m.status === "active") || [];
  const invitationCode = agentData?.invitationCode || "N/A";

  const copyInvitationCode = () => {
    navigator.clipboard.writeText(invitationCode);
    toast({
      title: "Kode Disalin",
      description: "Kode undangan telah disalin ke clipboard",
    });
  };

  const filteredCustomers = myCustomers.filter(
    (customer) =>
      (customer.phone && customer.phone.includes(search)) ||
      customer.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pelanggan Saya</h1>
          <p className="text-muted-foreground">
            Kelola pelanggan yang ditugaskan kepada Anda
          </p>
        </div>
        <Button onClick={() => setRegisterDialogOpen(true)} data-testid="button-add-customer">
          <UserPlus className="h-4 w-4 mr-2" />
          Daftarkan Pelanggan
        </Button>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Ticket className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Kode Undangan Anda</p>
                <p className="text-2xl font-mono font-bold tracking-wider text-primary">
                  {invitationCode}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyInvitationCode} 
                disabled={invitationCode === "N/A"}
                data-testid="button-copy-code"
              >
                <Copy className="h-4 w-4 mr-2" />
                Salin
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={invitationCode === "N/A"}
                onClick={() => {
                  const text = `Daftar menggunakan kode undangan saya: ${invitationCode}`;
                  if (navigator.share) {
                    navigator.share({ text });
                  } else {
                    navigator.clipboard.writeText(text);
                    toast({ title: "Teks Disalin", description: "Teks share telah disalin" });
                  }
                }} 
                data-testid="button-share-code"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Bagikan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar Pelanggan ({myCustomers.length})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nomor telepon..."
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
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Tidak ada pelanggan</p>
              <p className="text-sm">Tambahkan pelanggan baru untuk memulai</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border p-4 hover-elevate"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-lg">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{customer.name}</p>
                        {customer.isLocked && (
                          <Badge variant="destructive" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Terkunci
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </span>
                        {customer.phone && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Saldo</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Wallet className="h-4 w-4" />
                        {formatCurrency(customer.balance || 0)}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      data-testid={`button-detail-${customer.id}`}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setDetailDialogOpen(true);
                      }}
                    >
                      Detail
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={detailDialogOpen} onOpenChange={(open) => {
        setDetailDialogOpen(open);
        if (!open) setIsEditing(false);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Pelanggan" : "Detail Pelanggan"}</DialogTitle>
          </DialogHeader>
          {selectedCustomer && !isEditing && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-2xl">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedCustomer.name}</h3>
                  <p className="text-sm text-muted-foreground">ID: {selectedCustomer.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedCustomer.email}</p>
                  </div>
                </div>
                
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Telepon</p>
                      <p className="font-medium">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo</p>
                    <p className="font-medium text-lg">{formatCurrency(selectedCustomer.balance || 0)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Status Penarikan</p>
                    <div className="flex flex-col gap-1">
                      {selectedCustomer.withdrawalLocked ? (
                        <>
                          <Badge variant="destructive">
                            <Lock className="h-3 w-3 mr-1" />
                            Penarikan Terkunci
                          </Badge>
                          {selectedCustomer.withdrawalLockReason && (
                            <p className="text-xs text-muted-foreground">
                              Alasan: {selectedCustomer.withdrawalLockReason}
                            </p>
                          )}
                        </>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Aktif
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {selectedCustomer.createdAt && (
                  <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Bergabung</p>
                      <p className="font-medium">
                        {new Date(selectedCustomer.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                  Tutup
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (selectedCustomer) {
                      setDetailDialogOpen(false);
                      handleBankEdit(selectedCustomer);
                    }
                  }}
                  data-testid="button-edit-bank"
                >
                  <Landmark className="h-4 w-4 mr-2" />
                  Edit Bank
                </Button>
                <Button onClick={startEdit} data-testid="button-edit-customer">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          )}

          {selectedCustomer && isEditing && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nama</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    data-testid="input-edit-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    data-testid="input-edit-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telepon</Label>
                  <Input
                    id="edit-phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    data-testid="input-edit-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-password">Kata Sandi Baru</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    placeholder="Kosongkan jika tidak ingin mengubah"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    data-testid="input-edit-password"
                  />
                  <p className="text-xs text-muted-foreground">Minimal 6 karakter</p>
                </div>
                <div className="space-y-3 p-3 rounded-md border">
                  <div className="flex items-center gap-2 mb-2">
                    <Landmark className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-medium">KREDIT SKOR</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-credit-score">Kredit Skor</Label>
                    <Input
                      id="edit-credit-score"
                      type="number"
                      placeholder="100"
                      value={editForm.creditScore}
                      onChange={(e) => setEditForm({ ...editForm, creditScore: parseInt(e.target.value) || 0 })}
                      data-testid="input-edit-credit-score"
                    />
                  </div>
                </div>
                <div className="space-y-3 p-3 rounded-md border">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="edit-withdrawal-locked">Kunci Penarikan</Label>
                      <p className="text-xs text-muted-foreground">Pelanggan tidak dapat menarik saldo</p>
                    </div>
                    <Switch
                      id="edit-withdrawal-locked"
                      checked={editForm.withdrawalLocked}
                      onCheckedChange={(checked) => setEditForm({ ...editForm, withdrawalLocked: checked })}
                      data-testid="switch-edit-withdrawal-locked"
                    />
                  </div>
                  {editForm.withdrawalLocked && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-withdrawal-reason">Alasan Kunci</Label>
                      <Input
                        id="edit-withdrawal-reason"
                        placeholder="Masukkan alasan kunci penarikan..."
                        value={editForm.withdrawalLockReason}
                        onChange={(e) => setEditForm({ ...editForm, withdrawalLockReason: e.target.value })}
                        data-testid="input-edit-withdrawal-reason"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={cancelEdit} data-testid="button-cancel-edit">
                  <X className="h-4 w-4 mr-2" />
                  Batal
                </Button>
                <Button onClick={saveEdit} disabled={updateMutation.isPending} data-testid="button-save-edit">
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Daftarkan Pelanggan Baru
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Nama Lengkap *</Label>
              <Input
                id="reg-name"
                placeholder="Masukkan nama lengkap"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                data-testid="input-register-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email *</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="Masukkan alamat email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                data-testid="input-register-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-phone">Nomor Telepon</Label>
              <Input
                id="reg-phone"
                placeholder="Masukkan nomor telepon"
                value={registerForm.phone}
                onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                data-testid="input-register-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Kata Sandi *</Label>
              <Input
                id="reg-password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                data-testid="input-register-password"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRegisterDialogOpen(false)} data-testid="button-cancel-register">
                Batal
              </Button>
              <Button onClick={handleRegister} disabled={registerMutation.isPending} data-testid="button-submit-register">
                <UserPlus className="h-4 w-4 mr-2" />
                {registerMutation.isPending ? "Mendaftarkan..." : "Daftarkan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bank Tujuan Deposit</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Ubah atau tambahkan informasi bank tujuan deposit untuk pelanggan "{selectedCustomer?.name}"
          </p>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bank-name">Nama Bank</Label>
              <Input
                id="bank-name"
                value={bankFormData.bankName}
                onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                placeholder="Contoh: BCA, Mandiri, BNI"
                data-testid="input-agent-bank-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bank-account-number">Nomor Rekening</Label>
              <Input
                id="bank-account-number"
                value={bankFormData.bankAccountNumber}
                onChange={(e) => setBankFormData({ ...bankFormData, bankAccountNumber: e.target.value })}
                placeholder="Contoh: 1234567890"
                data-testid="input-agent-bank-account-number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bank-account-name">Nama Pemilik Rekening</Label>
              <Input
                id="bank-account-name"
                value={bankFormData.bankAccountName}
                onChange={(e) => setBankFormData({ ...bankFormData, bankAccountName: e.target.value })}
                placeholder="Nama sesuai buku tabungan"
                data-testid="input-agent-bank-account-name"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBankDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleBankSave}
              disabled={updateMutation.isPending}
              data-testid="button-agent-save-bank"
            >
              {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
