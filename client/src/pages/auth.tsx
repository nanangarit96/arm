import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/lib/role-context";
import { Shield, LogIn, UserPlus, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AuthPage() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regInvitationCode, setRegInvitationCode] = useState("");
  const [agentInfo, setAgentInfo] = useState<{ valid: boolean; agentName?: string } | null>(null);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setCurrentUser } = useRole();

  // Verify invitation code when it changes
  useEffect(() => {
    const verifyCode = async () => {
      if (regInvitationCode.length < 3) {
        setAgentInfo(null);
        return;
      }
      
      setVerifyingCode(true);
      try {
        const response = await fetch(`/api/verify-invitation/${encodeURIComponent(regInvitationCode)}`);
        const data = await response.json();
        setAgentInfo(data);
      } catch {
        setAgentInfo({ valid: false });
      }
      setVerifyingCode(false);
    };

    const debounce = setTimeout(verifyCode, 500);
    return () => clearTimeout(debounce);
  }, [regInvitationCode]);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      });
      toast({
        title: "Login Berhasil",
        description: `Selamat datang, ${data.user.name}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login Gagal",
        description: error.message || "Email atau password salah",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string; password: string; invitationCode: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Pendaftaran Berhasil",
        description: data.message || "Akun Anda sedang menunggu persetujuan Admin.",
      });
      // Clear form
      setRegName("");
      setRegEmail("");
      setRegPhone("");
      setRegPassword("");
      setRegInvitationCode("");
      setAgentInfo(null);
    },
    onError: (error: any) => {
      toast({
        title: "Pendaftaran Gagal",
        description: error.message || "Terjadi kesalahan saat mendaftar",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email: loginEmail, password: loginPassword });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentInfo?.valid) {
      toast({
        title: "Kode Undangan Tidak Valid",
        description: "Silakan masukkan kode undangan yang valid dari Agent",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate({
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      invitationCode: regInvitationCode,
    });
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-0">
          <div className="flex justify-center mb-2">
            <img 
              src="/download.png" 
              alt="Giorgio Armani" 
              className="h-40 w-40"
            />
          </div>          
         </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" data-testid="tab-login">
                <LogIn className="h-4 w-4 mr-2" />
                Masuk
              </TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">
                <UserPlus className="h-4 w-4 mr-2" />
                Daftar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input 
                    id="login-email" 
                    type="email" 
                    placeholder="nama@email.com" 
                    required 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    data-testid="input-login-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input 
                    id="login-password" 
                    type="password" 
                    required 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    data-testid="input-login-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Masuk Sekarang"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-invitation">Kode Undangan</Label>
                  <div className="relative">
                    <Input 
                      id="reg-invitation" 
                      placeholder="Masukkan kode dari Agent Anda" 
                      required 
                      value={regInvitationCode}
                      onChange={(e) => setRegInvitationCode(e.target.value.toUpperCase())}
                      className={agentInfo?.valid ? "border-green-500 pr-10" : agentInfo === null ? "" : "border-red-500 pr-10"}
                      data-testid="input-register-invitation"
                    />
                    {verifyingCode && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!verifyingCode && agentInfo?.valid && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                    {!verifyingCode && agentInfo && !agentInfo.valid && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                    )}
                  </div>
                  {agentInfo?.valid && agentInfo.agentName && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Terdaftar di bawah Agent: <strong>{agentInfo.agentName}</strong>
                    </p>
                  )}
                  {agentInfo && !agentInfo.valid && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Kode undangan tidak ditemukan
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Nama Lengkap</Label>
                  <Input 
                    id="reg-name" 
                    placeholder="Masukkan nama sesuai KTP" 
                    required 
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    data-testid="input-register-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="nama@email.com" 
                    required 
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    data-testid="input-register-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-phone">Nomor Telepon (WhatsApp)</Label>
                  <Input 
                    id="reg-phone" 
                    placeholder="0812..." 
                    required 
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    data-testid="input-register-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input 
                    id="reg-password" 
                    type="password" 
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    data-testid="input-register-password"
                  />
                  <p className="text-xs text-muted-foreground">Minimal 6 karakter</p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registerMutation.isPending || !agentInfo?.valid}
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Daftar Akun Kerja"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col text-center space-y-2">
          <p className="text-xs text-muted-foreground italic">
            Copyright © 2026 Giorgio Armani S.p.A. - All Rights Reserved
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
