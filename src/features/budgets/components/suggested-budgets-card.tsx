"use client";

import { RiCloseLine, RiMagicLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
import { formatCurrency } from "@/shared/utils/currency";
import { displayPeriod } from "@/shared/utils/period";

interface SuggestedBudgetsCardProps {
	suggestions: SuggestedCategoryBudget[];
	period: string;
}

/**
 * "Metas sugeridas" — uma camada em cima dos budgets já existentes, não uma
 * segunda implementação de orçamento: aplicar aqui é só chamar
 * `createBudgetAction`, o mesmo action usado no cadastro manual.
 */
export function SuggestedBudgetsCard({
	suggestions,
	period,
}: SuggestedBudgetsCardProps) {
	const [dismissed, setDismissed] = useState<Set<string>>(new Set());
	const [applyingId, setApplyingId] = useState<string | null>(null);
	const [isApplyingAll, startApplyAllTransition] = useTransition();
	const router = useRouter();

	const visible = suggestions.filter(
		(suggestion) => !dismissed.has(suggestion.categoryId),
	);

	if (visible.length === 0) {
		return null;
	}

	const dismiss = (categoryId: string) => {
		setDismissed((prev) => new Set(prev).add(categoryId));
	};

	const applySuggestion = async (suggestion: SuggestedCategoryBudget) => {
		const result = await createBudgetAction({
			categoryId: suggestion.categoryId,
			period,
			amount: suggestion.suggestedBudget.toFixed(2),
		});
		return result.success;
	};

	const handleApplyOne = (suggestion: SuggestedCategoryBudget) => {
		setApplyingId(suggestion.categoryId);
		applySuggestion(suggestion)
			.then((success) => {
				if (success) {
					toast.success(`Meta aplicada para ${suggestion.categoryName}.`);
					dismiss(suggestion.categoryId);
					router.refresh();
				} else {
					toast.error("Não foi possível aplicar essa meta.");
				}
			})
			.finally(() => setApplyingId(null));
	};

	const handleApplyAll = () => {
		startApplyAllTransition(async () => {
			let applied = 0;
			for (const suggestion of visible) {
				if (await applySuggestion(suggestion)) applied += 1;
			}
			if (applied > 0) {
				toast.success(
					`${applied} meta${applied > 1 ? "s" : ""} sugerida${applied > 1 ? "s" : ""} aplicada${applied > 1 ? "s" : ""}.`,
				);
				setDismissed(
					(prev) => new Set([...prev, ...visible.map((s) => s.categoryId)]),
				);
				router.refresh();
			} else {
				toast.error("Não foi possível aplicar as metas sugeridas.");
			}
		});
	};

	const totalPotentialSavings = visible.reduce(
		(total, suggestion) => total + suggestion.potentialMonthlySavings,
		0,
	);

	const isBusy = isApplyingAll || applyingId !== null;

	return (
		<Card>
			<CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
				<div>
					<CardTitle>Metas sugeridas para {displayPeriod(period)}</CardTitle>
					<CardDescription>
						Calculadas a partir da mediana dos últimos meses de gasto em cada
						categoria.
						{totalPotentialSavings > 0 &&
							` Aplicando todas, a economia potencial é de ${formatCurrency(totalPotentialSavings)}/mês.`}
					</CardDescription>
				</div>
				<Button size="sm" onClick={handleApplyAll} disabled={isBusy}>
					<RiMagicLine className="size-4" />
					{isApplyingAll ? "Aplicando..." : "Aplicar todas"}
				</Button>
			</CardHeader>
			<CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{visible.map((suggestion) => (
					<div
						key={suggestion.categoryId}
						className="flex flex-col gap-2 rounded-lg border p-4"
					>
						<div className="flex items-start justify-between gap-2">
							<p className="font-medium text-sm">{suggestion.categoryName}</p>
							{suggestion.confidence === "low" && (
								<Badge variant="outline">Meta experimental</Badge>
							)}
						</div>
						<div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
							<span className="text-muted-foreground">Média histórica</span>
							<span className="text-right">
								{formatCurrency(suggestion.historicalMedian)}
							</span>
							<span className="text-muted-foreground">Meta sugerida</span>
							<span className="text-right font-medium">
								{formatCurrency(suggestion.suggestedBudget)}
							</span>
							{suggestion.potentialMonthlySavings > 0 && (
								<>
									<span className="text-muted-foreground">
										Economia potencial
									</span>
									<span className="text-right text-success">
										{formatCurrency(suggestion.potentialMonthlySavings)}/mês
									</span>
								</>
							)}
						</div>
						<p className="text-muted-foreground text-xs">{suggestion.reason}</p>
						<div className="mt-1 flex items-center gap-2">
							<Button
								size="sm"
								variant="outline"
								disabled={isBusy}
								onClick={() => handleApplyOne(suggestion)}
							>
								{applyingId === suggestion.categoryId
									? "Aplicando..."
									: "Aplicar"}
							</Button>
							<Button
								size="sm"
								variant="ghost"
								disabled={isBusy}
								onClick={() => dismiss(suggestion.categoryId)}
							>
								<RiCloseLine className="size-4" />
								Ignorar
							</Button>
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
