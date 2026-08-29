import "server-only";
import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
} from "node:crypto";

/**
 * Cifra símetrica (AES-256-GCM) para segredos por usuário salvos no banco
 * (chaves de API, tokens). A chave é derivada de BETTER_AUTH_SECRET com um
 * contexto próprio (não reaproveita a mesma chave usada para sessões).
 *
 * Formato do valor cifrado: "v1:<iv>:<authTag>:<ciphertext>" (tudo em hex).
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const VERSION_PREFIX = "v1";

function deriveKey(): Buffer {
	const secret = process.env.BETTER_AUTH_SECRET;
	if (!secret) {
		throw new Error(
			"BETTER_AUTH_SECRET não configurado — necessário para cifrar segredos de integração.",
		);
	}
	return createHash("sha256")
		.update(`mepoupe:user-integrations:${secret}`)
		.digest();
}

export function encryptSecret(plainText: string): string {
	const key = deriveKey();
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, key, iv);
	const encrypted = Buffer.concat([
		cipher.update(plainText, "utf8"),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();

	return [
		VERSION_PREFIX,
		iv.toString("hex"),
		authTag.toString("hex"),
		encrypted.toString("hex"),
	].join(":");
}

/**
 * Descriptografa um valor gerado por `encryptSecret`. Retorna `null` em vez
 * de lançar erro — um valor corrompido ou uma troca de BETTER_AUTH_SECRET não
 * deve derrubar a aplicação, apenas fazer o segredo parecer "não configurado".
 */
export function decryptSecret(value: string): string | null {
	try {
		const [version, ivHex, authTagHex, dataHex] = value.split(":");
		if (version !== VERSION_PREFIX || !ivHex || !authTagHex || !dataHex) {
			return null;
		}

		const key = deriveKey();
		const decipher = createDecipheriv(
			ALGORITHM,
			key,
			Buffer.from(ivHex, "hex"),
		);
		decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

		const decrypted = Buffer.concat([
			decipher.update(Buffer.from(dataHex, "hex")),
			decipher.final(),
		]);
		return decrypted.toString("utf8");
	} catch {
		return null;
	}
}

/** Mostra só os últimos 4 caracteres, pra confirmar visualmente sem expor a chave. */
export function maskSecret(plainText: string): string {
	const trimmed = plainText.trim();
	if (trimmed.length <= 4) return "••••";
	return `•••• ${trimmed.slice(-4)}`;
}
