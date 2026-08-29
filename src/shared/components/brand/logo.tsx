import { LogoWordmark } from "@/shared/components/brand/logo-wordmark";
import { cn } from "@/shared/utils/ui";

interface LogoProps {
	/** Classes extras aplicadas no wordmark "me.poupe" */
	className?: string;
	tone?: "adaptive" | "light" | "dark" | "orange";
}

/**
 * Marca do produto com suporte aos tons oficiais do wordmark.
 * O ícone quadrado fica reservado para favicon e PWA.
 */
export function Logo({ className, tone = "adaptive" }: LogoProps) {
	return (
		<LogoWordmark
			tone={tone}
			className={cn("text-lg text-foreground", className)}
		/>
	);
}
