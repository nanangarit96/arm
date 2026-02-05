import { useRole } from "@/lib/role-context";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function RoleSwitcher() {
  const { currentUser, logout } = useRole();

  if (!currentUser) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden sm:inline">
        {currentUser.name} ({currentUser.role})
      </span>
      <Button variant="ghost" size="icon" onClick={logout} title="Logout">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
