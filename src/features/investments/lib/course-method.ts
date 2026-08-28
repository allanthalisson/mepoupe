export const COURSE_BAND_PERCENTAGE_POINTS = 5;

export const COURSE_CLASS_LABELS = {
	fixed_income: "Renda fixa",
	reits: "Fundos imobiliários",
	stocks: "Ações brasileiras",
	international: "Exterior",
} as const;

export type CourseAssetClass = keyof typeof COURSE_CLASS_LABELS;
export type CourseHorizon =
	| "foundation"
	| "construction"
	| "transition"
	| "harvest";

export type CourseMethodAsset = {
	name: string;
	assetClass: string;
	currentValue: number;
};

export type CourseMethodGoal = {
	name: string;
	targetDate: Date | string;
	monthlyContribution: number;
};

export type CourseClassMap = {
	assetClass: CourseAssetClass;
	label: string;
	currentValue: number;
	currentAllocation: number;
	targetAllocation: number;
	lowerBand: number;
	upperBand: number;
	gap: number;
	action: "reinforce" | "hold" | "reduce";
	contribution: number;
};

export type CoursePortfolioMap = {
	status: "ready" | "needs_goal";
	goalName: string | null;
	targetDate: string | null;
	yearsToGoal: number | null;
	horizon: CourseHorizon | null;
	horizonLabel: string | null;
	fixedIncomeTarget: number | null;
	monthlyContribution: number;
	totalCurrentValue: number;
	classes: CourseClassMap[];
	alerts: string[];
	methodNotes: string[];
};

const HORIZON_LABELS: Record<CourseHorizon, string> = {
	foundation: "Fundação (15 anos ou mais)",
	construction: "Construção (de 8 a menos de 15 anos)",
	transition: "Transição (de 3 a 7 anos)",
	harvest: "Colheita (até 3 anos ou vivendo de renda)",
};

