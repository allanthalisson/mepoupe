"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	createDebtAction,
	type DebtInput,
	updateDebtAction,
} from "@/features/planning/actions";
import type { PlanningDebt } from "@/features/planning/queries";
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

interface DebtDialogProps {
	trigger: React.ReactNode;
	debt?: PlanningDebt;
}

export function DebtDialog({ trigger, debt }: DebtDialogProps) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [name, setName] = useState(debt?.name ?? "");
	const [creditor, setCreditor] = useState(debt?.creditor ?? "");
	const [currentBalance, setCurrentBalance] = useState(
		String(debt?.currentBalance ?? 0).replace(".", ","),
	);
	const [annualInterestRate, setAnnualInterestRate] = useState(
		String(debt?.annualInterestRate ?? 0).replace(".", ","),
	);
	const [minimumPayment, setMinimumPayment] = useState(
		String(debt?.minimumPayment ?? 0).replace(".", ","),
	);
	const [plannedPayment, setPlannedPayment] = useState(
		String(debt?.plannedPayment ?? 0).replace(".", ","),
	);
	const [dueDay, setDueDay] = useState(debt?.dueDay ? String(debt.dueDay) : "");
	const [status, setStatus] = useState(debt?.status ?? "active");
	const [note, setNote] = useState(debt?.note ?? "");
	const parseNumber = (value: string) =>
		Number.parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		const payload: DebtInput = {
			name,
			creditor: creditor || null,
			currentBalance: parseNumber(currentBalance),
			annualInterestRate: parseNumber(annualInterestRate),
			minimumPayment: parseNumber(minimumPayment),
			plannedPayment: parseNumber(plannedPayment),
			dueDay: dueDay ? Number(dueDay) : null,
			status: status as DebtInput["status"],
			note: note || null,
		};
		startTransition(async () => {
			const result = debt
				? await updateDebtAction({ ...payload, id: debt.id })
				: await createDebtAction(payload);
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
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>
						{debt ? "Editar dívida" : "Adicionar dívida"}
					</DialogTitle>
					<DialogDescription>
						Registre o custo da dívida e um pagamento mensal realista.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
					<div className="grid gap-2 sm:col-span-2">
						<Label htmlFor="debt-name">Nome</Label>
						<Input
							id="debt-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>
					<div className="grid gap-2 sm:col-span-2">
						<Label htmlFor="debt-creditor">Credor</Label>
						<Input
							id="debt-creditor"
							value={creditor}
							onChange={(e) => setCreditor(e.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="debt-balance">Saldo devedor</Label>
						<Input
							id="debt-balance"
							inputMode="decimal"
							value={currentBalance}
							onChange={(e) => setCurrentBalance(e.target.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="debt-rate">Juros ao ano (%)</Label>
						<Input
							id="debt-rate"
							inputMode="decimal"
							value={annualInterestRate}
							onChange={(e) => setAnnualInterestRate(e.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="debt-minimum">Parcela mínima</Label>
						<Input
							id="debt-minimum"
							inputMode="decimal"
							value={minimumPayment}
							onChange={(e) => setMinimumPayment(e.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="debt-planned">Pagamento planejado</Label>
						<Input
							id="debt-planned"
							inputMode="decimal"
							value={plannedPayment}
							onChange={(e) => setPlannedPayment(e.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="debt-day">Dia do vencimento</Label>
						<Input
							id="debt-day"
							type="number"
							min={1}
							max={31}
							value={dueDay}
							onChange={(e) => setDueDay(e.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="debt-status">Status</Label>
						<select
							id="debt-status"
							value={status}
							onChange={(e) => setStatus(e.target.value)}
							className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
						>
							<option value="active">Em aberto</option>
							<option value="paid">Quitada</option>
						</select>
					</div>
					<div className="grid gap-2 sm:col-span-2">
						<Label htmlFor="debt-note">Observações</Label>
						<Textarea
							id="debt-note"
							value={note}
							onChange={(e) => setNote(e.target.value)}
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
							{isPending ? "Salvando..." : "Salvar dívida"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
