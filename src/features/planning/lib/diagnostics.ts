export type DiagnosticTransaction = {
	name: string;
	period: string;
	amount: number;
	transactionType: string;
	condition: string;
	categoryName: string | null;
};

export type MonthlyCashFlow = {
	period: string;
	income: number;
	expenses: number;
	balance: number;
	savingsRate: number | null;
};

export type ReviewOpportunity = {
	name: string;
	categoryName: string | null;
	currentAmount: number;
	previousAverage: number;
	increasePercentage: number | null;
	occurrences: number;
	potentialSavings: number;
	reason: "increase" | "frequency" | "high-impact";
};

export type CategoryOpportunity = {
	categoryName: string;
	currentAmount: number;
	previousAverage: number;
	increasePercentage: number | null;
	shareOfCurrentExpenses: number;
	potentialSavings: number;
	reason: "increase" | "high-share";
};

export type FinancialDiagnosis = {
	monthlyCashFlow: MonthlyCashFlow[];
	averageIncome: number;
	averageExpenses: number;
	averageSavings: number;
	averageSavingsRate: number | null;
	currentSavingsRate: number | null;
	monthlyCommitments: number;
	reviewOpportunities: ReviewOpportunity[];
	categoryOpportunities: CategoryOpportunity[];
	potentialMonthlySavings: number;
	suggestions: string[];
	status: "critical" | "attention" | "building" | "healthy";
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;
const roundPercentage = (value: number) => Math.round(value * 10) / 10;

const savingsRate = (income: number, expenses: number) =>
	income > 0 ? roundPercentage(((income - expenses) / income) * 100) : null;

function resolveStatus(rate: number | null, averageSavings: number) {
	if (averageSavings < 0 || (rate !== null && rate < 0)) return "critical";
	if (rate === null || rate < 10) return "attention";
	if (rate < 20) return "building";
	return "healthy";
}

export function buildFinancialDiagnosis(
	transactions: DiagnosticTransaction[],
	periods: string[],
): FinancialDiagnosis {
	const flowByPeriod = new Map(
		periods.map((period) => [period, { income: 0, expenses: 0 }]),
	);
	const expensesByMerchant = new Map<
		string,
		{
			name: string;
			categoryName: string | null;
			byPeriod: Map<string, number>;
			occurrences: number;
		}
	>();
	const expensesByCategory = new Map<string, Map<string, number>>();

	let commitmentsTotal = 0;
	for (const transaction of transactions) {
		const flow = flowByPeriod.get(transaction.period);
		if (!flow) continue;

		if (transaction.transactionType === "Receita") {
			flow.income += Math.abs(transaction.amount);
			continue;
		}
		if (transaction.transactionType !== "Despesa") continue;

		const amount = Math.abs(transaction.amount);
		flow.expenses += amount;
		if (["Recorrente", "Parcelado"].includes(transaction.condition)) {
			commitmentsTotal += amount;
		}

		const key = transaction.name.trim().toLocaleLowerCase("pt-BR");
		const categoryKey = transaction.categoryName?.trim() || "Sem categoria";
		const categoryPeriods =
			expensesByCategory.get(categoryKey) ?? new Map<string, number>();
		categoryPeriods.set(
			transaction.period,
			(categoryPeriods.get(transaction.period) ?? 0) + amount,
		);
		expensesByCategory.set(categoryKey, categoryPeriods);
		const merchant = expensesByMerchant.get(key) ?? {
			name: transaction.name.trim(),
			categoryName: transaction.categoryName,
			byPeriod: new Map<string, number>(),
			occurrences: 0,
		};
		merchant.byPeriod.set(
			transaction.period,
			(merchant.byPeriod.get(transaction.period) ?? 0) + amount,
		);
		merchant.occurrences++;
		expensesByMerchant.set(key, merchant);
	}

	const monthlyCashFlow = periods.map((period) => {
		const flow = flowByPeriod.get(period) ?? { income: 0, expenses: 0 };
		return {
			period,
			income: roundMoney(flow.income),
			expenses: roundMoney(flow.expenses),
			balance: roundMoney(flow.income - flow.expenses),
			savingsRate: savingsRate(flow.income, flow.expenses),
		};
	});

	const divisor = Math.max(periods.length, 1);
	const averageIncome = roundMoney(
		monthlyCashFlow.reduce((total, flow) => total + flow.income, 0) / divisor,
	);
	const averageExpenses = roundMoney(
		monthlyCashFlow.reduce((total, flow) => total + flow.expenses, 0) / divisor,
	);
	const averageSavings = roundMoney(averageIncome - averageExpenses);
	const averageSavingsRate = savingsRate(averageIncome, averageExpenses);
	const currentPeriod = periods.at(-1) ?? "";
	const current = monthlyCashFlow.at(-1);
	const previousPeriods = periods.slice(0, -1);

	const reviewOpportunities = Array.from(expensesByMerchant.values())
		.map((merchant): ReviewOpportunity | null => {
			const currentAmount = merchant.byPeriod.get(currentPeriod) ?? 0;
			const previousAverage =
				previousPeriods.length > 0
					? previousPeriods.reduce(
							(total, period) => total + (merchant.byPeriod.get(period) ?? 0),
							0,
						) / previousPeriods.length
					: 0;
			const increasePercentage =
				previousAverage > 0
					? roundPercentage(
							((currentAmount - previousAverage) / previousAverage) * 100,
						)
					: null;
			const isIncrease =
				previousAverage > 0 &&
				currentAmount >= previousAverage * 1.5 &&
				currentAmount - previousAverage >= 50;
			const isFrequent = merchant.occurrences >= Math.max(periods.length, 3);
			const isHighImpact = currentAmount >= averageExpenses * 0.1;
			if (!isIncrease && !isFrequent && !isHighImpact) return null;

			return {
				name: merchant.name,
				categoryName: merchant.categoryName,
				currentAmount: roundMoney(currentAmount),
				previousAverage: roundMoney(previousAverage),
				increasePercentage,
				occurrences: merchant.occurrences,
				potentialSavings: roundMoney(
					isIncrease
						? Math.max(currentAmount - previousAverage, 0)
						: currentAmount * 0.1,
				),
				reason: isIncrease
					? "increase"
					: isFrequent
						? "frequency"
						: "high-impact",
			};
		})
		.filter((item): item is ReviewOpportunity => item !== null)
		.sort((a, b) => {
			const impactA = a.currentAmount - a.previousAverage;
			const impactB = b.currentAmount - b.previousAverage;
			return impactB - impactA || b.currentAmount - a.currentAmount;
		})
		.slice(0, 8);

	const currentExpenses = current?.expenses ?? 0;
	const categoryOpportunities = Array.from(expensesByCategory.entries())
		.map(([categoryName, byPeriod]): CategoryOpportunity | null => {
			const currentAmount = byPeriod.get(currentPeriod) ?? 0;
			const previousAverage =
				previousPeriods.length > 0
					? previousPeriods.reduce(
							(total, period) => total + (byPeriod.get(period) ?? 0),
							0,
						) / previousPeriods.length
					: 0;
			const increasePercentage =
				previousAverage > 0
					? roundPercentage(
							((currentAmount - previousAverage) / previousAverage) * 100,
						)
					: null;
			const shareOfCurrentExpenses =
				currentExpenses > 0
					? roundPercentage((currentAmount / currentExpenses) * 100)
					: 0;
			const isIncrease =
				previousAverage > 0 &&
				currentAmount >= previousAverage * 1.2 &&
				currentAmount - previousAverage >= 50;
			const isHighShare = shareOfCurrentExpenses >= 15;
			if (!isIncrease && !isHighShare) return null;

			return {
				categoryName,
				currentAmount: roundMoney(currentAmount),
				previousAverage: roundMoney(previousAverage),
				increasePercentage,
				shareOfCurrentExpenses,
				potentialSavings: roundMoney(
					isIncrease
						? Math.max(currentAmount - previousAverage, 0)
						: currentAmount * 0.1,
				),
				reason: isIncrease ? "increase" : "high-share",
			};
		})
		.filter((item): item is CategoryOpportunity => item !== null)
		.sort((a, b) => b.potentialSavings - a.potentialSavings)
		.slice(0, 6);
	const potentialMonthlySavings = roundMoney(
		(categoryOpportunities.length > 0
			? categoryOpportunities
			: reviewOpportunities
		).reduce((total, item) => total + item.potentialSavings, 0),
	);

	const monthlyCommitments = roundMoney(commitmentsTotal / divisor);
	const status = resolveStatus(averageSavingsRate, averageSavings);
	const suggestions: string[] = [];
	if (averageSavings < 0) {
		suggestions.push(
			"As despesas médias superam as receitas. Priorize estabilizar o fluxo de caixa antes de aumentar aportes.",
		);
	} else if ((averageSavingsRate ?? 0) < 10) {
		suggestions.push(
			"Sua margem de poupança está abaixo de 10%. Revise primeiro os gastos recorrentes e de maior impacto.",
		);
	} else if ((averageSavingsRate ?? 0) < 20) {
		suggestions.push(
			"Você já gera sobra mensal. Tente elevar gradualmente a taxa de poupança para 20%.",
		);
	} else {
		suggestions.push(
			"Sua taxa média de poupança está saudável. Direcione a sobra de acordo com a prioridade das metas.",
		);
	}
	if (monthlyCommitments > averageIncome * 0.3) {
		suggestions.push(
			"Parcelas e despesas recorrentes comprometem mais de 30% da renda média. Evite assumir novos compromissos.",
		);
	}
	if (reviewOpportunities.some((item) => item.reason === "increase")) {
		suggestions.push(
			"Há estabelecimentos com gastos muito acima do seu padrão recente. Confira as oportunidades de revisão abaixo.",
		);
	}

	return {
		monthlyCashFlow,
		averageIncome,
		averageExpenses,
		averageSavings,
		averageSavingsRate,
		currentSavingsRate: current?.savingsRate ?? null,
		monthlyCommitments,
		reviewOpportunities,
		categoryOpportunities,
		potentialMonthlySavings,
		suggestions,
		status,
	};
}
