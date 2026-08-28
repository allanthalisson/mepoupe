export type ScreeningMetric = {
	label: string;
	value: number | null;
	formatted: string;
	status: "pass" | "attention" | "unavailable";
	criterion: string;
};

export type FundamentalSnapshot = {
	priceToEarnings: number | null;
	priceToBook: number | null;
	enterpriseToEbit: number | null;
	dividendYield: number | null;
	returnOnEquity: number | null;
	currentRatio: number | null;
	debtToEquity: number | null;
	revenueGrowth: number | null;
	profitMargin: number | null;
	vacancyRate: number | null;
	propertyCount: number | null;
	dailyLiquidity: number | null;
};

function percent(value: number | null) {
	if (value === null) return "Sem dado";
	const normalized = Math.abs(value) <= 1 ? value * 100 : value;
	return `${normalized.toFixed(1)}%`;
}

function percentValue(value: number | null) {
	if (value === null) return null;
	return Math.abs(value) <= 1 ? value * 100 : value;
}

function metric(
	label: string,
	value: number | null,
	formatted: string,
	criterion: string,
	passes: (value: number) => boolean,
): ScreeningMetric {
	return {
		label,
		value,
		formatted,
		criterion,
		status:
			value === null ? "unavailable" : passes(value) ? "pass" : "attention",
	};
}

export function screenFundamentals(
	assetClass: string,
	snapshot: FundamentalSnapshot | null,
) {
	if (!snapshot || !["stocks", "reits"].includes(assetClass)) return null;
	const metrics =
		assetClass === "stocks"
			? [
					metric(
						"P/L",
						snapshot.priceToEarnings,
						snapshot.priceToEarnings?.toFixed(2) ?? "Sem dado",
						"entre 5 e 20",
						(v) => v >= 5 && v <= 20,
					),
					metric(
						"EV/EBIT",
						snapshot.enterpriseToEbit,
						snapshot.enterpriseToEbit?.toFixed(2) ?? "Sem dado",
						"entre 4 e 20",
						(v) => v >= 4 && v <= 20,
					),
					metric(
						"ROE",
						percentValue(snapshot.returnOnEquity),
						percent(snapshot.returnOnEquity),
						"positivo",
						(v) => v > 0,
					),
					metric(
						"Crescimento da receita",
						percentValue(snapshot.revenueGrowth),
						percent(snapshot.revenueGrowth),
						"ao menos 5%",
						(v) => v >= 5,
					),
					metric(
						"Margem de lucro",
						percentValue(snapshot.profitMargin),
						percent(snapshot.profitMargin),
						"positiva",
						(v) => v > 0,
					),
					metric(
						"Liquidez corrente",
						snapshot.currentRatio,
						snapshot.currentRatio?.toFixed(2) ?? "Sem dado",
						"acima de 1",
						(v) => v >= 1,
					),
					metric(
						"Dívida/patrimônio",
						snapshot.debtToEquity,
						snapshot.debtToEquity?.toFixed(2) ?? "Sem dado",
						"abaixo de 100",
						(v) => v < 100,
					),
				]
			: [
					metric(
						"Dividend yield",
						percentValue(snapshot.dividendYield),
						percent(snapshot.dividendYield),
						"acima de 8%",
						(v) => v >= 8,
					),
					metric(
						"P/VP",
						snapshot.priceToBook,
						snapshot.priceToBook?.toFixed(2) ?? "Sem dado",
						"até 1,01",
						(v) => v <= 1.01,
					),
					metric(
						"Vacância",
						percentValue(snapshot.vacancyRate),
						percent(snapshot.vacancyRate),
						"baixa (até 10%)",
						(v) => v <= 10,
					),
					metric(
						"Imóveis/operações",
						snapshot.propertyCount,
						snapshot.propertyCount?.toString() ?? "Sem dado",
						"mais de 10",
						(v) => v > 10,
					),
					metric(
						"Liquidez",
						snapshot.dailyLiquidity,
						snapshot.dailyLiquidity?.toLocaleString("pt-BR") ?? "Sem dado",
						"volume positivo",
						(v) => v > 0,
					),
				];
	const available = metrics.filter((item) => item.status !== "unavailable");
	const passed = metrics.filter((item) => item.status === "pass").length;
	const coverage = available.length / metrics.length;
	return {
		metrics,
		passed,
		available: available.length,
		coverage,
		status:
			coverage < 0.5
				? ("insufficient" as const)
				: passed / available.length >= 0.7
					? ("approved" as const)
					: ("attention" as const),
	};
}
