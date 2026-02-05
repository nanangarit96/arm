import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useRole } from "@/lib/role-context";
import { Landmark, Plus, MoreHorizontal, Pencil, Trash2, Power, PowerOff } from "lucide-react";
import { insertSystemBankSchema, type SystemBank, type InsertSystemBank } from "@shared/schema";

const systemBankFormSchema = insertSystemBankSchema.pick({
  bankName: true,
  accountNumber: true,
  accountName: true,
});

type SystemBankFormData = Pick<InsertSystemBank, "bankName" | "accountNumber" | "accountName">;

export default function SystemBanksPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<SystemBank | null>(null);
  const { currentUser } = useRole();
  const { toast } = useToast();

  const form = useForm<SystemBankFormData>({
    resolver: zodResolver(systemBankFormSchema),
    defaultValues: {
      bankName: "",
      accountNumber: "",
      accountName: "",
    },
  });

  useEffect(() => {
    if (editingBank) {
      form.reset({
        bankName: editingBank.bankName,
        accountNumber: editingBank.accountNumber,
        accountName: editingBank.accountName,
      });
    } else {
      form.reset({
        bankName: "",
        accountNumber: "",
        accountName: "",
      });
    }
  }, [editingBank, form]);

  const { data: banks, isLoading } = useQuery<SystemBank[]>({
    queryKey: ["/api/system-banks"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: SystemBankFormData) => {
      return apiRequest("POST", "/api/system-banks", {
        ...data,
        createdBy: currentUser?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-banks"] });
      toast({
        title: "Berhasil",
        description: "Bank tujuan berhasil ditambahkan",
      });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal menambahkan bank tujuan",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SystemBank> }) => {
      return apiRequest("PATCH", `/api/system-banks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-banks"] });
      toast({
        title: "Berhasil",
        description: "Bank tujuan berhasil diperbarui",
      });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal memperbarui bank tujuan",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/system-banks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-banks"] });
      toast({
        title: "Berhasil",
        description: "Bank tujuan berhasil dihapus",
      });
    },
    onError: () => {
      toast({
        title: "Gagal",
        description: "Gagal menghapus bank tujuan",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    form.reset();
    setEditingBank(null);
    setDialogOpen(false);
  };

  const handleEdit = (bank: SystemBank) => {
    setEditingBank(bank);
    setDialogOpen(true);
  };

  const onSubmit = (data: SystemBankFormData) => {
    if (editingBank) {
      updateMutation.mutate({
        id: editingBank.id,
        data,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleToggleActive = (bank: SystemBank) => {
    updateMutation.mutate({
      id: bank.id,
      data: { isActive: !bank.isActive },
    });
  };

  const handleDelete = (bank: SystemBank) => {
    if (confirm(`Hapus bank ${bank.bankName}?`)) {
      deleteMutation.mutate(bank.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Landmark className="h-6 w-6" />
            Bank Tujuan Deposit
          </h1>
          <p className="text-muted-foreground">
            Kelola rekening bank tujuan untuk deposit customer
          </p>
        </div>
        <Button onClick={() => { setEditingBank(null); setDialogOpen(true); }} data-testid="button-add-system-bank">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Bank
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Bank Tujuan</CardTitle>
          <CardDescription>
            Rekening bank ini akan ditampilkan ke customer saat melakukan deposit
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground" data-testid="text-loading">Memuat...</p>
          ) : banks && banks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bank</TableHead>
                  <TableHead>Nomor Rekening</TableHead>
                  <TableHead>Atas Nama</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banks.map((bank) => (
                  <TableRow key={bank.id} data-testid={`row-system-bank-${bank.id}`}>
                    <TableCell className="font-medium" data-testid={`text-bank-name-${bank.id}`}>{bank.bankName}</TableCell>
                    <TableCell className="font-mono" data-testid={`text-account-number-${bank.id}`}>{bank.accountNumber}</TableCell>
                    <TableCell data-testid={`text-account-name-${bank.id}`}>{bank.accountName}</TableCell>
                    <TableCell>
                      <Badge variant={bank.isActive ? "default" : "secondary"} data-testid={`badge-status-${bank.id}`}>
                        {bank.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-actions-${bank.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(bank)} data-testid={`button-edit-${bank.id}`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(bank)} data-testid={`button-toggle-${bank.id}`}>
                            {bank.isActive ? (
                              <>
                                <PowerOff className="h-4 w-4 mr-2" />
                                Nonaktifkan
                              </>
                            ) : (
                              <>
                                <Power className="h-4 w-4 mr-2" />
                                Aktifkan
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(bank)}
                            className="text-destructive"
                            data-testid={`button-delete-${bank.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-empty-state">
              <Landmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada bank tujuan</p>
              <p className="text-sm">Klik "Tambah Bank" untuk menambahkan rekening tujuan deposit</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setDialogOpen(true); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBank ? "Edit Bank Tujuan" : "Tambah Bank Tujuan"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Bank *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: BCA, Mandiri, BNI"
                        data-testid="input-system-bank-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Rekening *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: 1234567890"
                        data-testid="input-system-account-number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Pemilik Rekening *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: PT Koperasi Sejahtera"
                        data-testid="input-system-account-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={resetForm} data-testid="button-cancel-system-bank">
                  Batal
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-system-bank"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
