import { passkey } from "@better-auth/passkey";
import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { GoogleProfile } from "better-auth/social-providers";
import { isSignupDisabled } from "@/shared/lib/auth/signup";
import { seedDefaultCategoriesForUser } from "@/shared/lib/categories/defaults";
import { db, schema } from "@/shared/lib/db";
import { sendResendEmail } from "@/shared/lib/email/resend";
import { ensureDefaultPayerForUser } from "@/shared/lib/payers/defaults";
import { normalizeNameFromEmail } from "@/shared/lib/payers/utils";

// ============================================================================
// GOOGLE OAUTH CONFIGURATION
// ============================================================================

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const DEFAULT_SESSION_EXPIRES_IN_DAYS = 30;
const DEFAULT_SESSION_UPDATE_AGE_HOURS = 24;

function toOrigin(
	value: string | undefined,
	protocol = "https",
): string | null {
	const trimmed = value?.trim();
	if (!trimmed) return null;

	try {
		const url = new URL(
			/^https?:\/\//i.test(trimmed) ? trimmed : `${protocol}://${trimmed}`,
		);
		return url.origin;
	} catch {
		return null;
	}
}

function toHost(value: string | undefined): string | null {
	const origin = toOrigin(value);
	return origin ? new URL(origin).hostname : null;
}

function parseTrustedOrigins(): string[] {
	const configuredOrigins = [
		process.env.BETTER_AUTH_URL,
		...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? []),
		...(process.env.REPLIT_DEV_DOMAIN
			? [`https://${process.env.REPLIT_DEV_DOMAIN}`]
			: []),
		...(process.env.REPLIT_DOMAINS?.split(",").map(
			(domain) => `https://${domain}`,
		) ?? []),
	];

	return [
		"http://localhost:3000",
		"http://localhost:5000",
		"http://127.0.0.1:3000",
		"http://127.0.0.1:5000",
		...configuredOrigins
			.map((origin) => toOrigin(origin))
			.filter((origin): origin is string => Boolean(origin)),
	].filter((origin, index, origins) => origins.indexOf(origin) === index);
}

function getBaseUrlConfig() {
	const configuredBaseUrl = toOrigin(process.env.BETTER_AUTH_URL);
	if (configuredBaseUrl) return configuredBaseUrl;

	const allowedHosts = [
		"localhost",
		"127.0.0.1",
		process.env.REPLIT_DEV_DOMAIN,
		...(process.env.REPLIT_DOMAINS?.split(",") ?? []),
	]
		.map((host) => toHost(host))
		.filter((host): host is string => Boolean(host))
		.filter((host, index, hosts) => hosts.indexOf(host) === index);

	return {
		allowedHosts,
		fallback: "http://localhost:5000",
		protocol: "auto" as const,
	};
}

