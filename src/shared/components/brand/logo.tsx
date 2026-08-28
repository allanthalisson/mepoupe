import { LogoIcon } from "@/shared/components/brand/logo-icon";
import { LogoWordmark } from "@/shared/components/brand/logo-wordmark";
import { cn } from "@/shared/utils/ui";

interface LogoProps {
	variant?: "full" | "small" | "compact";
	className?: string;
	/** Exibe o ícone com o gradiente pôr do sol da marca, sem filtro P&B. Apenas nos variants "full" e "compact" */
	colorIcon?: boolean;
	/** Classes extras aplicadas no ícone */
	iconClassName?: string;
	/** Classes extras aplicadas no wordmark "me.poupe" */
	textClassName?: string;
}

const iconFilterClass = "brightness-0 saturate-0";

export function Logo({
	variant = "full",
	className,
	colorIcon = false,
	iconClassName,
	textClassName,
}: LogoProps) {
	if (variant === "compact") {
		return (
			<div className={cn("flex items-center gap-1.5", className)}>
				<LogoIcon
					className={cn(
						"size-8 shrink-0",
						!colorIcon && iconFilterClass,
						iconClassName,
					)}
				/>
				<LogoWordmark
					className={cn(
						"hidden text-lg text-foreground sm:inline-flex",
						textClassName,
					)}
				/>
			</div>
		);
	}

	if (variant === "small") {
		return <LogoIcon className={cn("size-8 shrink-0", className)} />;
	}

	return (
		<div className={cn("flex items-center gap-2 py-4", className)}>
			<LogoIcon
				className={cn(
					"size-8 shrink-0",
					!colorIcon && iconFilterClass,
					iconClassName,
				)}
			/>
			<LogoWordmark className={cn("text-xl text-foreground", textClassName)} />
		</div>
	);
}
