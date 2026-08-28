import { AuthLayout } from "@/components/layout/AuthLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { authClient } from "@/lib/auth";

export default function SignupPage() {
    const [, setLocation] = useLocation();
    const [isLoading, setIsLoading] = useState(false);

    const [error, setError] = useState("");
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        const form = new FormData(e.currentTarget);
        try {
            await authClient.signUp(String(form.get("name")), String(form.get("email")), String(form.get("password")));
            setLocation("/dashboard");
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Não foi possível criar a conta.");
        } finally { setIsLoading(false); }
    };

    return (
        <AuthLayout>
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight">Criar uma conta</h1>
                    <p className="text-muted-foreground text-sm">
                        Instale seu próprio servidor OpenMonetis
                    </p>
                </div>
                
                <Card className="border-border/50 shadow-xl shadow-primary/5">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome completo</Label>
                                <Input id="name" name="name" type="text" autoComplete="name" placeholder="Seu nome" required disabled={isLoading} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" autoComplete="email" placeholder="nome@exemplo.com" required disabled={isLoading} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <Input id="password" name="password" type="password" autoComplete="new-password" required disabled={isLoading} />
                            </div>
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading ? "Criando..." : "Criar conta"}
                            </Button>
                            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                        </form>
                    </CardContent>
                </Card>

                <p className="px-8 text-center text-sm text-muted-foreground">
                    Já tem uma conta?{" "}
                    <Link href="/login" className="underline underline-offset-4 hover:text-primary font-medium text-foreground">
                        Faça login
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
