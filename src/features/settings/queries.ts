import { eq } from "drizzle-orm";
import { decryptSecret, maskSecret } from "@/shared/lib/crypto/secret-box";
import { db, schema } from "@/shared/lib/db";
import {
	USER_CONFIGURABLE_AI_PROVIDERS,
	type UserAiProvider,
} from "./lib/integrations";

interface UserPreferences {
	statementNoteAsColumn: boolean;
	transactionsColumnOrder: string[] | null;
	attachmentMaxSizeMb: number;
	showTransactionSummary: boolean;
	groupTransactionsByDate: boolean;
	hideAnticipatedInstallments: boolean;
}

async function fetchAuthProvider(userId: string): Promise<string> {
	const userAccount = await db.query.account.findFirst({
		where: eq(schema.account.userId, userId),
	});
	return userAccount?.providerId || "credential";
}

export async function fetchUserPreferences(
	userId: string,
): Promise<UserPreferences | null> {
	const result = await db
		.select({
			statementNoteAsColumn: schema.userPreferences.statementNoteAsColumn,
			transactionsColumnOrder: schema.userPreferences.transactionsColumnOrder,
			attachmentMaxSizeMb: schema.userPreferences.attachmentMaxSizeMb,
			showTransactionSummary: schema.userPreferences.showTransactionSummary,
			groupTransactionsByDate: schema.userPreferences.groupTransactionsByDate,
			hideAnticipatedInstallments:
				schema.userPreferences.hideAnticipatedInstallments,
		})
		.from(schema.userPreferences)
		.where(eq(schema.userPreferences.userId, userId))
		.limit(1);

	if (!result[0]) return null;

	return result[0];
}

export type UserIntegrationsSummary = {
	brapi: { configured: boolean; masked: string | null };
	aiProviders: Record<
		UserAiProvider,
		{ configured: boolean; masked: string | null }
	>;
	consultantModelId: string | null;
};

function maskCipher(cipher: string | null | undefined): string | null {
	if (!cipher) return null;
	const plain = decryptSecret(cipher);
	return plain ? maskSecret(plain) : null;
}

export async function fetchUserIntegrations(
	userId: string,
): Promise<UserIntegrationsSummary> {
	const row = await db.query.userIntegrations.findFirst({
		where: eq(schema.userIntegrations.userId, userId),
	});

	const brapiMasked = maskCipher(row?.brapiToken);
	const aiApiKeys = row?.aiApiKeys ?? {};

	const aiProviders = {} as UserIntegrationsSummary["aiProviders"];
	for (const provider of USER_CONFIGURABLE_AI_PROVIDERS) {
		const masked = maskCipher(aiApiKeys[provider]);
		aiProviders[provider] = { configured: !!masked, masked };
	}

	return {
		brapi: { configured: !!brapiMasked, masked: brapiMasked },
		aiProviders,
		consultantModelId: row?.consultantModelId ?? null,
	};
}

export async function fetchSettingsPageData(userId: string) {
	const [authProvider, userPreferences, userIntegrations] = await Promise.all([
		fetchAuthProvider(userId),
		fetchUserPreferences(userId),
		fetchUserIntegrations(userId),
	]);

	return {
		authProvider,
		userPreferences,
		userIntegrations,
	};
}
