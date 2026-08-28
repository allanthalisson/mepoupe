"use client";

import {
	RiAddLine,
	RiArrowLeftLine,
	RiDeleteBinLine,
	RiEditLine,
	RiFundsLine,
	RiLightbulbFlashLine,
} from "@remixicon/react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteInvestmentAssetAction } from "@/features/investments/actions";
import { AssetDialog } from "@/features/investments/components/asset-dialog";
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

export function InvestmentsPage({ data }: { data: InvestmentsPageData }) {
	const [isPending, startTransition] = useTransition();

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