function parsePositiveIntegerEnv(name: string, fallback: number): number {
	const value = process.env[name];
	if (!value) return fallback;

	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const sessionExpiresInDays = parsePositiveIntegerEnv(
	"AUTH_SESSION_EXPIRES_IN_DAYS",
	DEFAULT_SESSION_EXPIRES_IN_DAYS,
);
const sessionUpdateAgeHours = parsePositiveIntegerEnv(
	"AUTH_SESSION_UPDATE_AGE_HOURS",
	DEFAULT_SESSION_UPDATE_AGE_HOURS,
);

/**
 * Extrai nome do usuário do perfil do Google com fallback hierárquico:
 * 1. profile.name (nome completo)
 * 2. profile.given_name + profile.family_name
 * 3. Nome extraído do email
 * 4. "Usuário" (fallback final)
 */
function getNameFromGoogleProfile(profile: GoogleProfile): string {
	const fullName = profile.name?.trim();
	if (fullName) return fullName;

	const fromGivenFamily = [profile.given_name, profile.family_name]
		.filter(Boolean)
		.join(" ")
		.trim();
	if (fromGivenFamily) return fromGivenFamily;

	const fromEmail = profile.email
		? normalizeNameFromEmail(profile.email)
		: undefined;

	return fromEmail ?? "Usuário";
}

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

async function sendResetPasswordEmail({
	user,
	url,
}: {
	user: { email: string };
	url: string;
}) {
	const safeUrl = escapeHtml(url);
	await sendResendEmail({
		to: user.email,
		subject: "Redefina sua senha no me.poupe",
		text: `Acesse este link para redefinir sua senha: ${url}`,
		html: `
			<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #202020;">
				<h1 style="font-size: 24px;">Redefina sua senha</h1>
				<p>Recebemos uma solicitação para redefinir a senha da sua conta me.poupe.</p>
				<p><a href="${safeUrl}">Criar uma nova senha</a></p>
				<p>Se você não fez esta solicitação, ignore este e-mail.</p>
				<p style="font-size: 12px; color: #666;">Este link expira em uma hora.</p>
			</div>
		`,
	});
}

// ============================================================================
// BETTER AUTH INSTANCE
// ============================================================================

export const auth = betterAuth({
	// Use the Replit-managed session secret when BETTER_AUTH_SECRET is not set.
	// Keeping this fallback preserves local .env compatibility while avoiding
	// Better Auth's insecure default secret in hosted environments.
	secret: process.env.BETTER_AUTH_SECRET || process.env.SESSION_SECRET,

	// Resolve the proxied Replit host instead of defaulting to localhost:3000.
	baseURL: getBaseUrlConfig(),

	// Trust host configuration for production environments
	trustedOrigins: parseTrustedOrigins(),

	// Email/Password authentication
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
		minPasswordLength: 7,
		maxPasswordLength: 23,
		sendResetPassword: sendResetPasswordEmail,
	},

	// Rate limiting
	rateLimit: {
		window: 60,
		max: 100,
		customRules: {
			"/sign-in/email": { window: 60, max: 5 },
			"/sign-up/email": { window: 60, max: 3 },
		},
	},

	// Database adapter (Drizzle + PostgreSQL)
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
		camelCase: true,
	}),

	// Session configuration - Safari compatibility
	session: {
		expiresIn: sessionExpiresInDays * 24 * 60 * 60,
		updateAge: sessionUpdateAgeHours * 60 * 60,
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5, // 5 minutes
		},
	},

	// Advanced configuration for Safari compatibility
	advanced: {
		cookieOptions: {
			sameSite: "lax", // Safari compatible
			secure: process.env.NODE_ENV === "production", // HTTPS in production only
			httpOnly: true,
		},
		crossSubDomainCookies: {
			enabled: false, // Disable for better Safari compatibility
		},
	},

	// Plugins
	plugins: [
		passkey({
			rpName: "me.poupe",
		}),
	],

	// Google OAuth (se configurado)
	socialProviders:
		googleClientId && googleClientSecret
			? {
					google: {
						clientId: googleClientId,
						clientSecret: googleClientSecret,
						mapProfileToUser: (profile) => ({
							name: getNameFromGoogleProfile(profile),
							email: profile.email,
							image: profile.picture,
							emailVerified: profile.email_verified,
						}),
					},
				}
			: undefined,

	// Database hooks - Executados após eventos do DB
	databaseHooks: {
		user: {
			create: {
				before: async () => {
					if (!isSignupDisabled()) return;

					throw new APIError("FORBIDDEN", {
						message: "Novos cadastros estão desativados.",
					});
				},
				/**
				 * Após criar novo usuário, inicializa:
				 * 1. Categorias padrão (Receitas/Despesas)
				 * 2. Payer padrão (vinculado ao usuário)
				 */
				after: async (user) => {
					// Se falhar aqui, o usuário já foi criado - considere usar queue para retry
					try {
						await seedDefaultCategoriesForUser(user.id);
						await ensureDefaultPayerForUser({
							id: user.id,
							name: user.name ?? undefined,
							email: user.email ?? undefined,
							image: user.image ?? undefined,
						});
					} catch (error) {
						console.error(
							"[Auth] Falha ao criar dados padrão do usuário:",
							error,
						);
					}
				},
			},
		},
	},
});

// Aviso em desenvolvimento se Google OAuth não estiver configurado
if (!googleClientId && process.env.NODE_ENV === "development") {
	console.warn(
		"[Auth] Google OAuth não configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET.",
	);
}
