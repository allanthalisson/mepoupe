import { type ComponentType, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "./AuthProvider";

export function protectedPage<P extends object>(Page: ComponentType<P>) {
  return function ProtectedPage(props: P) {
    const { user, loading } = useAuth();
    const [, navigate] = useLocation();
    useEffect(() => {
      if (!loading && !user) navigate("/login");
    }, [loading, user, navigate]);
    if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando...</div>;
    return user ? <Page {...props} /> : null;
  };
}