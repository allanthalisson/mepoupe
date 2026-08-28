"use client";

import {
	RiAddLine,
	RiArrowRightLine,
	RiDeleteBinLine,
	RiEditLine,
	RiFundsLine,
	RiLightbulbFlashLine,
	RiTargetLine,
} from "@remixicon/react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import {
	deleteDebtAction,
	deleteGoalAction,
} from "@/features/planning/actions";
import { DebtDialog } from "@/features/planning/components/debt-dialog";
import {
	GOAL_TYPE_LABELS,
	GoalDialog,
} from "@/features/planning/components/goal-dialog";
import type { PlanningPageData } from "@/features/planning/queries";
import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { formatCurrency } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/ui";

const STATUS_LABELS = {
	critical: { label: "Fluxo crítico", className: "text-destructive" },
	attention: { label: "Precisa de atenção", className: "text-warning" },
	building: { label: "Em construção", className: "text-primary" },
	healthy: { label: "Saudável", className: "text-success" },
} as const;

const opportunityReason = {
	increase: "Aumento fora do padrão",
	frequency: "Compra frequente",
	"high-impact": "Alto impacto no mês",
} as const;

const categoryReason = {
	increase: "Aumento acima do histórico",
	"high-share": "Participação elevada nas despesas",
} as const;

const allocationKindLabel = {
	"debt-minimum": "Pagamento mínimo",
	"debt-extra": "Aceleração de dívida",
	emergency: "Reserva de emergência",
	goal: "Meta",
	investment: "Investimento",
} as const;

