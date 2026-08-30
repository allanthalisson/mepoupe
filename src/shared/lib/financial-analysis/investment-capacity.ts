/**
 * "Quanto consigo investir por mês sem apertar meu orçamento?" — uma
 * fórmula simples e transparente, não um modelo sofisticado:
 *
 *   renda média
 *   - despesas essenciais médias
 *   - compromissos recorrentes médios
 *   - provisão de despesas variáveis/discricionárias
 *   - margem de segurança
 *   = capacidade conservadora de aporte
 *
 * O resultado sempre expõe os componentes usados, pra dar pra explicar de
 * onde veio o número (nunca só "você pode investir R$X").
 */

export type CategoryForCapacity = {
	classification: "essencial" | "recorrente" | "flexivel" | "discricionaria";
	historicalAverage: number;
};

export type InvestmentCapacityComponents = {
	averageIncome: number;
	essentialExpenses: number;
	recurringCommitments: number;
	variableExpenseProvision: number;
	safetyMargin: number;
};

export type InvestmentCapacityResult = {
	components: InvestmentCapacityComponents;
	conservativeCapacity: number;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Fração do gasto médio de categorias flexíveis/discricionárias que entra
 * na provisão (não é 100%: parte desse gasto é justamente o que dá pra
 * cortar, então provisionar tudo subestimaria a capacidade de aporte).
 */
const VARIABLE_PROVISION_RATIO = 0.7;
/** Margem de segurança como fração da renda média. */
const SAFETY_MARGIN_RATIO = 0.05;

export function buildInvestmentCapacity(
	averageIncome: number,
	categories: CategoryForCapacity[],
): InvestmentCapacityResult {
	let essentialExpenses = 0;
	let recurringCommitments = 0;
	let variableExpenseProvision = 0;

	for (const category of categories) {
		if (category.classification === "essencial") {
			essentialExpenses += category.historicalAverage;
		} else if (category.classification === "recorrente") {
			recurringCommitments += category.historicalAverage;
		} else {
			variableExpenseProvision +=
				category.historicalAverage * VARIABLE_PROVISION_RATIO;
		}
	}

	const safeAverageIncome = Math.max(averageIncome, 0);
	const safetyMargin = round2(safeAverageIncome * SAFETY_MARGIN_RATIO);
	const conservativeCapacity = round2(
		Math.max(
			safeAverageIncome -
				essentialExpenses -
				recurringCommitments -
				variableExpenseProvision -
				safetyMargin,
			0,
		),
	);

	return {
		components: {
			averageIncome: round2(safeAverageIncome),
			essentialExpenses: round2(essentialExpenses),
			recurringCommitments: round2(recurringCommitments),
			variableExpenseProvision: round2(variableExpenseProvision),
			safetyMargin,
		},
		conservativeCapacity,
	};
}
