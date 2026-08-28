import { cn } from "@/shared/utils/ui";

interface LogoWordmarkProps {
	className?: string;
}

/**
 * Wordmark "me.poupe". Única aplicação da fonte de logo (Unbounded) — o
 * restante da interface usa Mona Sans. Cor herdada do elemento pai; passe
 * `className` para ajustar tamanho e cor conforme o fundo.
 */
export function LogoWordmark({ className }: LogoWordmarkProps) {
	return (
		<span
			role="img"
			aria-label="me.poupe"
			className={cn(
				"font-logo inline-flex items-baseline font-extrabold lowercase leading-none tracking-tight",
				className,
			)}
		>
			me<span className="text-primary">.</span>poupe
		</span>
	);
}
