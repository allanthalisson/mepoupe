export type AllocationDebt = {
	id: string;
	name: string;
	currentBalance: number;
	annualInterestRate: number;
	minimumPayment: number;
	plannedPayment: number;
	status: string;
};

export type AllocationGoal = {
	id: string;
	name: string;
	goalType: string;
	monthlyContribution: number;
	priority: number;
	status: string;
};

export type AllocationItem = {
	id: string;
	name: string;
	kind: "debt-minimum" | "debt-extra" | "emergency" | "goal" | "investment";
	requested: number;
	funded: number;
	shortfall: number;
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export function buildMonthlyAllocationPlan({
	monthlyCapacity,
	debts,
	goals,
}: {
	monthlyCapacity: number;
	debts: AllocationDebt[];
	goals: AllocationGoal[];
}) {
	const capacity = roundMoney(Math.max(monthlyCapacity, 0));
	const activeDebts = debts
		.filter((debt) => debt.status === "active" && debt.currentBalance > 0)
		.sort(
			(a, b) =>
				b.annualInterestRate - a.annualInterestRate ||
				b.currentBalance - a.currentBalance,
		);
	const activeGoals = goals
		.filter((goal) => goal.status === "active" && goal.monthlyContribution > 0)
		.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
	const items: AllocationItem[] = [];
	let remaining = capacity;

	const minimumTotal = activeDebts.reduce(
		(total, debt) => total + Math.max(debt.minimumPayment, 0),
		0,
	);
	for (const debt of activeDebts) {
		const requested = roundMoney(Math.max(debt.minimumPayment, 0));
		if (requested <= 0) continue;
		const funded =
			minimumTotal > remaining && minimumTotal > 0
				? roundMoney((remaining * requested) / minimumTotal)
				: requested;
		items.push({
			id: `${debt.id}-minimum`,
			name: `Mínimo — ${debt.name}`,
			kind: "debt-minimum",
			requested,
			funded,
			shortfall: roundMoney(Math.max(requested - funded, 0)),
		});
	}
	remaining = roundMoney(
		Math.max(remaining - Math.min(minimumTotal, remaining), 0),
	);

	for (const debt of activeDebts) {
		const requested = roundMoney(
			Math.max(debt.plannedPayment - debt.minimumPayment, 0),
		);
		if (requested <= 0) continue;
		const funded = roundMoney(Math.min(requested, remaining));
		items.push({
			id: `${debt.id}-extra`,
			name: `Aceleração — ${debt.name}`,
			kind: "debt-extra",
			requested,
			funded,
			shortfall: roundMoney(requested - funded),
		});
		remaining = roundMoney(remaining - funded);
	}

	const orderedGoals = [
		...activeGoals.filter((goal) => goal.goalType === "emergency_reserve"),
		...activeGoals.filter(
			(goal) =>
				!["emergency_reserve", "investment", "passive_income"].includes(
					goal.goalType,
				),
		),
		...activeGoals.filter((goal) =>
			["investment", "passive_income"].includes(goal.goalType),
		),
	];
	for (const goal of orderedGoals) {
		const requested = roundMoney(goal.monthlyContribution);
		const funded = roundMoney(Math.min(requested, remaining));
		const kind =
			goal.goalType === "emergency_reserve"
				? "emergency"
				: ["investment", "passive_income"].includes(goal.goalType)
					? "investment"
					: "goal";
		items.push({
			id: goal.id,
			name: goal.name,
			kind,
			requested,
			funded,
			shortfall: roundMoney(requested - funded),
		});
		remaining = roundMoney(remaining - funded);
	}

	const allocated = roundMoney(capacity - remaining);
	const totalShortfall = roundMoney(
		items.reduce((total, item) => total + item.shortfall, 0),
	);
	const highestInterestDebt = activeDebts[0];
	const emergencyGoal = activeGoals.find(
		(goal) => goal.goalType === "emergency_reserve",
	);
	const nextBestUse =
		monthlyCapacity <= 0
			? "Estabilize o fluxo de caixa antes de assumir novos aportes."
			: totalShortfall > 0
				? "Os planos atuais superam sua sobra média. Reduza ou reprograme os aportes com menor prioridade."
				: remaining > 0 && highestInterestDebt
					? `Direcione a sobra de ${remaining.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} para antecipar ${highestInterestDebt.name}, a dívida de maior taxa.`
					: remaining > 0 && emergencyGoal
						? `Use a sobra de ${remaining.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} para acelerar ${emergencyGoal.name}.`
						: remaining > 0
							? `Há ${remaining.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} livres para uma reserva ou investimento alinhado aos seus objetivos.`
							: "Sua sobra média está totalmente direcionada. Acompanhe o plano mensalmente.";

	return {
		monthlyCapacity: capacity,
		allocated,
		unallocated: remaining,
		totalShortfall,
		coveragePercentage:
			items.length === 0
				? 100
				: roundMoney(
						(items.reduce((total, item) => total + item.funded, 0) /
							items.reduce((total, item) => total + item.requested, 0)) *
							100,
					),
		items,
		nextBestUse,
	};
}
