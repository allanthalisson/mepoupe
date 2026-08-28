import { ReactNode } from "react";
import { Link } from "wouter";
import { Logo } from "@/components/brand/Logo";
import { AnimatedThemeToggler } from "@/components/landing/LandingNavbar";

export function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
            <div className="absolute top-4 right-4 z-50">
                <AnimatedThemeToggler />
            </div>
            
            {/* Sidebar Branding (Desktop) */}
            <div className="hidden md:flex flex-col justify-between w-[40%] max-w-[500px] bg-primary p-12 text-primary-foreground">
                <Link href="/">
                    <Logo variant="compact" colorIcon={false} className="cursor-pointer invert brightness-0" />
                </Link>
                
                <div>
                    <h2 className="text-3xl font-semibold mb-4">Seus dados, seu servidor.</h2>
                    <p className="text-primary-foreground/80 text-lg">
                        Tenha controle absoluto sobre sua vida financeira. 
                        O OpenMonetis é open source e 100% self-hosted.
                    </p>
                </div>
                
                <div className="text-primary-foreground/60 text-sm">
                    © {new Date().getFullYear()} OpenMonetis
                </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-6 bg-background border-b">
                <Link href="/">
                    <Logo variant="compact" colorIcon className="cursor-pointer" />
                </Link>
            </div>

            {/* Form Area */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-[400px]">
                    {children}
                </div>
            </div>
        </div>
    );
}
