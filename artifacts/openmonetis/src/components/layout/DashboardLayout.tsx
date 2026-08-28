import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "@/components/brand/Logo";
import { AnimatedThemeToggler } from "@/components/landing/LandingNavbar";
import { RiNotification3Line, RiSettings3Line, RiLogoutBoxRLine, RiLayoutGridLine, RiWallet3Line, RiPieChart2Line, RiFileList3Line } from "@remixicon/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";

const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: RiLayoutGridLine },
    { label: "Lançamentos", href: "/transactions", icon: RiFileList3Line },
    { label: "Carteira", href: "/accounts", icon: RiWallet3Line },
    { label: "Relatórios", href: "/reports", icon: RiPieChart2Line },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
    const [location] = useLocation();
    const [, navigate] = useLocation();
    const { user, signOut } = useAuth();
    const logout = async () => {
        await signOut();
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="h-16 border-b bg-card flex items-center px-6 justify-between sticky top-0 z-40">
                <div className="flex items-center gap-8">
                    <Link href="/">
                        <Logo variant="compact" colorIcon className="cursor-pointer" />
                    </Link>
                    <nav className="hidden md:flex gap-1">
                        {navItems.map((item) => (
                            <Link key={item.href} href={item.href}>
                                <span className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    location === item.href 
                                        ? "bg-primary/10 text-primary" 
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}>
                                    {item.label}
                                </span>
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-2">
                    <span className="hidden sm:block text-sm text-muted-foreground">{user?.name}</span>
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <RiNotification3Line className="size-5" />
                    </Button>
                    <AnimatedThemeToggler />
                    <div className="h-8 w-px bg-border mx-2" />
                    <Link href="/settings" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-muted-foreground")}>
                        <RiSettings3Line className="size-5" />
                    </Link>
                    <button type="button" onClick={() => void logout()} aria-label="Sair" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-muted-foreground text-destructive hover:text-destructive")}>
                        <RiLogoutBoxRLine className="size-5" />
                    </button>
                </div>
            </header>
            <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
                {children}
            </main>
        </div>
    );
}
