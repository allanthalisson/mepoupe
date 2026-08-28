import { LogoWordmark } from "@/shared/components/brand/logo-wordmark";
import { cn } from "@/shared/utils/ui";

interface LogoProps {
	/** Classes extras aplicadas no wordmark "me.poupe" */
	className?: string;
}

/**
 * Marca do produto: só existe como logotipo (texto), sem símbolo/ícone.
 * Ver `LogoWordmark` para a implementação do texto em si.
 */
export function Logo({ className }: LogoProps) {
	return <LogoWordmark className={cn("text-lg text-foreground", className)} />;
}