export function PlanningPage({ data }: { data: PlanningPageData }) {
	const [isPending, startTransition] = useTransition();
	const status = STATUS_LABELS[data.diagnosis.status];

	const removeGoal = (id: string) => {
		if (!window.confirm("Remover esta meta?")) return;
		startTransition(async () => {
			const result = await deleteGoalAction({ id });
			if (result.success) toast.success(result.message);
			else toast.error(result.error);
		});
	};

	const removeDebt = (id: string) => {
		if (!window.confirm("Remover esta dívida do planejamento?")) return;
		startTransition(async () => {
			const result = await deleteDebtAction({ id });
			if (result.success) toast.success(result.message);
			else toast.error(result.error);
		});
	};

	return (
		<main className="flex flex-col gap-6">
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h1 className="font-semibold text-2xl">Planejamento financeiro</h1>
					<p className="text-muted-foreground text-sm">
						Transforme seu histórico em decisões, prioridades e metas mensais.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<GoalDialog
						accounts={data.accounts}
						trigger={
							<Button>
								<RiAddLine className="size-4" />
								Nova meta
							</Button>
						}
					/>
					<DebtDialog
						trigger={
							<Button variant="outline">
								<RiAddLine className="size-4" />
								Adicionar dívida
							</Button>
						}
					/>
					<Button asChild variant="outline">
						<Link href="/investments">
							<RiFundsLine className="size-4" />
							Investimentos
						</Link>
					</Button>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{[
					["Receita média", data.diagnosis.averageIncome],
					["Despesa média", data.diagnosis.averageExpenses],
					["Sobra média", data.diagnosis.averageSavings],
					["Dívidas em aberto", data.summary.totalDebt],
				].map(([label, value]) => (
					<Card key={String(label)}>
						<CardContent className="pt-6">
							<p className="text-muted-foreground text-xs">{label}</p>
							<p className="mt-1 font-semibold text-2xl">
								{formatCurrency(Number(value))}
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between gap-3">
							<div>
								<CardTitle>Diagnóstico dos últimos 6 meses</CardTitle>
								<CardDescription>
									Baseado nas receitas e despesas confirmadas do período.
								</CardDescription>
							</div>
							<span className={cn("font-medium text-sm", status.className)}>
								{status.label}
							</span>
						</div>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						<div>
							<p className="text-muted-foreground text-xs">
								Taxa média de poupança
							</p>
							<p className="font-semibold text-xl">
								{data.diagnosis.averageSavingsRate === null
									? "—"
									: `${data.diagnosis.averageSavingsRate}%`}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground text-xs">
								Compromissos mensais
							</p>
							<p className="font-semibold text-xl">
								{formatCurrency(data.diagnosis.monthlyCommitments)}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground text-xs">
								Valor ainda não direcionado
							</p>
							<p className="font-semibold text-xl text-success">
								{formatCurrency(data.summary.unallocatedMonthlyAmount)}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground text-xs">
								Economia potencial para revisar
							</p>
							<p className="font-semibold text-xl text-success">
								{formatCurrency(data.diagnosis.potentialMonthlySavings)}
							</p>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<RiLightbulbFlashLine className="size-5 text-primary" />
							Próximas decisões
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-3">
							{data.diagnosis.suggestions.map((suggestion) => (
								<li key={suggestion} className="flex gap-2 text-sm">
									<RiArrowRightLine className="mt-0.5 size-4 shrink-0 text-primary" />
									<span>{suggestion}</span>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			</div>

			<section className="flex flex-col gap-3">
				<div>
					<h2 className="font-semibold text-lg">
						Distribuição recomendada da sobra
					</h2>
					<p className="text-muted-foreground text-sm">
						O plano protege pagamentos mínimos, prioriza dívidas caras e só
						depois direciona recursos para reserva, objetivos e investimentos.
					</p>
				</div>
				<div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
					<Card>
						<CardHeader>
							<CardTitle>Plano mensal</CardTitle>
							<CardDescription>
								{formatCurrency(data.allocationPlan.allocated)} de{" "}
								{formatCurrency(data.allocationPlan.monthlyCapacity)}{" "}
								direcionados
							</CardDescription>
						</CardHeader>
						<CardContent>
							{data.allocationPlan.items.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									Cadastre dívidas e metas com valores mensais para montar a
									distribuição.
								</p>
							) : (
								<div className="divide-y">
									{data.allocationPlan.items.map((item) => {
										const coverage =
											item.requested > 0
												? (item.funded / item.requested) * 100
												: 100;
										return (
											<div key={item.id} className="space-y-2 py-3">
												<div className="flex items-center justify-between gap-3 text-sm">
													<div>
														<p className="font-medium">{item.name}</p>
														<p className="text-muted-foreground text-xs">
															{allocationKindLabel[item.kind]}
														</p>
													</div>
													<div className="text-right">
														<p className="font-medium">
															{formatCurrency(item.funded)}
														</p>
														<p className="text-muted-foreground text-xs">
															de {formatCurrency(item.requested)}
														</p>
													</div>
												</div>
												<Progress value={Math.min(coverage, 100)} />
												{item.shortfall > 0 && (
													<p className="text-warning text-xs">
														Faltam {formatCurrency(item.shortfall)} para cobrir
														o valor planejado.
													</p>
												)}
											</div>
										);
									})}
								</div>
							)}
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Próximo melhor uso</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm">{data.allocationPlan.nextBestUse}</p>
							<div className="grid grid-cols-2 gap-3 text-sm">
								<div>
									<p className="text-muted-foreground text-xs">Ainda livre</p>
									<p className="font-semibold text-success">
										{formatCurrency(data.allocationPlan.unallocated)}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">
										Déficit do plano
									</p>
									<p
										className={cn(
											"font-semibold",
											data.allocationPlan.totalShortfall > 0 && "text-warning",
										)}
									>
										{formatCurrency(data.allocationPlan.totalShortfall)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>

			<section className="flex flex-col gap-3">
				<div className="flex items-center gap-2">
					<RiTargetLine className="size-5 text-primary" />
					<h2 className="font-semibold text-lg">Metas e objetivos</h2>
				</div>
				{data.goals.length === 0 ? (
					<Card>
						<CardContent className="py-10 text-center text-muted-foreground text-sm">
							Crie uma meta para dar destino concreto à sua economia mensal.
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						{data.goals.map((goal) => (
							<Card key={goal.id}>
								<CardHeader>
									<div className="flex items-start justify-between gap-3">
										<div>
											<CardTitle>{goal.name}</CardTitle>
											<CardDescription>
												{GOAL_TYPE_LABELS[goal.goalType] ??
													"Objetivo financeiro"}
											</CardDescription>
										</div>
										<div className="flex">
											<GoalDialog
												goal={goal}
												accounts={data.accounts}
												trigger={
													<Button
														variant="ghost"
														size="icon-sm"
														aria-label="Editar meta"
													>
														<RiEditLine className="size-4" />
													</Button>
												}
											/>
											<Button
												variant="ghost"
												size="icon-sm"
												disabled={isPending}
												onClick={() => removeGoal(goal.id)}
												aria-label="Remover meta"
											>
												<RiDeleteBinLine className="size-4 text-destructive" />
											</Button>
										</div>
									</div>
								</CardHeader>
								<CardContent className="space-y-3">
									<Progress value={goal.progress} />
									<div className="flex justify-between text-sm">
										<span>{formatCurrency(goal.currentAmount)}</span>
										<span className="text-muted-foreground">
											de {formatCurrency(goal.targetAmount)}
										</span>
									</div>
									<div className="grid grid-cols-2 gap-2 text-xs">
										<div>
											<p className="text-muted-foreground">Aporte mensal</p>
											<p className="font-medium">
												{formatCurrency(goal.monthlyContribution)}
											</p>
										</div>
										<div>
											<p className="text-muted-foreground">Previsão</p>
											<p
												className={cn(
													"font-medium",
													goal.isOnTrack === false && "text-warning",
												)}
											>
												{goal.estimatedMonths === null
													? "Sem aporte definido"
													: `${goal.estimatedMonths} meses`}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</section>

			<section className="flex flex-col gap-3">
				<div>
					<h2 className="font-semibold text-lg">
						Plano de quitação de dívidas
					</h2>
					<p className="text-muted-foreground text-sm">
						Ordem sugerida pelo método avalanche: priorize a maior taxa de juros
						e mantenha os pagamentos mínimos das demais.
					</p>
				</div>
				{data.debts.length === 0 ? (
					<Card>
						<CardContent className="py-8 text-center text-muted-foreground text-sm">
							Nenhuma dívida cadastrada.
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-3">
						{data.debts.map((debt, index) => (
							<Card key={debt.id}>
								<CardContent className="flex flex-col justify-between gap-4 pt-6 md:flex-row md:items-center">
									<div className="flex items-center gap-3">
										<span className="flex size-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm">
											{index + 1}
										</span>
										<div>
											<p className="font-medium">{debt.name}</p>
											<p className="text-muted-foreground text-xs">
												{debt.creditor || "Credor não informado"} ·{" "}
												{debt.annualInterestRate}% a.a.
											</p>
										</div>
									</div>
									<div className="grid grid-cols-2 gap-6 text-sm md:grid-cols-3">
										<div>
											<p className="text-muted-foreground text-xs">Saldo</p>
											<p className="font-medium">
												{formatCurrency(debt.currentBalance)}
											</p>
										</div>
										<div>
											<p className="text-muted-foreground text-xs">Pagamento</p>
											<p className="font-medium">
												{formatCurrency(debt.plannedPayment)}
											</p>
										</div>
										<div>
											<p className="text-muted-foreground text-xs">
												Prazo estimado
											</p>
											<p className="font-medium">
												{debt.estimatedMonths !== null
													? `${debt.estimatedMonths} meses`
													: debt.paymentCoversInterest
														? "—"
														: "Pagamento insuficiente"}
											</p>
											{debt.estimatedInterest !== null &&
												debt.estimatedInterest > 0 && (
													<p className="text-muted-foreground text-xs">
														{formatCurrency(debt.estimatedInterest)} em juros
														estimados
													</p>
												)}
										</div>
									</div>
									<div className="flex">
										<DebtDialog
											debt={debt}
											trigger={
												<Button variant="ghost" size="icon-sm">
													<RiEditLine className="size-4" />
												</Button>
											}
										/>
										<Button
											variant="ghost"
											size="icon-sm"
											disabled={isPending}
											onClick={() => removeDebt(debt.id)}
										>
											<RiDeleteBinLine className="size-4 text-destructive" />
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</section>

			<section className="flex flex-col gap-3">
				<div>
					<h2 className="font-semibold text-lg">Oportunidades de economia</h2>
					<p className="text-muted-foreground text-sm">
						São candidatos à revisão baseados no seu histórico; a decisão sobre
						o que é necessário continua sendo sua.
					</p>
				</div>
				<Card>
					<CardContent className="pt-6">
						{data.diagnosis.categoryOpportunities.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								Ainda não há histórico suficiente para estimar economia por
								categoria.
							</p>
						) : (
							<div className="divide-y">
								{data.diagnosis.categoryOpportunities.map((item) => (
									<div
										key={item.categoryName}
										className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center"
									>
										<div>
											<p className="font-medium text-sm">{item.categoryName}</p>
											<p className="text-muted-foreground text-xs">
												{categoryReason[item.reason]} ·{" "}
												{item.shareOfCurrentExpenses}% das despesas do mês
											</p>
										</div>
										<div className="text-right">
											<p className="font-medium">
												Até {formatCurrency(item.potentialSavings)}
											</p>
											<p className="text-muted-foreground text-xs">
												para revisar neste mês
											</p>
											{item.increasePercentage !== null && (
												<p className="text-warning text-xs">
													{item.increasePercentage > 0 ? "+" : ""}
													{item.increasePercentage}% vs. média
												</p>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
				{data.diagnosis.reviewOpportunities.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle>Estabelecimentos para conferir</CardTitle>
							<CardDescription>
								Aumentos, frequência e compras de alto impacto.
							</CardDescription>
						</CardHeader>
						<CardContent className="divide-y">
							{data.diagnosis.reviewOpportunities.map((item) => (
								<div
									key={`${item.name}-${item.reason}`}
									className="flex items-center justify-between gap-3 py-3 text-sm"
								>
									<div>
										<p className="font-medium">{item.name}</p>
										<p className="text-muted-foreground text-xs">
											{item.categoryName || "Sem categoria"} ·{" "}
											{opportunityReason[item.reason]}
										</p>
									</div>
									<div className="text-right">
										<p className="font-medium">
											{formatCurrency(item.currentAmount)}
										</p>
										<p className="text-success text-xs">
											Revisão estimada: {formatCurrency(item.potentialSavings)}
										</p>
									</div>
								</div>
							))}
						</CardContent>
					</Card>
				)}
			</section>
		</main>
	);
}
