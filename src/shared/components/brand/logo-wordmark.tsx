import Image from "next/image";
import { cn } from "@/shared/utils/ui";

type LogoTone = "adaptive" | "light" | "dark" | "orange";

interface LogoWordmarkProps {
	className?: string;
	tone?: LogoTone;
}

/**
 * Wordmark "me.poupe" usando os assets oficiais transparentes da marca.
 * O tom adaptativo alterna entre azul-marinho no tema claro e branco no tema
 * escuro; use um tom fixo em fundos com cor própria.
 */
export function LogoWordmark({
	className,
	tone = "adaptive",
}: LogoWordmarkProps) {
	const lightSource =
		tone === "orange"
			? "/brand/wordmark-orange-transparent.png"
			: tone === "light"
				? "/brand/wordmark-white-transparent.png"
				: "/brand/wordmark-navy-transparent.png";
	const darkSource =
		tone === "orange"
			? "/brand/wordmark-orange-transparent.png"
			: "/brand/wordmark-white-transparent.png";
	const isAdaptive = tone === "adaptive";

	return (
		<span
			role="img"
			aria-label="me.poupe"
			className={cn("inline-flex h-[1em] items-center leading-none", className)}
		>
			<Image
				src={lightSource}
				alt=""
				width={1058}
				height={140}
				className={cn(
					"h-full w-auto object-contain",
					isAdaptive && "dark:hidden",
				)}
				priority
			/>
			{isAdaptive && (
				<Image
					src={darkSource}
					alt=""
					width={1070}
					height={133}
					className="hidden h-full w-auto object-contain dark:block"
					priority
				/>
			)}
		</span>
	);
}
