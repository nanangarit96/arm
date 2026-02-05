import { Link, useLocation } from "wouter";
import { Home, Store, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";

const PANEL_PATH = "/wk-panel-2210";

const navItems = [
  { title: "Beranda", url: `${PANEL_PATH}/`, icon: Home },
  { title: "Mall", url: `${PANEL_PATH}/mall`, icon: Store },
  { title: "Aturan", url: `${PANEL_PATH}/aturan`, icon: FileText },
  { title: "Akun", url: `${PANEL_PATH}/akun`, icon: User },
];

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 pb-16">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location === item.url;
            return (
              <Link key={item.title} href={item.url}>
                <div
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-2",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs">{item.title}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
