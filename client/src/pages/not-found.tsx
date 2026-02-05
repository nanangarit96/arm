import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  const handleGoHome = () => {
    localStorage.removeItem("currentUser");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold">Halaman Tidak Ditemukan</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Halaman yang Anda cari tidak ada atau sesi Anda telah berakhir.
          </p>

          <Button 
            onClick={handleGoHome} 
            className="mt-6 w-full"
            data-testid="button-go-home"
          >
            <Home className="h-4 w-4 mr-2" />
            Kembali ke Halaman Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