function round(value: number, precision = 2) {
	const factor = 10 ** precision;
	return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function getCourseHorizon(yearsToGoal: number): {
	horizon: CourseHorizon;
	fixedIncomeTarget: number;
} {
	if (yearsToGoal <= 3) {
		return { horizon: "harvest", fixedIncomeTarget: 60 };
	}
	if (yearsToGoal < 8) {
		return { horizon: "transition", fixedIncomeTarget: 45 };
	}
	if (yearsToGoal < 15) {
		return { horizon: "construction", fixedIncomeTarget: 30 };
	}
	return { horizon: "foundation", fixedIncomeTarget: 20 };
}

function yearsBetween(targetDate: Date | string, asOf: Date) {
	const target = new Date(targetDate);
	if (Number.isNaN(target.getTime())) return 0;
	return Math.max(
		0,
		(target.getTime() - asOf.getTime()) / (365.2425 * 24 * 60 * 60 * 1000),
	);
}

function buildTargets(fixedIncomeTarget: number) {
	const variableTarget = (100 - fixedIncomeTarget) / 3;
	return {
		fixed_income: fixedIncomeTarget,
		reits: variableTarget,
		stocks: variableTarget,
		international: variableTarget,
	} satisfies Record<CourseAssetClass, number>;
}

function buildContributionPlan(
	classes: Omit<CourseClassMap, "contribution">[],
	monthlyContribution: number,
) {
	const positiveGaps = classes.map((item) => ({
		assetClass: item.assetClass,
		weight: Math.max(item.targetAllocation - item.currentAllocation, 0),
	}));
	const totalWeight = positiveGaps.reduce(
		(total, item) => total + item.weight,
		0,
	);
	return new Map(
		positiveGaps.map((item) => [
			item.assetClass,
			totalWeight > 0
				? round((monthlyContribution * item.weight) / totalWeight)
				: 0,
		]),
	);
}

export function buildCoursePortfolioMap(
	assets: CourseMethodAsset[],
	goal: CourseMethodGoal | null,
	asOf = new Date(),
): CoursePortfolioMap {
	const totalCurrentValue = assets.reduce(
		(total, asset) => total + Math.max(asset.currentValue, 0),
		0,
	);
	const base = {
		totalCurrentValue,
		classes: [],
		alerts: [],
		methodNotes: [
			"A reserva de emergência é tratada separadamente e deve cobrir pelo menos seis meses do custo de vida.",
			"As bandas são de ±5 pontos percentuais; primeiro, tente corrigir os desvios com novos aportes.",
			"A análise é educacional: qualidade, liquidez, impostos e adequação pessoal devem ser verificados antes de qualquer operação.",
		],
	} satisfies Pick<
		CoursePortfolioMap,
		"totalCurrentValue" | "classes" | "alerts" | "methodNotes"
	>;

	if (!goal) {
		return {
			status: "needs_goal",
			goalName: null,
			targetDate: null,
			yearsToGoal: null,
			horizon: null,
			horizonLabel: null,
			fixedIncomeTarget: null,
			monthlyContribution: 0,
			...base,
		};
	}

	const yearsToGoal = yearsBetween(goal.targetDate, asOf);
	const { horizon, fixedIncomeTarget } = getCourseHorizon(yearsToGoal);
	const targets = buildTargets(fixedIncomeTarget);
	const values = new Map<CourseAssetClass, number>(
		(Object.keys(COURSE_CLASS_LABELS) as CourseAssetClass[]).map((key) => [
			key,
			0,
		]),
	);

	for (const asset of assets) {
		if (asset.assetClass in COURSE_CLASS_LABELS) {
			const key = asset.assetClass as CourseAssetClass;
			values.set(key, (values.get(key) ?? 0) + Math.max(asset.currentValue, 0));
		}
	}

	const classesWithoutContribution = (
		Object.keys(COURSE_CLASS_LABELS) as CourseAssetClass[]
	).map((assetClass) => {
		const currentValue = values.get(assetClass) ?? 0;
		const currentAllocation =
			totalCurrentValue > 0 ? (currentValue / totalCurrentValue) * 100 : 0;
		const targetAllocation = targets[assetClass];
		const gap = currentAllocation - targetAllocation;
		return {
			assetClass,
			label: COURSE_CLASS_LABELS[assetClass],
			currentValue,
			currentAllocation,
			targetAllocation,
			lowerBand: Math.max(targetAllocation - COURSE_BAND_PERCENTAGE_POINTS, 0),
			upperBand: Math.min(
				targetAllocation + COURSE_BAND_PERCENTAGE_POINTS,
				100,
			),
			gap,
			action:
				gap < -COURSE_BAND_PERCENTAGE_POINTS
					? ("reinforce" as const)
					: gap > COURSE_BAND_PERCENTAGE_POINTS
						? ("reduce" as const)
						: ("hold" as const),
		};
	});
	const contributionPlan = buildContributionPlan(
		classesWithoutContribution,
		Math.max(goal.monthlyContribution, 0),
	);
	const classes = classesWithoutContribution.map((item) => ({
		...item,
		contribution: contributionPlan.get(item.assetClass) ?? 0,
	}));
	const alerts: string[] = [];
	const stockCount = assets.filter(
		(asset) => asset.assetClass === "stocks",
	).length;
	const reitCount = assets.filter(
		(asset) => asset.assetClass === "reits",
	).length;
	const cryptoValue = assets
		.filter((asset) => asset.assetClass === "crypto")
		.reduce((total, asset) => total + Math.max(asset.currentValue, 0), 0);
	const unclassifiedValue = assets
		.filter((asset) => !(asset.assetClass in COURSE_CLASS_LABELS))
		.reduce((total, asset) => total + Math.max(asset.currentValue, 0), 0);

	for (const asset of assets) {
		const allocation =
			totalCurrentValue > 0
				? (asset.currentValue / totalCurrentValue) * 100
				: 0;
		if (allocation > 10) {
			alerts.push(
				`${asset.name} representa ${allocation.toFixed(1)}% da carteira, acima do limite máximo de 10% citado nas aulas.`,
			);
		} else if (allocation > 5) {
			alerts.push(
				`${asset.name} representa ${allocation.toFixed(1)}% da carteira; 5% é a referência de concentração ideal das aulas.`,
			);
		}
	}
	if (stockCount > 0 && stockCount < 17) {
		alerts.push(
			`Há ${stockCount} ${stockCount === 1 ? "ação brasileira" : "ações brasileiras"}; as aulas usam 17 a 20 como faixa de diversificação madura.`,
		);
	}
	if (reitCount > 0 && reitCount < 10) {
		alerts.push(
			`Há ${reitCount} ${reitCount === 1 ? "fundo imobiliário" : "fundos imobiliários"}; as aulas indicam 10 a 12 durante a construção e 15 como referência madura.`,
		);
	}
	if (totalCurrentValue > 0 && (cryptoValue / totalCurrentValue) * 100 > 3) {
		alerts.push(
			"Criptoativos superam 3% da carteira, teto de cautela sugerido nas aulas para quem ainda está formando convicção.",
		);
	}
	if (unclassifiedValue > 0) {
		alerts.push(
			`${round((unclassifiedValue / totalCurrentValue) * 100, 1)}% da carteira está fora das quatro classes centrais do método. Classifique ETFs com exposição internacional como “Exterior”.`,
		);
	}

	return {
		status: "ready",
		goalName: goal.name,
		targetDate: new Date(goal.targetDate).toISOString(),
		yearsToGoal: round(yearsToGoal, 1),
		horizon,
		horizonLabel: HORIZON_LABELS[horizon],
		fixedIncomeTarget,
		monthlyContribution: Math.max(goal.monthlyContribution, 0),
		...base,
		classes,
		alerts,
	};
}
