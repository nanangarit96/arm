import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { apiRequest } from "./queryClient";

export type UserRole = "master" | "admin" | "agent" | "customer";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface RoleContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isRefreshing: boolean;
  refreshSession: () => Promise<boolean>;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!currentUser) return false;
    setIsRefreshing(true);
    try {
      const response = await apiRequest("GET", "/api/auth/me");
      const data = await response.json();
      if (data.user) {
        setCurrentUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [currentUser]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    apiRequest("POST", "/api/auth/logout").catch(() => {});
  }, []);

  return (
    <RoleContext.Provider value={{ currentUser, setCurrentUser, isRefreshing, refreshSession, logout }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
