"use server";

import { generateObject } from "ai";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { categories, transactions } from "@/db/schema";
import { DEFAULT_MODEL } from "@/features/insights/constants";
import { looseMerchantKey } from "@/features/transactions/lib/import-utils";
import { resolveLanguageModel } from "@/shared/lib/ai/model-provider";
import { getUserId } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import { fetchUserIntegrationSecrets } from "@/shared/lib/integrations/user-keys";

/**
 * Atribuição automática de categoria para lançamentos importados sem
 * categoria (arquivo não trouxe coluna de categoria, ou o valor não bateu
 * com nenhuma categoria existente). Ordem de prioridade:
 *
 * 1. Histórico real da conta: lançamentos já categorizados pelo próprio
 *    usuário com o mesmo estabelecimento (chave "solta", ignorando datas e
 *    IDs de transação embutidos na descrição).
 * 2. IA: para o que sobrar, sugere a categoria com base só no nome do
 *    estabelecimento, entre as categorias já cadastradas pelo usuário.
 *    Só roda se o usuário (ou o host) tiver uma chave de IA configurada —
 *    é uma conveniência opcional, nunca bloqueia a importação.
 */

type RowInput = {
	description: string;
	transactionType: "income" | "expense";
};

type CategoryMatch = {
	categoryId: string;
	source: "history" | "ai";
};

async function fetchHistoryMatches(
	userId: string,
	rows: RowInput[],
): Promise<Map<string, CategoryMatch>> {
	// Uma consulta só, agregada, independente do tamanho do arquivo importado.
	const history = await db
		.select({
			name: transactions.name,
			categoryId: transactions.categoryId,
			transactionType: transactions.transactionType,
			count: sql<number>`count(*)`,
		})
		.from(transactions)
		.where(
			and(eq(transactions.userId, userId), isNotNull(transactions.categoryId)),
		)
		.groupBy(
			transactions.name,
			transactions.categoryId,
			transactions.transactionType,
		)
		.orderBy(sql`count(*) desc`)
		.limit(3000);

	// merchantKey|tipo -> categoryId mais frequente (primeira ocorrência, já
	// que a lista vem ordenada por frequência decrescente).
	const bestByKey = new Map<string, string>();
	for (const row of history) {
		if (!row.categoryId || !row.name) continue;
		const type = row.transactionType === "Receita" ? "income" : "expense";
		const key = `${type}:${looseMerchantKey(row.name)}`;
		if (!bestByKey.has(key)) bestByKey.set(key, row.categoryId);
	}

	const matches = new Map<string, CategoryMatch>();
	for (const row of rows) {
		const key = `${row.transactionType}:${looseMerchantKey(row.description)}`;
		const categoryId = bestByKey.get(key);
		if (categoryId)
			matches.set(row.description, { categoryId, source: "history" });
	}
	return matches;
}

const AiCategorySuggestionSchema = z.object({
	suggestions: z.array(
		z.object({
			description: z.string(),
			categoryName: z
				.string()
				.nullable()
				.describe(
					"Nome exato de uma das categorias fornecidas, ou null se nenhuma se encaixa.",
				),
		}),
	),
});

async function fetchAiMatches(
	userId: string,
	rows: RowInput[],
): Promise<Map<string, CategoryMatch>> {
	const matches = new Map<string, CategoryMatch>();
	if (rows.length === 0) return matches;

	const { aiApiKeys, consultantModelId } =
		await fetchUserIntegrationSecrets(userId);
	const modelId =
		consultantModelId ??
		process.env.FINANCIAL_CONSULTANT_MODEL ??
		DEFAULT_MODEL;
	const resolvedModel = resolveLanguageModel(modelId, aiApiKeys);
	if (!resolvedModel.success) return matches; // sem IA configurada: só pula, não quebra a importação

	const userCategories = await db
		.select({ id: categories.id, name: categories.name, type: categories.type })
		.from(categories)
		.where(eq(categories.userId, userId));
	if (userCategories.length === 0) return matches;

	const byType = {
		income: userCategories.filter((c) => c.type === "receita"),
		expense: userCategories.filter((c) => c.type === "despesa"),
	};

	// Agrupa por tipo pra listar só as categorias compatíveis pro modelo,
	// e deduplica descrições (uma chamada só, não uma por linha).
	const uniqueByType = {
		income: [
			...new Set(
				rows
					.filter((r) => r.transactionType === "income")
					.map((r) => r.description),
			),
		],
		expense: [
			...new Set(
				rows
					.filter((r) => r.transactionType === "expense")
					.map((r) => r.description),
			),
		],
	};

	for (const type of ["expense", "income"] as const) {
		const descriptions = uniqueByType[type];
		const categoryList = byType[type];
		if (descriptions.length === 0 || categoryList.length === 0) continue;

		try {
			const result = await generateObject({
				model: resolvedModel.model,
				schema: AiCategorySuggestionSchema,
				system:
					"Você categoriza lançamentos financeiros de um app de finanças pessoais brasileiro. " +
					"Para cada descrição de lançamento, escolha o nome exato de UMA categoria da lista fornecida " +
					"que melhor descreve o estabelecimento ou o tipo de gasto/receita. " +
					"Se a descrição for genérica demais ou não se encaixar em nenhuma categoria com segurança, responda categoryName: null. " +
					"Nunca invente um nome de categoria fora da lista fornecida.",
				prompt: `Categorias disponíveis (${type === "expense" ? "despesa" : "receita"}): ${categoryList.map((c) => c.name).join(", ")}

Descrições dos lançamentos para categorizar:
${descriptions.map((d, i) => `${i + 1}. ${d}`).join("\n")}

Responda com um item por descrição, na mesma ordem.`,
			});

			const categoryIdByName = new Map(
				categoryList.map((c) => [c.name.trim().toLowerCase(), c.id] as const),
			);
			for (const suggestion of result.object.suggestions) {
				if (!suggestion.categoryName) continue;
				const categoryId = categoryIdByName.get(
					suggestion.categoryName.trim().toLowerCase(),
				);
				if (categoryId && !matches.has(suggestion.description)) {
					matches.set(suggestion.description, { categoryId, source: "ai" });
				}
			}
		} catch (error) {
			console.error("Erro ao sugerir categorias via IA:", error);
			// Segue sem sugestão de IA pra esse grupo — não bloqueia a importação.
		}
	}

	return matches;
}

/**
 * Resolve categoria para linhas importadas sem categoria, combinando
 * histórico da conta (prioridade) e sugestão por IA (fallback). Retorna um
 * map por descrição ORIGINAL (não normalizada) — chame só com as linhas que
 * ainda estão sem categoria após a memória de importação existente.
 */
export async function resolveImportCategoriesAction(
	rows: RowInput[],
): Promise<Record<string, { categoryId: string; source: "history" | "ai" }>> {
	if (rows.length === 0) return {};
	const userId = await getUserId();

	const historyMatches = await fetchHistoryMatches(userId, rows);
	const remaining = rows.filter((row) => !historyMatches.has(row.description));
	const aiMatches = await fetchAiMatches(userId, remaining);

	const result: Record<string, CategoryMatch> = {};
	for (const [description, match] of historyMatches)
		result[description] = match;
	for (const [description, match] of aiMatches) result[description] = match;
	return result;
}
