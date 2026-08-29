"use client";

import {
	RiAddLine,
	RiArrowLeftLine,
	RiDeleteBinLine,
	RiEditLine,
	RiFundsLine,
	RiLightbulbFlashLine,
	RiRefreshLine,
	RiRobot2Line,
} from "@remixicon/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
	deleteInvestmentAssetAction,
	generateFinancialConsultationAction,
	syncInvestmentMarketDataAction,
} from "@/features/investments/actions";
import { AssetDialog } from "@/features/investments/components/asset-dialog";
import { InvestmentSuggestionsCard } from "@/features/investments/components/investment-suggestions-card";
import { ASSET_CLASS_LABELS } from "@/features/investments/lib/portfolio";
import type { InvestmentsPageData } from "@/features/investments/queries";
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

const COURSE_ACTION_LABELS = {
	reinforce: "Reforçar com aportes",
	hold: "Dentro da banda",
	reduce: "Revisar excedente",
} as const;

export function InvestmentsPage({ data }: { data: InvestmentsPageData }) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const syncMarket = () => {
		startTransition(async () => {
			const result = await syncInvestmentMarketDataAction();
			if (result.success) {
				toast.success(result.message);
				router.refresh();
			} else toast.error(result.error);
		});
	};

	const refreshConsultation = () => {
		startTransition(async () => {
			const result = await generateFinancialConsultationAction({
				period: data.period,
				modelId: data.consultantModel,
			});
			if (result.success) {
				toast.success(result.message);
				router.refresh();
			} else toast.error(result.error);
		});
	};

	const removeAsset = (id: string) => {
		if (!window.confirm("Remover este investimento?")) return;
		startTransition(async () => {
			const result = await deleteInvestmentAssetAction({ id });
			if (result.success) toast.success(result.message);
			else toast.error(result.error);
		});
	};

	return (
		<main className="flex flex-col gap-6">
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h1 className="font-semibold text-2xl">Investimentos</h1>
					<p className="text-muted-foreground text-sm">
						Acompanhe patrimônio, alocação e a construção da sua renda passiva.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button variant="outline" disabled={isPending} onClick={syncMarket}>
						<RiRefreshLine
							className={cn("size-4", isPending && "animate-spin")}
						/>
						Atualizar mercado
					</Button>
					<AssetDialog
						goals={data.goals}
						trigger={
							<Button>
								<RiAddLine className="size-4" />
								Novo investimento
							</Button>
						}
					/>
					<Button asChild variant="outline">
						<Link href="/planning">
							<RiArrowLeftLine className="size-4" />
							Planejamento
						</Link>
					</Button>
				</div>
			</div>

			<Card className="border-primary/20 bg-primary/5">
				<CardHeader>
					<div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
						<div>
							<CardTitle className="flex items-center gap-2">
								<RiRobot2Line className="size-5 text-primary" />
								Consultoria financeira integrada
							</CardTitle>
							<CardDescription>
								Cruza despesas, sobra mensal, dívidas, metas, reserva, carteira
								e fundamentos. Modelo: {data.consultantModel}.
							</CardDescription>
						</div>
						<Button disabled={isPending} onClick={refreshConsultation}>
							<RiRobot2Line className="size-4" />
							{data.consultation ? "Atualizar análise" : "Gerar análise com IA"}
						</Button>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{data.consultation ? (
						<>
							<p className="text-sm leading-relaxed">
								{data.consultation.data.summary}
							</p>
							<div className="grid gap-3 md:grid-cols-2">
								{data.consultation.data.priorities.map((item) => (
									<div
										className="rounded-lg border bg-card p-4"
										key={`${item.title}-${item.horizon}`}
									>
										<p className="font-medium text-sm">{item.title}</p>
										<p className="mt-1 text-muted-foreground text-xs">
											{item.rationale}
										</p>
										<p className="mt-2 text-sm">{item.action}</p>
									</div>
								))}
							</div>
							<div className="grid gap-4 md:grid-cols-3">
								<div>
									<p className="font-medium text-sm">
										Despesas e fluxo de caixa
									</p>
									<ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground text-xs">
										{data.consultation.data.expenseAnalysis.map((item) => (
											<li key={item}>{item}</li>
										))}
									</ul>
								</div>
								<div>
									<p className="font-medium text-sm">
										Leitura dos investimentos
									</p>
									<ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground text-xs">
										{data.consultation.data.investmentAnalysis.map((item) => (
											<li key={item}>{item}</li>
										))}
									</ul>
								</div>
								<div>
									<p className="font-medium text-sm">Próxima revisão mensal</p>
									<ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground text-xs">
										{data.consultation.data.nextMonthlyReview.map((item) => (
											<li key={item}>{item}</li>
										))}
									</ul>
								</div>
							</div>
							{(data.consultation.data.risks.length > 0 ||
								data.consultation.data.dataGaps.length > 0) && (
								<div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
									<p className="font-medium text-sm">
										Riscos e limites da análise
									</p>
									<ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
										{[
											...data.consultation.data.risks,
											...data.consultation.data.dataGaps,
										].map((item) => (
											<li key={item}>{item}</li>
										))}
									</ul>
								</div>
							)}
							<p className="text-muted-foreground text-xs">
								Atualizada em{" "}
								{new Date(data.consultation.updatedAt).toLocaleString("pt-BR")}.{" "}
								{data.consultation.data.disclaimer}
							</p>
						</>
					) : (
						<p className="text-muted-foreground text-sm">
							A análise automática será criada mensalmente quando
							FINANCIAL_CONSULTANT_MODEL e a chave do provider estiverem
							configurados. Você também pode gerar agora.
						</p>
					)}
					{data.consultationHistory.length > 1 && (
						<p className="border-t pt-3 text-muted-foreground text-xs">
							Histórico mensal preservado:{" "}
							{data.consultationHistory.map((item) => item.period).join(" · ")}
						</p>
					)}
				</CardContent>
			</Card>

			<div className="rounded-lg border px-4 py-3 text-sm">
				<p className="font-medium">Dados de mercado · brapi</p>
				<p className="text-muted-foreground text-xs">
					{data.marketFreshness.latestQuoteAt
						? `Última cotação em ${new Date(data.marketFreshness.latestQuoteAt).toLocaleString("pt-BR")}; ${data.marketFreshness.tracked} ativo(s) acompanhado(s).`
						: data.marketFreshness.configured
							? "Aguardando a primeira sincronização automática."
							: "BRAPI_TOKEN não configurado. A atualização manual tentará a faixa pública, sujeita a limites."}
				</p>
				{(data.marketFreshness.partial > 0 ||
					data.marketFreshness.failed > 0) && (
					<p className="mt-1 text-warning text-xs">
						{data.marketFreshness.partial > 0
							? `${data.marketFreshness.partial} ativo(s) sem todos os fundamentos do plano da API. `
							: ""}
						{data.marketFreshness.failed > 0
							? `${data.marketFreshness.failed} ativo(s) com falha na última cotação.`
							: ""}
					</p>
				)}
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<Card>
					<CardContent className="pt-6">
						<p className="text-muted-foreground text-xs">
							Patrimônio investido
						</p>
						<p className="mt-1 font-semibold text-2xl">
							{formatCurrency(data.metrics.totalCurrentValue)}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-muted-foreground text-xs">Resultado acumulado</p>
						<p
							className={cn(
								"mt-1 font-semibold text-2xl",
								data.metrics.gain > 0 && "text-success",
								data.metrics.gain < 0 && "text-destructive",
							)}
						>
							{formatCurrency(data.metrics.gain)}
						</p>
						<p className="text-muted-foreground text-xs">
							{data.metrics.gainPercent === null
								? "Sem custo informado"
								: `${data.metrics.gainPercent.toFixed(2)}% sobre o custo`}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-muted-foreground text-xs">Renda mensal</p>
						<p className="mt-1 font-semibold text-2xl text-success">
							{formatCurrency(data.metrics.monthlyIncome)}
						</p>
						<p className="text-muted-foreground text-xs">
							{formatCurrency(data.metrics.annualIncome)} ao ano
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-muted-foreground text-xs">
							Meta de renda mensal
						</p>
						<p className="mt-1 font-semibold text-2xl">
							{data.metrics.targetMonthlyIncome > 0
								? formatCurrency(data.metrics.targetMonthlyIncome)
								: "Não definida"}
						</p>
						{data.metrics.incomeProgress !== null && (
							<Progress className="mt-2" value={data.metrics.incomeProgress} />
						)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Mapa da carteira das aulas</CardTitle>
					<CardDescription>
						Referência educacional baseada no prazo do objetivo e nas bandas de
						rebalanceamento apresentadas nas quatro transcrições.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					{data.courseMethod.status === "needs_goal" ? (
						<div className="space-y-3">
							<p className="text-sm">
								Cadastre uma meta ativa de investimento ou renda passiva com
								data alvo para calcular o mapa.
							</p>
							<Button asChild size="sm" variant="outline">
								<Link href="/planning">Definir objetivo e prazo</Link>
							</Button>
						</div>
					) : (
						<>
							<div className="grid gap-3 sm:grid-cols-3">
								<div className="rounded-lg border p-3">
									<p className="text-muted-foreground text-xs">
										Objetivo usado
									</p>
									<p className="font-medium text-sm">
										{data.courseMethod.goalName}
									</p>
								</div>
								<div className="rounded-lg border p-3">
									<p className="text-muted-foreground text-xs">Fase</p>
									<p className="font-medium text-sm">
										{data.courseMethod.horizonLabel}
									</p>
								</div>
								<div className="rounded-lg border p-3">
									<p className="text-muted-foreground text-xs">
										Referência de renda fixa
									</p>
									<p className="font-semibold text-lg">
										{data.courseMethod.fixedIncomeTarget}%
									</p>
								</div>
							</div>

							<div className="grid gap-3 md:grid-cols-2">
								{data.courseMethod.classes.map((item) => (
									<div key={item.assetClass} className="rounded-lg border p-4">
										<div className="flex items-start justify-between gap-3">
											<div>
												<p className="font-medium text-sm">{item.label}</p>
												<p className="text-muted-foreground text-xs">
													{item.currentAllocation.toFixed(1)}% atual ·{" "}
													{item.targetAllocation.toFixed(1)}% alvo · banda{" "}
													{item.lowerBand.toFixed(1)}%–
													{item.upperBand.toFixed(1)}%
												</p>
											</div>
											<span
												className={cn(
													"rounded-full px-2 py-1 font-medium text-xs",
													item.action === "hold" &&
														"bg-success/10 text-success",
													item.action === "reinforce" && "bg-info/10 text-info",
													item.action === "reduce" &&
														"bg-warning/10 text-warning",
												)}
											>
												{COURSE_ACTION_LABELS[item.action]}
											</span>
										</div>
										<Progress
											className="mt-3"
											value={Math.min(item.currentAllocation, 100)}
										/>
										{item.contribution > 0 && (
											<p className="mt-2 text-xs">
												Próximo aporte sugerido:{" "}
												{formatCurrency(item.contribution)}
											</p>
										)}
									</div>
								))}
							</div>

							{data.courseMethod.monthlyContribution <= 0 && (
								<p className="text-muted-foreground text-sm">
									Informe o aporte mensal na meta para receber a distribuição do
									próximo aporte.
								</p>
							)}

							{data.courseMethod.alerts.length > 0 && (
								<div className="rounded-lg border border-warning/40 bg-warning/5 p-4">
									<p className="font-medium text-sm">Pontos de atenção</p>
									<ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
										{data.courseMethod.alerts.map((alert) => (
											<li key={alert}>{alert}</li>
										))}
									</ul>
								</div>
							)}
						</>
					)}

					<div className="grid gap-3 border-t pt-4 md:grid-cols-2">
						<div className="rounded-lg border p-4">
							<p className="font-medium text-sm">Filtro inicial de ações</p>
							<ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground text-xs">
								<li>P/L entre 5 e 20 e EV/EBIT entre 4 e 20.</li>
								<li>
									Rentabilidade positiva, liquidez saudável e dívida controlada.
								</li>
								<li>
									Crescimento de receita positivo; 5% ao ano é a régua inicial
									mostrada.
								</li>
								<li>
									Dividend yield é complementar e não deve eliminar sozinho uma
									empresa que reinveste bem.
								</li>
							</ul>
						</div>
						<div className="rounded-lg border p-4">
							<p className="font-medium text-sm">Filtro inicial de FIIs</p>
							<ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground text-xs">
								<li>
									Dividend yield acima de 8% como triagem, não como garantia.
								</li>
								<li>
									P/VP de até 1,01 e, nos fundos de tijolo, baixa vacância.
								</li>
								<li>
									Mais de 10 imóveis ou operações, com diversificação geográfica
									e liquidez suficiente.
								</li>
								<li>
									Revisar fundamentos e relatórios ao menos a cada três a seis
									meses.
								</li>
							</ul>
						</div>
					</div>

					<div>
						<ul className="space-y-1 text-muted-foreground text-xs">
							{data.courseMethod.methodNotes.map((note) => (
								<li key={note}>{note}</li>
							))}
						</ul>
					</div>
				</CardContent>
			</Card>

			<InvestmentSuggestionsCard
				suggestions={data.suggestions}
				freshness={data.suggestionsFreshness}
				goals={data.goals}
			/>

			<div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
				<Card>
					<CardHeader>
						<CardTitle>Alocação por classe</CardTitle>
						<CardDescription>
							Compare a participação atual com o objetivo definido.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{data.metrics.classes.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								A alocação aparecerá quando você cadastrar os ativos.
							</p>
						) : (
							data.metrics.classes.map((item) => (
								<div key={item.assetClass} className="space-y-2">
									<div className="flex items-center justify-between gap-3 text-sm">
										<span className="font-medium">{item.label}</span>
										<span className="text-muted-foreground">
											{item.allocation.toFixed(1)}% atual ·{" "}
											{item.targetAllocation.toFixed(1)}% alvo
										</span>
									</div>
									<Progress value={Math.min(item.allocation, 100)} />
									<p
										className={cn(
											"text-xs",
											Math.abs(item.gap) <= 2 ? "text-success" : "text-warning",
										)}
									>
										{Math.abs(item.gap) <= 2
											? "Dentro do alvo"
											: `${Math.abs(item.gap).toFixed(1)} p.p. ${item.gap > 0 ? "acima" : "abaixo"} do alvo`}
									</p>
								</div>
							))
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<RiLightbulbFlashLine className="size-5 text-primary" />
							Leitura da carteira
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-3">
							{data.metrics.recommendations.map((recommendation) => (
								<li key={recommendation} className="text-sm">
									{recommendation}
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			</div>

			<section className="flex flex-col gap-3">
				<div className="flex items-center gap-2">
					<RiFundsLine className="size-5 text-primary" />
					<h2 className="font-semibold text-lg">Posições da carteira</h2>
				</div>
				{data.assets.length === 0 ? (
					<Card>
						<CardContent className="py-10 text-center text-muted-foreground text-sm">
							Cadastre seu primeiro investimento para começar o acompanhamento.
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						{data.assets.map((asset) => (
							<Card key={asset.id}>
								<CardHeader>
									<div className="flex items-start justify-between gap-3">
										<div>
											<CardTitle>{asset.name}</CardTitle>
											<CardDescription>
												{asset.ticker ? `${asset.ticker} · ` : ""}
												{ASSET_CLASS_LABELS[asset.assetClass] ??
													asset.assetClass}
											</CardDescription>
										</div>
										<div className="flex">
											<AssetDialog
												asset={asset}
												goals={data.goals}
												trigger={
													<Button
														variant="ghost"
														size="icon-sm"
														aria-label="Editar investimento"
													>
														<RiEditLine className="size-4" />
													</Button>
												}
											/>
											<Button
												variant="ghost"
												size="icon-sm"
												disabled={isPending}
												onClick={() => removeAsset(asset.id)}
												aria-label="Remover investimento"
											>
												<RiDeleteBinLine className="size-4 text-destructive" />
											</Button>
										</div>
									</div>
								</CardHeader>
								<CardContent className="grid grid-cols-2 gap-3 text-sm">
									<div>
										<p className="text-muted-foreground text-xs">Valor atual</p>
										<p className="font-semibold">
											{formatCurrency(asset.currentValue)}
										</p>
									</div>
									{asset.screening && (
										<div className="col-span-2 rounded-lg border p-3">
											<p className="font-medium text-xs">
												Triagem fundamental:{" "}
												{asset.screening.status === "approved"
													? "aprovado na triagem"
													: asset.screening.status === "attention"
														? "pontos de atenção"
														: "dados insuficientes"}
											</p>
											<div className="mt-2 flex flex-wrap gap-1.5">
												{asset.screening.metrics.map((metric) => (
													<span
														className={cn(
															"rounded-full border px-2 py-1 text-[11px]",
															metric.status === "pass" &&
																"border-success/30 bg-success/10 text-success",
															metric.status === "attention" &&
																"border-warning/30 bg-warning/10 text-warning",
															metric.status === "unavailable" &&
																"text-muted-foreground",
														)}
														key={metric.label}
														title={`Critério: ${metric.criterion}`}
													>
														{metric.label}: {metric.formatted}
													</span>
												))}
											</div>
											{asset.market?.fundamentalsUpdatedAt && (
												<p className="mt-2 text-muted-foreground text-[11px]">
													Fundamentos verificados em{" "}
													{new Date(
														asset.market.fundamentalsUpdatedAt,
													).toLocaleDateString("pt-BR")}
												</p>
											)}
										</div>
									)}
									<div>
										<p className="text-muted-foreground text-xs">Na carteira</p>
										<p className="font-semibold">
											{asset.allocation.toFixed(1)}%
										</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Resultado</p>
										<p
											className={cn(
												"font-semibold",
												asset.gain > 0 && "text-success",
												asset.gain < 0 && "text-destructive",
											)}
										>
											{formatCurrency(asset.gain)}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">
											Renda mensal
										</p>
										<p className="font-semibold text-success">
											{formatCurrency(asset.monthlyIncome)}
										</p>
									</div>
									{(asset.institution || asset.goalName) && (
										<p className="col-span-2 text-muted-foreground text-xs">
											{asset.institution ?? "Sem instituição"}
											{asset.goalName ? ` · Meta: ${asset.goalName}` : ""}
										</p>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</section>
		</main>
	);
}
