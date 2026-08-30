/**
 * Tools financeiras server-side que o Assistente (IA) pode chamar.
 *
 * Cada tool é isolada por `userId` (capturado no closure de
 * `buildAssistantTools`, nunca um parâmetro que o modelo preenche), lê
 * dados agregados já calculados deterministicamente (nunca SQL livre) e
 * devolve um resultado estruturado — a IA só interpreta e explica esse
 * resultado, nunca inventa os números.
 */
import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { getInvestmentCapacity } from "@/features/assistant/lib/investment-capacity";
import { fetchSuggestedCategoryBudgets } from "@/features/budgets/queries";
import { getExpensesByCategory } from "@/shared/lib/financial-analysis/category-breakdown";
import {
	getFinancialSummary,
	getMonthlyCashFlow,
} from "@/shared/lib/financial-analysis/financial-summary";
import { getMerchantSpending } from "@/shared/lib/financial-analysis/merchant-spending";
import {
	buildPeriodWindow,
	getCurrentPeriod,
	isValidPeriodKey,
	parsePeriodRangeKey,
} from "@/shared/utils/period";

const MAX_HISTORY_MONTHS = 24;

const periodSchema = z
	.string()
	.refine(
		isValidPeriodKey,
		"Período inválido — use um mês (YYYY-MM) ou um intervalo (YYYY-MM:YYYY-MM), nunca mais que alguns anos.",
	);

/** Constrói o conjunto de tools do Assistente para um usuário já autenticado. */
export function buildAssistantTools(userId: string) {
	return {
		getFinancialSummary: tool({
			description:
				"Resumo financeiro (receita, despesa, saldo, taxa de poupança) de um mês ou intervalo de meses. Use para perguntas de 'quanto ganhei/gastei/sobrou' e taxa de poupança.",
			inputSchema: z.object({
				period: periodSchema.describe(
					'Mês "YYYY-MM" ou intervalo "YYYY-MM:YYYY-MM".',
				),
			}),
			execute: async ({ period }) => {
				const [start, end] = parsePeriodRangeKeyBounds(period);
				return getFinancialSummary(userId, start, end);
			},
		}),

		getMonthlyCashFlow: tool({
			description:
				"Fluxo de caixa mês a mês dos últimos N meses (receita/despesa/saldo/taxa de poupança por mês). Use para perguntas sobre tendência/evolução ('minha taxa de poupança está melhorando?').",
			inputSchema: z.object({
				months: z
					.number()
					.int()
					.min(1)
					.max(MAX_HISTORY_MONTHS)
					.describe("Quantos meses (incluindo o atual), no máximo 24."),
			}),
			execute: async ({ months }) => {
				const periods = buildPeriodWindow(getCurrentPeriod(), months);
				return getMonthlyCashFlow(userId, periods);
			},
		}),

		getExpensesByCategory: tool({
			description:
				"Quebra completa das despesas por categoria de um único mês, com percentual do total e diferença contra a média dos 3 meses anteriores. Use para 'onde estou gastando mais/mais que deveria'.",
			inputSchema: z.object({
				period: z
					.string()
					.regex(/^\d{4}-\d{2}$/, "Use um único mês no formato YYYY-MM.")
					.describe('Mês único "YYYY-MM".'),
			}),
			execute: async ({ period }) => getExpensesByCategory(userId, period),
		}),

		getMerchantSpending: tool({
			description:
				"Quanto o usuário gastou com um estabelecimento/merchant específico (ex.: Uber, iFood) num mês ou intervalo de meses. Busca por nome parcial (contém), sem diferenciar maiúsculas/acentos rigidamente.",
			inputSchema: z.object({
				query: z
					.string()
					.trim()
					.min(2, "Informe pelo menos 2 caracteres do nome do estabelecimento.")
					.max(80),
				period: periodSchema.describe(
					'Mês "YYYY-MM" ou intervalo "YYYY-MM:YYYY-MM".',
				),
			}),
			execute: async ({ query, period }) => {
				const [start, end] = parsePeriodRangeKeyBounds(period);
				return getMerchantSpending(userId, query, start, end);
			},
		}),

		getSuggestedBudgets: tool({
			description:
				"Metas de orçamento sugeridas por categoria (mediana histórica, meta sugerida, economia potencial) para um mês. Use para 'onde consigo economizar' ou 'quais categorias tenho espaço pra cortar'.",
			inputSchema: z.object({
				period: z
					.string()
					.regex(/^\d{4}-\d{2}$/, "Use um único mês no formato YYYY-MM.")
					.optional()
					.describe("Mês alvo (YYYY-MM). Se omitido, usa o mês atual."),
			}),
			execute: async ({ period }) =>
				fetchSuggestedCategoryBudgets(userId, period ?? getCurrentPeriod()),
		}),

		getInvestmentCapacity: tool({
			description:
				"Quanto o usuário consegue investir por mês sem apertar o orçamento (capacidade conservadora de aporte), com os componentes do cálculo (renda média, despesas essenciais, compromissos recorrentes, provisão de gasto variável, margem de segurança). Use para 'quanto consigo investir', 'quero economizar/investir R$X, onde corto' e similares.",
			inputSchema: z.object({}),
			execute: async () => getInvestmentCapacity(userId),
		}),
	};
}

/** Extrai [início, fim] de uma chave de período (mês único ou intervalo). */
function parsePeriodRangeKeyBounds(period: string): [string, string] {
	const periods = parsePeriodRangeKey(period);
	const start = periods[0] ?? period;
	const end = periods[periods.length - 1] ?? period;
	return [start, end];
}
