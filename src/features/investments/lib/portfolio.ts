export const ASSET_CLASS_LABELS: Record<string, string> = {
	fixed_income: "Renda fixa",
	stocks: "Ações",
	reits: "Fundos imobiliários",
	international: "Exterior (ações ou ETFs)",
	etfs: "ETFs",
	crypto: "Criptoativos",
	retirement: "Previdência",
	cash: "Caixa",
	other: "Outros",
};

export type PortfolioAssetInput = {
	assetClass: string;
	quantity: number;
	averagePrice: number;
	currentPrice: number;
	monthlyIncome: number;
	targetAllocation: number;
};

export type PortfolioClass = {
	assetClass: string;
	label: string;
	currentValue: number;
	allocation: number;
	targetAllocation: number;
	gap: number;
};

export function buildPortfolioMetrics(
	assets: PortfolioAssetInput[],
	targetMonthlyIncome = 0,
) {
	const totalCurrentValue = assets.reduce(
		(total, asset) => total + asset.quantity * asset.currentPrice,
		0,
	);
	const totalCost = assets.reduce(
		(total, asset) => total + asset.quantity * asset.averagePrice,
		0,
	);
	const monthlyIncome = assets.reduce(
		(total, asset) => total + asset.monthlyIncome,
		0,
	);
	const byClass = new Map<
		string,
		{ currentValue: number; targetAllocation: number }
	>();

	for (const asset of assets) {
		const current = byClass.get(asset.assetClass) ?? {
			currentValue: 0,
			targetAllocation: 0,
		};
		current.currentValue += asset.quantity * asset.currentPrice;
		current.targetAllocation += asset.targetAllocation;
		byClass.set(asset.assetClass, current);
	}

	const classes: PortfolioClass[] = Array.from(byClass.entries())
		.map(([assetClass, value]) => {
			const allocation =
				totalCurrentValue > 0
					? (value.currentValue / totalCurrentValue) * 100
					: 0;
			return {
				assetClass,
				label: ASSET_CLASS_LABELS[assetClass] ?? assetClass,
				currentValue: value.currentValue,
				allocation,
				targetAllocation: value.targetAllocation,
				gap: allocation - value.targetAllocation,
			};
		})
		.sort((a, b) => b.currentValue - a.currentValue);

	const totalTargetAllocation = classes.reduce(
		(total, item) => total + item.targetAllocation,
		0,
	);
	const gain = totalCurrentValue - totalCost;
	const incomeProgress =
		targetMonthlyIncome > 0
			? Math.min((monthlyIncome / targetMonthlyIncome) * 100, 100)
			: null;
	const recommendations: string[] = [];

	if (assets.length === 0) {
		recommendations.push(
			"Cadastre seus investimentos para visualizar patrimônio e alocação.",
		);
	} else {
		if (Math.abs(totalTargetAllocation - 100) > 0.1) {
			recommendations.push(
				`As alocações-alvo somam ${totalTargetAllocation.toFixed(1)}%. Ajuste-as para 100%.`,
			);
		}
		const concentrated = classes.find((item) => item.allocation > 70);
		if (concentrated) {
			recommendations.push(
				`${concentrated.label} concentra ${concentrated.allocation.toFixed(1)}% da carteira. Revise se isso está de acordo com sua estratégia.`,
			);
		}
		if (targetMonthlyIncome > 0 && monthlyIncome < targetMonthlyIncome) {
			recommendations.push(
				`Faltam ${(targetMonthlyIncome - monthlyIncome).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} por mês para sua meta de renda passiva.`,
			);
		}
		if (recommendations.length === 0) {
			recommendations.push(
				"A carteira está alinhada às metas cadastradas. Revise preços e renda mensal periodicamente.",
			);
		}
	}

	return {
		totalCurrentValue,
		totalCost,
		gain,
		gainPercent: totalCost > 0 ? (gain / totalCost) * 100 : null,
		monthlyIncome,
		annualIncome: monthlyIncome * 12,
		targetMonthlyIncome,
		incomeProgress,
		totalTargetAllocation,
		classes,
		recommendations,
	};
}
