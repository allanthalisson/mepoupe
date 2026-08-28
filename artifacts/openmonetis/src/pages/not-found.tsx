import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { RiErrorWarningLine, RiArrowLeftLine } from '@remixicon/react';
import { Link } from 'wouter';
import { Logo } from '@/components/brand/Logo';
import { AnimatedThemeToggler } from '@/components/landing/LandingNavbar';
import { cn } from '@/lib/utils';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground relative">
      <div className="absolute top-4 right-4 z-50">
          <AnimatedThemeToggler />
      </div>

      <header className="h-16 flex items-center px-6 border-b">
        <Link href="/">
          <Logo variant="compact" colorIcon className="cursor-pointer" />
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center max-w-md text-center">
          <div className="p-4 rounded-full bg-destructive/10 mb-6">
            <RiErrorWarningLine className="size-12 text-destructive" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Página não encontrada</h1>
          <p className="text-lg text-muted-foreground mb-8">
            O endereço que você tentou acessar não existe ou foi movido.
          </p>
          
          <Link href="/" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
            <RiArrowLeftLine className="size-5" />
            Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
