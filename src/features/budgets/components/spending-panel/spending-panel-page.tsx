"use client";

import { RiRefreshLine, RiRepeatLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createBudgetAction } from "@/features/budgets/actions";
import type { SuggestedCategoryBudget } from "@/features/budgets/lib/suggested-budgets";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Slider } from "@/shared/components/ui/slider";
import type { GoalPlan } from "@/shared/lib/financial-analysis/goal-plan";
import type { InvestmentCapacityResult } from "@/shared/lib/financial-analysis/investment-capacity";
import type { RecurringMerchantsSummary } from "@/shared/lib/financial-analysis/recurring-merchants";
import { formatCurrency } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/ui";

interface SpendingPanelPageProps {
	period: string;
	categories: SuggestedCategoryBudget[];
	recurring: RecurringMerchantsSummary;
	goalPlan: GoalPlan | null;
	capacity: InvestmentCapacityResult;
}

const suggestedCap = (category: SuggestedCategoryBudget) =>
	Math.round(category.suggestedBudget);

const maxCap = (category: SuggestedCategoryBudget) => {
	const base = Math.max(category.historicalMax, category.suggestedBudget, 50);
	return Math.ceil((base * 1.3) / 10) * 10;
};

export function SpendingPanelPage({
	period,
	categories,
	recurring,
	goalPlan,
	capacity,
}: SpendingPanelPageProps) {
	const [caps, setCaps] = useState<Record<string, number>>(() =>
		Object.fromEntries(
			categories.map((category) => [
				category.categoryId,
				suggestedCap(category),
			]),
		),
	);
	const [isApplying, startApplyTransition] = useTransition();
	const router = useRouter();

	const totalSavings = useMemo(() => {
		return categories.reduce((total, category) => {
			const cap = caps[category.categoryId] ?? suggestedCap(category);
			const diff = category.historicalMedian - cap;
			return total + Math.max(diff, 0);
		}, 0);
	}, [categories, caps]);

	const handleReset = () => {
		setCaps(
			Object.fromEntries(
				categories.map((category) => [
					category.categoryId,
					suggestedCap(category),
				]),
			),
		);
	};

	const handleApplyAll = () => {
		startApplyTransition(async () => {
			let applied = 0;
			for (const category of categories) {
				const cap = caps[category.categoryId] ?? suggestedCap(category);
				const result = await createBudgetAction({
					categoryId: category.categoryId,
					period,
					amount: cap.toFixed(2),
				});
				if (result.success) applied += 1;
			}
			if (applied > 0) {
				toast.success(
					`${applied} teto${applied > 1 ? "s" : ""} aplicado${applied > 1 ? "s" : ""} em Orçamentos.`,
				);
				router.refresh();
			} else {
				toast.error("Não foi possível aplicar os tetos.");
			}
		});
	};

	const goalLine = goalPlan
		? goalPlan.gap > 0
			? `Isso cobre ${formatCurrency(Math.min(totalSavings, goalPlan.gap))} dos ${formatCurrency(goalPlan.gap)} que ainda faltam por mês para "${goalPlan.goalName}".`
			: `Sua capacidade atual já cobre a meta "${goalPlan.goalName}" — essa economia é sobra extra.`
		: `Isso pode elevar sua capacidade de investir para aproximadamente ${formatCurrency(capacity.conservativeCapacity + totalSavings)}/mês.`;

	return (
		<div className="flex flex-col gap-6">
			<Card className="border-primary/30 border-l-4">
				<CardContent className="space-y-4 pt-6">
					<div>
						<p className="font-bold text-4xl text-primary tracking-tight">
							{formatCurrency(totalSavings)}
						</p>
						<p className="text-muted-foreground text-sm">
							de economia mensal ajustando os tetos abaixo
						</p>
					</div>
					<p className="text-sm leading-relaxed">{goalLine}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
					<div>
						<CardTitle>
							Onde o dinheiro foi, e quanto você quer gastar
						</CardTitle>
						<CardDescription>
							A barra clara é o que você gasta hoje (mediana dos últimos meses);
							o traço é o teto. Arraste para calibrar.
						</CardDescription>
					</div>
					<div className="flex gap-2">
						<Button
							disabled={isApplying}
							onClick={handleReset}
							size="sm"
							type="button"
							variant="outline"
						>
							<RiRefreshLine className="size-4" />
							Voltar aos tetos sugeridos
						</Button>
						<Button disabled={isApplying} onClick={handleApplyAll} size="sm">
							{isApplying ? "Aplicando..." : "Aplicar tetos em Orçamentos"}
						</Button>
					</div>
				</CardHeader>
				<CardContent className="space-y-5">
					{categories.map((category) => {
						const cap = caps[category.categoryId] ?? suggestedCap(category);
						const max = maxCap(category);
						const spendPercent = Math.min(
							(category.historicalMedian / max) * 100,
							100,
						);
						const capPercent = Math.min((cap / max) * 100, 100);
						const diff = category.historicalMedian - cap;

						return (
							<div className="space-y-2" key={category.categoryId}>
								<div className="flex flex-wrap items-baseline justify-between gap-2">
									<div>
										<span className="font-medium text-sm">
											{category.categoryName}
										</span>
										<Badge className="ml-2" variant="outline">
											{category.classification}
										</Badge>
									</div>
									<span className="text-muted-foreground text-xs">
										gasta hoje{" "}
										<b className="text-foreground">
											{formatCurrency(category.historicalMedian)}
										</b>
										/mês
									</span>
								</div>

								<div className="relative h-3 overflow-visible rounded-full bg-muted">
									<div
										className={cn(
											"absolute inset-y-0 left-0 rounded-full",
											category.historicalMedian > cap
												? "bg-destructive/40"
												: "bg-success/40",
										)}
										style={{ width: `${spendPercent}%` }}
									/>
									<div
										className="absolute inset-y-[-4px] w-0.5 bg-foreground"
										style={{ left: `${capPercent}%` }}
									/>
								</div>

								<div className="flex flex-wrap items-center gap-3">
									<Slider
										className="max-w-md"
										max={max}
										min={0}
										onValueChange={([value]) =>
											setCaps((prev) => ({
												...prev,
												[category.categoryId]: value ?? cap,
											}))
										}
										step={5}
										value={[cap]}
									/>
									<span className="w-20 text-right font-semibold text-sm">
										{formatCurrency(cap)}
									</span>
									<span
										className={cn(
											"w-24 text-right text-xs",
											diff > 1
												? "text-destructive"
												: diff < -1
													? "text-success"
													: "text-muted-foreground",
										)}
									>
										{diff > 1
											? `corta ${formatCurrency(diff)}`
											: diff < -1
												? `folga ${formatCurrency(-diff)}`
												: "no ponto"}
									</span>
								</div>
							</div>
						);
					})}
					{categories.length === 0 && (
						<p className="text-muted-foreground text-sm">
							Ainda não há histórico suficiente para sugerir tetos por
							categoria.
						</p>
					)}
				</CardContent>
			</Card>

			{recurring.recurringMerchants.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<RiRepeatLine className="size-4 text-primary" />
							Compras recorrentes
						</CardTitle>
						<CardDescription>
							Estabelecimentos que aparecem em duas ou mais compras no período.
						</CardDescription>
					</CardHeader>
					<CardContent className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b text-left text-muted-foreground text-xs">
									<th className="py-2 font-medium">Estabelecimento</th>
									<th className="py-2 text-right font-medium">Vezes</th>
									<th className="py-2 text-right font-medium">Total</th>
									<th className="py-2 text-right font-medium">Média</th>
									<th className="py-2 text-right font-medium">Sugestão</th>
								</tr>
							</thead>
							<tbody>
								{recurring.recurringMerchants.map((merchant) => (
									<tr
										className="border-b last:border-0"
										key={merchant.merchantKey}
									>
										<td className="py-2">{merchant.displayName}</td>
										<td className="py-2 text-right">{merchant.occurrences}</td>
										<td className="py-2 text-right">
											{formatCurrency(merchant.totalAmount)}
										</td>
										<td className="py-2 text-right">
											{formatCurrency(merchant.averageAmount)}
										</td>
										<td className="py-2 text-right">
											<Badge
												variant={
													merchant.suggestion === "revisar"
														? "destructive"
														: "outline"
												}
											>
												{merchant.suggestion === "revisar" ? "Revisar" : "Ok"}
											</Badge>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</CardContent>
				</Card>
			)}

			{recurring.subscriptions.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Assinaturas ativas</CardTitle>
						<CardDescription>
							Cobranças marcadas como recorrentes nos seus lançamentos.
						</CardDescription>
					</CardHeader>
					<CardContent className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b text-left text-muted-foreground text-xs">
									<th className="py-2 font-medium">Serviço</th>
									<th className="py-2 text-right font-medium">Por mês</th>
								</tr>
							</thead>
							<tbody>
								{recurring.subscriptions.map((subscription) => (
									<tr
										className="border-b last:border-0"
										key={subscription.merchantKey}
									>
										<td className="py-2">{subscription.displayName}</td>
										<td className="py-2 text-right">
											{formatCurrency(subscription.averageAmount)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
