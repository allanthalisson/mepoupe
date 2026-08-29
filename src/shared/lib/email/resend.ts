import { ReplitConnectors } from "@replit/connectors-sdk";
import { config } from "dotenv";
import { Resend } from "resend";

/**
 * Endereço "from" para envio de e-mails via Resend.
 * Lê RESEND_FROM_EMAIL do .env (valor deve estar entre aspas se tiver espaço:
 * Garante carregamento do .env no contexto da chamada (ex.: Server Actions).
 */
const FALLBACK_FROM = "me.poupe <onboarding@resend.dev>";

interface SendResendEmailInput {
	to: string;
	subject: string;
	text: string;
	html: string;
}

export function getResendFromEmail(): string {
	// Garantir que .env foi carregado (não sobrescreve variáveis já definidas)
	config({ path: ".env" });
	const raw = process.env.RESEND_FROM_EMAIL;
	const value = typeof raw === "string" ? raw.trim() : "";
	return value.length > 0 ? value : FALLBACK_FROM;
}

export async function sendResendEmail({
	to,
	subject,
	text,
	html,
}: SendResendEmailInput): Promise<void> {
	const payload = {
		from: getResendFromEmail(),
		to: [to],
		subject,
		text,
		html,
	};
	const apiKey = process.env.RESEND_API_KEY?.trim();

	if (apiKey) {
		const { error } = await new Resend(apiKey).emails.send(payload);
		if (error) {
			throw new Error("Resend email request failed");
		}
		return;
	}

	try {
		const response = await new ReplitConnectors().proxy("resend", "/emails", {
			method: "POST",
			body: payload,
		});

		if (!response.ok) {
			throw new Error(`Resend connector returned HTTP ${response.status}`);
		}
	} catch {
		throw new Error("Resend connector request failed");
	}
}
