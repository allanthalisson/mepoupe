import { cacheLife } from "next/cache";
import { headers } from "next/headers";
import { getOptionalUserSession } from "@/shared/lib/auth/server";
import { isSignupDisabled } from "@/shared/lib/auth/signup";

export async function getLandingCopyrightYear(): Promise<number> {
	"use cache";
	cacheLife({ revalidate: 86_400 });

	return new Date().getFullYear();
}

export type LandingAccessState = {
	/** Domínio público apenas com a landing page, sem acesso a login/signup */
	isPublicDomain: boolean;
	isLoggedIn: boolean;
	signupDisabled: boolean;
};

/**
 * Estado usado para decidir quais CTAs de conta mostrar na landing page
 * (hero, navbar e seção final). Centralizado aqui para não divergir entre
 * os pontos onde aparece.
 */
export async function getLandingAccessState(): Promise<LandingAccessState> {
	const [session, headersList] = await Promise.all([
		getOptionalUserSession(),
		headers(),
	]);
	const hostname = headersList.get("host")?.replace(/:\d+$/, "");
	const publicDomain = process.env.PUBLIC_DOMAIN?.replace(
		/^https?:\/\//,
		"",
	).replace(/:\d+$/, "");
	const isPublicDomain = !!(publicDomain && hostname === publicDomain);

	return {
		isPublicDomain,
		isLoggedIn: !!session?.user,
		signupDisabled: isSignupDisabled(),
	};
}
