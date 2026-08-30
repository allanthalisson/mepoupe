/**
 * Sugestão automática de metas de orçamento por categoria.
 *
 * Cálculo 100% determinístico — a IA nunca decide o valor da meta, só
 * explica o resultado (ver `features/insights`/assistente). Usa a mediana
 * dos últimos meses completos como referência (baseline), porque meses
 * atípicos (viagem, imposto anual, compra grande) distorcem muito menos a
 * mediana do que a média.
 */

export type CategoryConfidence = "low" | "medium" | "high";

export type CategoryClassification =
	| "essencial"
	| "recorrente"
	| "flexivel"
	| "discricionaria";

export type CategoryTrend = "increasing" | "decreasing" | "stable";

export type CategoryMonthlySpending = {
	/** Período no formato "YYYY-MM". */
	period: string;
	/** Total gasto na categoria naquele mês (valor positivo). */
	amount: number;
	/** Parte de `amount` que veio de lançamentos com condição "Recorrente". */
	recurringAmount?: number;
	/** Parte de `amount` que veio de lançamentos com condição "Parcelado". */
	installmentAmount?: number;
};

export type CategoryBudgetInput = {
	categoryId: string;
	categoryName: string;
	/**
	 * Histórico em ordem crescente de período, cobrindo só os meses
	 * completos considerados (recomendado: até os últimos 6). Não inclua o
	 * mês em curso aqui — ele é informado separadamente em
	 * `currentMonthSpent` porque está sempre parcial.
	 */
	history: CategoryMonthlySpending[];
	/** Gasto parcial do mês em curso nessa categoria, se houver. */
	currentMonthSpent?: number | null;
};

export type SuggestedCategoryBudget = {
	categoryId: string;
	categoryName: string;
	monthsOfHistory: number;
	historicalMedian: number;
	historicalAverage: number;
	historicalMin: number;
	historicalMax: number;
	currentMonthSpent: number | null;
	trend: CategoryTrend;
	classification: CategoryClassification;
	suggestedBudget: number;
	suggestedReductionPercent: number;
	potentialMonthlySavings: number;
	potentialAnnualSavings: number;
	confidence: CategoryConfidence;
	/** Sempre gerado pelo código — a IA só reformula em linguagem natural. */
	reason: string;
};

const MAX_REDUCTION_PERCENT = 20;
/** Abaixo disso o desvio é tratado como ruído, não como "acima do padrão". */
const STABLE_DEVIATION_THRESHOLD = 5;
/** Acima disso o desvio já é considerado "claramente acima do padrão". */
const HIGH_DEVIATION_THRESHOLD = 15;

const round2 = (value: number) => Math.round(value * 100) / 100;

function median(values: number[]): number {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0
		? (sorted[mid - 1] + sorted[mid]) / 2
		: sorted[mid];
}

function mean(values: number[]): number {
	if (values.length === 0) return 0;
	return values.reduce((total, value) => total + value, 0) / values.length;
}

function coefficientOfVariation(values: number[], average: number): number {
	if (average <= 0 || values.length === 0) return 0;
	const variance =
		values.reduce((total, value) => total + (value - average) ** 2, 0) /
		values.length;
	return Math.sqrt(variance) / average;
}

function classify(
	recurringShare: number,
	variationCoefficient: number,
): CategoryClassification {
	if (recurringShare >= 0.6) return "recorrente";
	if (variationCoefficient <= 0.15) return "essencial";
	if (variationCoefficient >= 0.4) return "discricionaria";
	return "flexivel";
}

function resolveConfidence(monthsOfHistory: number): CategoryConfidence {
	if (monthsOfHistory <= 1) return "low";
	if (monthsOfHistory <= 3) return "medium";
	return "high";
}

function resolveReductionPercent(
	classification: CategoryClassification,
	deviationPercent: number,
): number {
	if (classification === "essencial" || classification === "recorrente") {
		return 0;
	}
	if (deviationPercent <= STABLE_DEVIATION_THRESHOLD) {
		return 0;
	}
	const isFlexivel = classification === "flexivel";
	const percent =
		deviationPercent <= HIGH_DEVIATION_THRESHOLD
			? isFlexivel
				? 7
				: 10
			: isFlexivel
				? 10
				: 15;
	return Math.min(percent, MAX_REDUCTION_PERCENT);
}

