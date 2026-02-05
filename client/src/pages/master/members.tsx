import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  MoreHorizontal,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  Ban,
  UserCheck,
  Plus,
  Wallet,
  UserPlus,
  Landmark
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Member, User } from "@shared/schema";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function MasterMembers() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [withdrawalLockDialogOpen, setWithdrawalLockDialogOpen] = useState(false);
  const [withdrawalLockReason, setWithdrawalLockReason] = useState("");
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
  });
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    status: "pending",
    assignedAgentId: "",
    balance: 0,
    isLocked: false,
    withdrawalLocked: false,
    withdrawalLockReason: "" as string | null,
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
    creditScore: 100,
  });

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const agents = users?.filter(u => u.role === "agent") || [];

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return "-";
    const agent = agents.find(a => a.id === agentId);
    return agent?.name || "-";
  };

  const filteredMembers = members?.filter(
    (member) =>
      (member.phone && member.phone.includes(search)) ||
      member.name.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = members?.filter(m => m.status === "pending").length || 0;
  const activeCount = members?.filter(m => m.status === "active").length || 0;
  const totalBalance = members?.reduce((sum, m) => sum + (m.balance || 0), 0) || 0;

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/members", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setAddDialogOpen(false);
      resetForm();
      toast({
        title: "Berhasil",
        description: "Anggota baru telah ditambahkan",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal menambahkan anggota",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return apiRequest("PATCH", `/api/members/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setEditDialogOpen(false);
      setSelectedMember(null);
      resetForm();
      toast({
        title: "Berhasil",
        description: "Data anggota telah diperbarui",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal memperbarui anggota",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setDeleteDialogOpen(false);
      setSelectedMember(null);
      toast({
        title: "Berhasil",
        description: "Anggota telah dihapus",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal menghapus anggota",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      status: "pending",
      assignedAgentId: "",
      balance: 0,
      isLocked: false,
      withdrawalLocked: false,
      withdrawalLockReason: "",
      bankName: "",
      bankAccountNumber: "",
      bankAccountName: "",
      creditScore: 100,
    });
  };

  const handleAdd = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || "",
      password: "",
      status: member.status,
      assignedAgentId: member.assignedAgentId || "",
      balance: member.balance || 0,
      isLocked: member.isLocked || false,
      withdrawalLocked: member.withdrawalLocked || false,
      withdrawalLockReason: member.withdrawalLockReason || "",
      bankName: member.bankName || "",
      bankAccountNumber: member.bankAccountNumber || "",
      bankAccountName: member.bankAccountName || "",
      creditScore: member.creditScore ?? 100,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (member: Member) => {
    setSelectedMember(member);
    setDeleteDialogOpen(true);
  };

  const handleQuickAction = (member: Member, action: string) => {
    switch (action) {
      case "approve":
        updateMutation.mutate({ id: member.id, data: { status: "active" } });
        break;
      case "reject":
        updateMutation.mutate({ id: member.id, data: { status: "rejected" } });
        break;
      case "lock-deposit":
        updateMutation.mutate({ id: member.id, data: { isLocked: true } });
        break;
      case "unlock-deposit":
        updateMutation.mutate({ id: member.id, data: { isLocked: false } });
        break;
      case "lock-withdrawal":
        setSelectedMember(member);
        setWithdrawalLockReason("");
        setWithdrawalLockDialogOpen(true);
        break;
      case "unlock-withdrawal":
        updateMutation.mutate({ id: member.id, data: { withdrawalLocked: false, withdrawalLockReason: null } });
        break;
    }
  };

  const handleWithdrawalLock = () => {
    if (!selectedMember) return;
    if (!withdrawalLockReason.trim()) {
      toast({
        title: "Error",
        description: "Alasan penguncian harus diisi",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate({ 
      id: selectedMember.id, 
      data: { 
        withdrawalLocked: true, 
        withdrawalLockReason: withdrawalLockReason.trim() 
      } 
    });
    setWithdrawalLockDialogOpen(false);
    setSelectedMember(null);
    setWithdrawalLockReason("");
  };

  const handleBankEdit = (member: Member) => {
    setSelectedMember(member);
    setBankFormData({
      bankName: member.bankName || "",
      bankAccountNumber: member.bankAccountNumber || "",
      bankAccountName: member.bankAccountName || "",
    });
    setBankDialogOpen(true);
  };

  const handleBankSave = () => {
    if (!selectedMember) return;
    updateMutation.mutate({
      id: selectedMember.id,
      data: {
        bankName: bankFormData.bankName || undefined,
        bankAccountNumber: bankFormData.bankAccountNumber || undefined,
        bankAccountName: bankFormData.bankAccountName || undefined,
      },
    });
    setBankDialogOpen(false);
    setSelectedMember(null);
  };

  const submitAdd = () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "Error",
        description: "Nama dan email harus diisi",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const submitEdit = () => {
    if (!selectedMember) return;
    const dataToSubmit = { ...formData };
    if (!dataToSubmit.password) {
      delete (dataToSubmit as any).password;
    }
    updateMutation.mutate({ id: selectedMember.id, data: dataToSubmit });
  };

  const confirmDelete = () => {
    if (selectedMember) {
      deleteMutation.mutate(selectedMember.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aktif
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Ditolak
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Semua Anggota</h1>
          <p className="text-muted-foreground">
            Kelola semua anggota dalam sistem
          </p>
        </div>
        <Button data-testid="button-add-member" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Anggota
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{members?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Anggota</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatCurrency(totalBalance)}</p>
                <p className="text-sm text-muted-foreground">Total Saldo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar Anggota ({filteredMembers?.length || 0})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nomor telepon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-member"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredMembers?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada anggota</p>
              <Button variant="outline" className="mt-4" onClick={handleAdd}>
                <UserPlus className="h-4 w-4 mr-2" />
                Tambah Anggota Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMembers?.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border p-4 hover-elevate"
                  data-testid={`row-member-${member.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                      {member.assignedAgentId && (
                        <p className="text-xs text-muted-foreground">
                          Agent: {getAgentName(member.assignedAgentId)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">
                      {formatCurrency(member.balance || 0)}
                    </span>
                    {getStatusBadge(member.status)}
                    {member.isLocked && (
                      <Badge variant="outline" className="text-amber-600 border-amber-600">
                        <Lock className="h-3 w-3 mr-1" />
                        Deposit
                      </Badge>
                    )}
                    {member.withdrawalLocked && (
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        <Lock className="h-3 w-3 mr-1" />
                        Penarikan
                      </Badge>
                    )}
                    {member.status === "pending" && (
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleQuickAction(member, "approve")}
                          disabled={updateMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleQuickAction(member, "reject")}
                          disabled={updateMutation.isPending}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-menu-member-${member.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(member)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBankEdit(member)}>
                          <Landmark className="h-4 w-4 mr-2" />
                          Edit Bank Tujuan
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {member.isLocked ? (
                          <DropdownMenuItem onClick={() => handleQuickAction(member, "unlock-deposit")}>
                            <Unlock className="h-4 w-4 mr-2" />
                            Buka Kunci Deposit
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleQuickAction(member, "lock-deposit")}>
                            <Lock className="h-4 w-4 mr-2" />
                            Kunci Deposit
                          </DropdownMenuItem>
                        )}
                        {member.withdrawalLocked ? (
                          <DropdownMenuItem onClick={() => handleQuickAction(member, "unlock-withdrawal")}>
                            <Unlock className="h-4 w-4 mr-2" />
                            Buka Kunci Penarikan
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleQuickAction(member, "lock-withdrawal")}>
                            <Lock className="h-4 w-4 mr-2" />
                            Kunci Penarikan
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(member)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus Anggota
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Anggota Baru</DialogTitle>
            <DialogDescription>
              Isi data anggota baru yang akan ditambahkan
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nama anggota"
                data-testid="input-member-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                data-testid="input-member-email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+62812345678"
                data-testid="input-member-phone"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agent">Assign ke Agent</Label>
              <Select
                value={formData.assignedAgentId}
                onValueChange={(val) => setFormData({ ...formData, assignedAgentId: val })}
              >
                <SelectTrigger data-testid="select-member-agent">
                  <SelectValue placeholder="Pilih agent (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger data-testid="select-member-status">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={submitAdd} 
              disabled={createMutation.isPending}
              data-testid="button-submit-add-member"
            >
              {createMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Anggota</DialogTitle>
            <DialogDescription>
              Ubah data anggota "{selectedMember?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nama Lengkap</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-edit-member-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-edit-member-email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Nomor Telepon</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                data-testid="input-edit-member-phone"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">Kata Sandi Baru</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Kosongkan jika tidak ingin mengubah"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                data-testid="input-edit-member-password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-agent">Assign ke Agent</Label>
              <Select
                value={formData.assignedAgentId || "none"}
                onValueChange={(val) => setFormData({ ...formData, assignedAgentId: val === "none" ? "" : val })}
              >
                <SelectTrigger data-testid="select-edit-member-agent">
                  <SelectValue placeholder="Pilih agent (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger data-testid="select-edit-member-status">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-balance">Saldo</Label>
              <Input
                id="edit-balance"
                type="number"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                data-testid="input-edit-member-balance"
              />
            </div>
            <div className="space-y-3 p-3 rounded-md border">
              <div className="flex items-center gap-2 mb-2">
                <Landmark className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Informasi Bank</Label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-bank-name">Nama Bank</Label>
                <Input
                  id="edit-bank-name"
                  placeholder="BCA, BNI, Mandiri, dll"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  data-testid="input-edit-bank-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-bank-account">Nomor Rekening</Label>
                <Input
                  id="edit-bank-account"
                  placeholder="Nomor rekening bank"
                  value={formData.bankAccountNumber}
                  onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  data-testid="input-edit-bank-account"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-bank-account-name">Nama Pemilik Rekening</Label>
                <Input
                  id="edit-bank-account-name"
                  placeholder="Nama sesuai buku tabungan"
                  value={formData.bankAccountName}
                  onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                  data-testid="input-edit-bank-account-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-credit-score">Kredit Skor</Label>
                <Input
                  id="edit-credit-score"
                  type="number"
                  placeholder="100"
                  value={formData.creditScore}
                  onChange={(e) => setFormData({ ...formData, creditScore: parseInt(e.target.value) || 0 })}
                  data-testid="input-edit-credit-score"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-deposit-locked"
                  checked={formData.isLocked}
                  onChange={(e) => setFormData({ ...formData, isLocked: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="edit-deposit-locked">Kunci Deposit</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-withdrawal-locked"
                  checked={formData.withdrawalLocked}
                  onChange={(e) => setFormData({ ...formData, withdrawalLocked: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="edit-withdrawal-locked">Kunci Penarikan</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={submitEdit} 
              disabled={updateMutation.isPending}
              data-testid="button-submit-edit-member"
            >
              {updateMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Anggota</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus anggota "{selectedMember?.name}"? Semua data termasuk transaksi akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-member"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={withdrawalLockDialogOpen} onOpenChange={setWithdrawalLockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kunci Penarikan</DialogTitle>
            <DialogDescription>
              Masukkan alasan penguncian penarikan untuk anggota "{selectedMember?.name}". 
              Alasan ini akan ditampilkan kepada pengguna saat mencoba melakukan penarikan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="lock-reason">Alasan Penguncian</Label>
              <Input
                id="lock-reason"
                value={withdrawalLockReason}
                onChange={(e) => setWithdrawalLockReason(e.target.value)}
                placeholder="Contoh: Terdeteksi aktivitas mencurigakan, silakan hubungi admin"
                data-testid="input-withdrawal-lock-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawalLockDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleWithdrawalLock}
              disabled={updateMutation.isPending}
              data-testid="button-confirm-lock-withdrawal"
            >
              {updateMutation.isPending ? "Mengunci..." : "Kunci Penarikan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bank Tujuan Deposit</DialogTitle>
            <DialogDescription>
              Ubah atau tambahkan informasi bank tujuan deposit untuk anggota "{selectedMember?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bank-name">Nama Bank</Label>
              <Input
                id="bank-name"
                value={bankFormData.bankName}
                onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                placeholder="Contoh: BCA, Mandiri, BNI"
                data-testid="input-bank-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bank-account-number">Nomor Rekening</Label>
              <Input
                id="bank-account-number"
                value={bankFormData.bankAccountNumber}
                onChange={(e) => setBankFormData({ ...bankFormData, bankAccountNumber: e.target.value })}
                placeholder="Contoh: 1234567890"
                data-testid="input-bank-account-number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bank-account-name">Nama Pemilik Rekening</Label>
              <Input
                id="bank-account-name"
                value={bankFormData.bankAccountName}
                onChange={(e) => setBankFormData({ ...bankFormData, bankAccountName: e.target.value })}
                placeholder="Nama sesuai buku tabungan"
                data-testid="input-bank-account-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBankDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleBankSave}
              disabled={updateMutation.isPending}
              data-testid="button-save-bank"
            >
              {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
