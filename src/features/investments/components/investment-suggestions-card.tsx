"use client";

import { RiCheckLine, RiCloseLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { dismissInvestmentSuggestionAction } from "@/features/investments/actions";
import { AssetDialog } from "@/features/investments/components/asset-dialog";
import { COURSE_CLASS_LABELS } from "@/features/investments/lib/course-method";
import type { InvestmentsPageData } from "@/features/investments/queries";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { formatCurrency } from "@/shared/utils/currency";

type GoalOption = { id: string; name: string };

interface InvestmentSuggestionsCardProps {
	suggestions: InvestmentsPageData["suggestions"];
	freshness: InvestmentsPageData["suggestionsFreshness"];
	goals: GoalOption[];
}

function DismissButton({ ticker }: { ticker: string }) {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	return (
		<Button
			size="sm"
			variant="ghost"
			disabled={isPending}
			onClick={() => {
				startTransition(async () => {
					const result = await dismissInvestmentSuggestionAction({ ticker });
					if (result.success) {
						toast.success(result.message);
						router.refresh();
					} else {
						toast.error(result.error);
					}
				});
			}}
		>
			<RiCloseLine className="size-4" />
			Dispensar
		</Button>
	);
}

export function InvestmentSuggestionsCard({
	suggestions,
	freshness,
	goals,
}: InvestmentSuggestionsCardProps) {
	if (!freshness.configured) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Sugestões de aporte</CardTitle>
					<CardDescription>
						Configure sua chave da brapi.dev em Configurações → Integrações para
						receber sugestões de ações e FIIs específicos, com base no filtro
						fundamentalista das aulas.
					</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	const grouped = new Map<string, typeof suggestions>();
	for (const suggestion of suggestions) {
		const list = grouped.get(suggestion.assetClass) ?? [];
		list.push(suggestion);
		grouped.set(suggestion.assetClass, list);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Sugestões de aporte</CardTitle>
				<CardDescription>
					Ações e FIIs que passam no filtro fundamentalista das aulas, entre os
					mais líquidos da B3, cruzados com o que sua carteira ainda precisa
					reforçar. Não é recomendação de investimento — confirme qualidade,
					liquidez e adequação antes de qualquer decisão.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{suggestions.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						{freshness.candidatesTracked === 0
							? "O radar de candidatos ainda está sendo montado — confira novamente em algumas horas."
							: "Nenhuma sugestão agora: sua carteira já está dentro das bandas, ou não há candidato aprovado disponível para a classe que precisa de reforço."}
					</p>
				) : (
					[...grouped.entries()].map(([assetClass, items]) => (
						<div key={assetClass} className="space-y-3">
							<p className="font-medium text-sm">
								{COURSE_CLASS_LABELS[
									assetClass as keyof typeof COURSE_CLASS_LABELS
								] ?? assetClass}
							</p>
							<div className="grid gap-3 md:grid-cols-2">
								{items?.map((suggestion) => (
									<div
										key={suggestion.ticker}
										className="flex flex-col gap-2 rounded-lg border p-4"
									>
										<div className="flex items-start justify-between gap-2">
											<div>
												<p className="font-medium text-sm">
													{suggestion.ticker}
												</p>
												<p className="text-muted-foreground text-xs">
													{suggestion.name}
												</p>
											</div>
											<Badge
												variant={
													suggestion.screeningStatus === "approved"
														? "success"
														: "outline"
												}
												className="gap-1"
											>
												{suggestion.screeningStatus === "approved" && (
													<RiCheckLine className="size-3" />
												)}
												{suggestion.screeningStatus === "approved"
													? "Aprovado"
													: "Atenção"}
											</Badge>
										</div>
										<p className="text-muted-foreground text-xs">
											{suggestion.passed}/{suggestion.available} métricas
											aprovadas
											{suggestion.alreadyOwned && " · já está na carteira"}
										</p>
										<p className="text-sm">
											Aporte sugerido:{" "}
											<span className="font-medium">
												{formatCurrency(suggestion.suggestedContribution)}
											</span>
											{suggestion.currentPrice !== null && (
												<span className="text-muted-foreground">
													{" "}
													· cotação {formatCurrency(suggestion.currentPrice)}
												</span>
											)}
										</p>
										<div className="mt-1 flex items-center gap-2">
											<AssetDialog
												goals={goals}
												defaults={{
													name: suggestion.name,
													ticker: suggestion.ticker,
													assetClass: suggestion.assetClass,
													currentPrice: suggestion.currentPrice ?? 0,
												}}
												trigger={
													<Button size="sm" variant="outline">
														Adicionar à carteira
													</Button>
												}
											/>
											<DismissButton ticker={suggestion.ticker} />
										</div>
									</div>
								))}
							</div>
						</div>
					))
				)}
			</CardContent>
		</Card>
	);
}
