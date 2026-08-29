import "server-only";
import { eq } from "drizzle-orm";
import { userIntegrations } from "@/db/schema";
import type { UserModelApiKeys } from "@/shared/lib/ai/model-provider";
import { decryptSecret } from "@/shared/lib/crypto/secret-box";
import { db } from "@/shared/lib/db";

export type UserIntegrationSecrets = {
	brapiToken: string | null;
	aiApiKeys: UserModelApiKeys;
	consultantModelId: string | null;
};

/**
 * Busca e descriptografa as chaves de integração do usuário (BRAPI, IA).
 * Nunca retorna o valor cifrado — só o texto puro pronto pra uso no servidor,
 * ou `null`/objeto vazio quando não configurado ou não descriptografável.
 */
export async function fetchUserIntegrationSecrets(
	userId: string,
): Promise<UserIntegrationSecrets> {
	const row = await db.query.userIntegrations.findFirst({
		where: eq(userIntegrations.userId, userId),
	});

	const brapiToken = row?.brapiToken ? decryptSecret(row.brapiToken) : null;

	const aiApiKeys: UserModelApiKeys = {};
	for (const [provider, cipher] of Object.entries(row?.aiApiKeys ?? {})) {
		const plain = decryptSecret(cipher);
		if (plain) {
			aiApiKeys[provider as keyof UserModelApiKeys] = plain;
		}
	}

	return {
		brapiToken,
		aiApiKeys,
		consultantModelId: row?.consultantModelId ?? null,
	};
}
