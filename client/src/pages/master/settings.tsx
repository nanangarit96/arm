import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Shield, Bell, Database, Globe } from "lucide-react";

export default function MasterSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Sistem</h1>
        <p className="text-muted-foreground">
          Konfigurasi pengaturan sistem secara keseluruhan
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Pengaturan Umum
            </CardTitle>
            <CardDescription>
              Konfigurasi pengaturan dasar sistem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="app-name">Nama Aplikasi</Label>
              <Input id="app-name" defaultValue="Admin Panel Sistem" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-name">Nama Perusahaan</Label>
              <Input id="company-name" defaultValue="PT Koperasi Maju Bersama" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mode Maintenance</Label>
                <p className="text-xs text-muted-foreground">
                  Aktifkan untuk menonaktifkan akses pengguna
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Keamanan
            </CardTitle>
            <CardDescription>
              Pengaturan keamanan sistem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-xs text-muted-foreground">
                  Wajibkan 2FA untuk semua admin
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Session Timeout</Label>
                <p className="text-xs text-muted-foreground">
                  Logout otomatis setelah tidak aktif
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-duration">Durasi Session (menit)</Label>
              <Input id="session-duration" type="number" defaultValue="30" className="w-32" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifikasi
            </CardTitle>
            <CardDescription>
              Pengaturan notifikasi sistem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Kirim notifikasi email untuk transaksi
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifikasi Deposit Pending</Label>
                <p className="text-xs text-muted-foreground">
                  Beritahu admin saat ada deposit baru
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifikasi Penarikan Pending</Label>
                <p className="text-xs text-muted-foreground">
                  Beritahu admin saat ada penarikan baru
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database
            </CardTitle>
            <CardDescription>
              Informasi dan backup database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
              <div>
                <p className="font-medium text-sm">Status Database</p>
                <p className="text-xs text-muted-foreground">In-memory storage (MVP)</p>
              </div>
              <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Database className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" size="sm">
                Import Data
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline">Batal</Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Simpan Pengaturan
          </Button>
        </div>
      </div>
    </div>
  );
}
