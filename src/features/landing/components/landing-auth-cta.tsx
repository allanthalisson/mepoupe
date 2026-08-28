import Link from "next/link";
import { getLandingAccessState } from "@/features/landing/queries";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/ui";

interface LandingAuthCtaProps {
	size?: "default" | "lg";
	className?: string;
}

/**
 * CTA de conta (criar conta / entrar / ir para o dashboard) usado no hero e
 * na seção final da landing page. Fica oculto em domínios públicos
 * (`PUBLIC_DOMAIN`), que servem só a landing sem expor login/signup.
 */
export async function LandingAuthCta({
	size = "lg",
	className,
}: LandingAuthCtaProps) {
	const { isPublicDomain, isLoggedIn, signupDisabled } =
		await getLandingAccessState();

	if (isPublicDomain) return null;

	if (isLoggedIn) {
		return (
			<div className={className}>
				<Link href="/dashboard" className="w-full sm:w-auto">
					<Button size={size} className="w-full sm:w-auto">
						Ir para o Dashboard
					</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className={className}>
			{!signupDisabled && (
				<Link href="/signup" className="w-full sm:w-auto">
					<Button size={size} className="w-full sm:w-auto">
						Criar conta
					</Button>
				</Link>
			)}
			<Link href="/login" className="w-full sm:w-auto">
				<Button
					size={size}
					variant={signupDisabled ? "default" : "outline"}
					className="w-full sm:w-auto"
				>
					Entrar
				</Button>
			</Link>
		</div>
	);
}

export function LandingAuthCtaFallback({ className }: { className?: string }) {
	return (
		<div className={cn(className)} aria-hidden="true">
			<div className="h-11 w-full animate-pulse rounded-md bg-muted sm:w-40" />
			<div className="h-11 w-full animate-pulse rounded-md bg-muted sm:w-40" />
		</div>
	);
}
