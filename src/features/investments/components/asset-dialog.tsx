"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	createInvestmentAssetAction,
	type InvestmentAssetInput,
	updateInvestmentAssetAction,
} from "@/features/investments/actions";
import { ASSET_CLASS_LABELS } from "@/features/investments/lib/portfolio";
import type { InvestmentAsset } from "@/features/investments/queries";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";

type GoalOption = { id: string; name: string };

interface AssetDialogProps {
	trigger: React.ReactNode;
	goals: GoalOption[];
	asset?: InvestmentAsset;
}

const toInputValue = (value: number) => String(value).replace(".", ",");
const parseNumber = (value: string) =>
	Number.parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;

export function AssetDialog({ trigger, goals, asset }: AssetDialogProps) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [name, setName] = useState(asset?.name ?? "");
	const [ticker, setTicker] = useState(asset?.ticker ?? "");
	const [assetClass, setAssetClass] = useState(
		asset?.assetClass ?? "fixed_income",
	);
	const [institution, setInstitution] = useState(asset?.institution ?? "");
	const [quantity, setQuantity] = useState(toInputValue(asset?.quantity ?? 0));
	const [averagePrice, setAveragePrice] = useState(
		toInputValue(asset?.averagePrice ?? 0),
	);
	const [currentPrice, setCurrentPrice] = useState(
		toInputValue(asset?.currentPrice ?? 0),
	);
	const [monthlyIncome, setMonthlyIncome] = useState(
		toInputValue(asset?.monthlyIncome ?? 0),
	);
	const [targetAllocation, setTargetAllocation] = useState(
		toInputValue(asset?.targetAllocation ?? 0),
	);
	const [goalId, setGoalId] = useState(asset?.goalId ?? "");
	const [note, setNote] = useState(asset?.note ?? "");

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		const payload: InvestmentAssetInput = {
			name,
			ticker: ticker || null,
			assetClass: assetClass as InvestmentAssetInput["assetClass"],
			institution: institution || null,
			quantity: parseNumber(quantity),
			averagePrice: parseNumber(averagePrice),
			currentPrice: parseNumber(currentPrice),
			monthlyIncome: parseNumber(monthlyIncome),
			targetAllocation: parseNumber(targetAllocation),
			goalId: goalId || null,
			note: note || null,
		};

		startTransition(async () => {
			const result = asset
				? await updateInvestmentAssetAction({ ...payload, id: asset.id })
				: await createInvestmentAssetAction(payload);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			toast.success(result.message);
			setOpen(false);
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{asset ? "Editar investimento" : "Novo investimento"}
					</DialogTitle>
					<DialogDescription>
						Informe posição, preço atual, renda e a participação desejada.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
					<div className="grid gap-2">
						<Label htmlFor="asset-name">Nome</Label>
						<Input
							id="asset-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="asset-ticker">Código ou ticker</Label>
						<Input
							id="asset-ticker"
							value={ticker}
							onChange={(event) => setTicker(event.target.value.toUpperCase())}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="asset-class">Classe</Label>
						<select
							id="asset-class"
							value={assetClass}
							onChange={(event) => setAssetClass(event.target.value)}
							className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
						>
							{Object.entries(ASSET_CLASS_LABELS).map(([value, label]) => (
								<option key={value} value={value}>
									{label}
								</option>
							))}
						</select>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="asset-institution">Instituição</Label>
						<Input
							id="asset-institution"
							value={institution}
							onChange={(event) => setInstitution(event.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="asset-quantity">Quantidade</Label>
						<Input
							id="asset-quantity"
							inputMode="decimal"
							value={quantity}
							onChange={(event) => setQuantity(event.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="asset-average-price">Preço médio</Label>
						<Input
							id="asset-average-price"
							inputMode="decimal"
							value={averagePrice}
							onChange={(event) => setAveragePrice(event.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="asset-current-price">Preço atual</Label>
						<Input
							id="asset-current-price"
							inputMode="decimal"
							value={currentPrice}
							onChange={(event) => setCurrentPrice(event.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="asset-income">Renda mensal</Label>
						<Input
							id="asset-income"
							inputMode="decimal"
							value={monthlyIncome}
							onChange={(event) => setMonthlyIncome(event.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="asset-allocation">Alocação-alvo (%)</Label>
						<Input
							id="asset-allocation"
							inputMode="decimal"
							value={targetAllocation}
							onChange={(event) => setTargetAllocation(event.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="asset-goal">Meta vinculada</Label>
						<select
							id="asset-goal"
							value={goalId}
							onChange={(event) => setGoalId(event.target.value)}
							className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
						>
							<option value="">Nenhuma</option>
							{goals.map((goal) => (
								<option key={goal.id} value={goal.id}>
									{goal.name}
								</option>
							))}
						</select>
					</div>
					<div className="grid gap-2 sm:col-span-2">
						<Label htmlFor="asset-note">Observações</Label>
						<Textarea
							id="asset-note"
							value={note}
							onChange={(event) => setNote(event.target.value)}
						/>
					</div>
					<DialogFooter className="sm:col-span-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Salvando..." : "Salvar investimento"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
