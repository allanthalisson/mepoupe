import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { authClient, type AuthUser } from "@/lib/auth";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    try {
      const session = await authClient.getSession();
      setUser(session?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void refresh(); }, []);
  const signOut = async () => {
    await authClient.signOut();
    setUser(null);
  };
  return <AuthContext.Provider value={{ user, loading, refresh, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}