function buildReason(input: {
	classification: CategoryClassification;
	reductionPercent: number;
	monthsAboveMedian: number;
	monthsOfHistory: number;
	deviationPercent: number;
}): string {
	const {
		classification,
		reductionPercent,
		monthsAboveMedian,
		monthsOfHistory,
		deviationPercent,
	} = input;

	if (reductionPercent === 0) {
		if (classification === "essencial") {
			return "Categoria essencial: a meta acompanha seu padrão histórico, sem corte.";
		}
		if (classification === "recorrente") {
			return "Categoria recorrente (assinaturas/parcelas): a meta acompanha o valor já comprometido.";
		}
		return "A categoria está estável, então não há necessidade de reduzir agressivamente.";
	}

	const parts: string[] = [];
	if (monthsAboveMedian > monthsOfHistory / 2) {
		parts.push(
			`Essa categoria ficou acima da mediana em ${monthsAboveMedian} dos últimos ${monthsOfHistory} meses.`,
		);
	}
	if (deviationPercent > 0) {
		parts.push(
			`O gasto mais recente está ${Math.round(deviationPercent)}% acima do padrão dos últimos meses.`,
		);
	}
	if (parts.length === 0) {
		parts.push(
			"Há espaço para reduzir o gasto sem comprometer o padrão histórico.",
		);
	}
	return parts.join(" ");
}

/**
 * Calcula, para cada categoria, uma meta de orçamento sugerida a partir do
 * histórico de gastos. Não decide nada sozinho — só organiza os budgets
 * existentes (ver `features/budgets`) com um valor de partida defensável.
 */
export function buildSuggestedCategoryBudgets(
	inputs: CategoryBudgetInput[],
): SuggestedCategoryBudget[] {
	const suggestions = inputs
		.filter((input) => input.history.length > 0)
		.map((input): SuggestedCategoryBudget => {
			const history = [...input.history].sort((a, b) =>
				a.period < b.period ? -1 : a.period > b.period ? 1 : 0,
			);
			const amounts = history.map((entry) => entry.amount);
			const monthsOfHistory = amounts.length;

			const historicalMedian = round2(median(amounts));
			const historicalAverage = round2(mean(amounts));
			const historicalMin = round2(Math.min(...amounts));
			const historicalMax = round2(Math.max(...amounts));

			const committedTotal = history.reduce(
				(total, entry) =>
					total + (entry.recurringAmount ?? 0) + (entry.installmentAmount ?? 0),
				0,
			);
			const spentTotal = amounts.reduce((total, value) => total + value, 0);
			const recurringShare = spentTotal > 0 ? committedTotal / spentTotal : 0;
			const variationCoefficient = coefficientOfVariation(
				amounts,
				historicalAverage,
			);
			const classification = classify(recurringShare, variationCoefficient);

			const recentAmount = amounts[amounts.length - 1];
			const deviationPercent =
				historicalMedian > 0
					? ((recentAmount - historicalMedian) / historicalMedian) * 100
					: 0;
			const trend: CategoryTrend =
				deviationPercent > STABLE_DEVIATION_THRESHOLD
					? "increasing"
					: deviationPercent < -STABLE_DEVIATION_THRESHOLD
						? "decreasing"
						: "stable";

			const reductionPercent = resolveReductionPercent(
				classification,
				deviationPercent,
			);
			const suggestedBudget = round2(
				historicalMedian * (1 - reductionPercent / 100),
			);
			const potentialMonthlySavings = round2(
				historicalMedian - suggestedBudget,
			);
			const potentialAnnualSavings = round2(potentialMonthlySavings * 12);

			const monthsAboveMedian = amounts.filter(
				(value) => value > historicalMedian,
			).length;

			return {
				categoryId: input.categoryId,
				categoryName: input.categoryName,
				monthsOfHistory,
				historicalMedian,
				historicalAverage,
				historicalMin,
				historicalMax,
				currentMonthSpent: input.currentMonthSpent ?? null,
				trend,
				classification,
				suggestedBudget,
				suggestedReductionPercent: reductionPercent,
				potentialMonthlySavings,
				potentialAnnualSavings,
				confidence: resolveConfidence(monthsOfHistory),
				reason: buildReason({
					classification,
					reductionPercent,
					monthsAboveMedian,
					monthsOfHistory,
					deviationPercent,
				}),
			};
		});

	suggestions.sort(
		(a, b) => b.potentialMonthlySavings - a.potentialMonthlySavings,
	);

	const TOP_SAVERS_HIGHLIGHTED = 3;
	suggestions.slice(0, TOP_SAVERS_HIGHLIGHTED).forEach((suggestion) => {
		if (suggestion.potentialMonthlySavings > 0) {
			suggestion.reason +=
				" Essa é uma das categorias com maior potencial de economia.";
		}
	});

	return suggestions;
}
