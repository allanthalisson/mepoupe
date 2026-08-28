import { Unbounded } from "next/font/google";

/**
 * Fonte exclusiva do logotipo "me.poupe". Disruptiva e geométrica, usada
 * apenas no wordmark — nunca na interface. Ver `LogoWordmark`.
 */
export const logoFont = Unbounded({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-logo",
	fallback: ["arial", "ui-sans-serif", "system-ui"],
	weight: ["700", "800"],
	preload: true,
});
