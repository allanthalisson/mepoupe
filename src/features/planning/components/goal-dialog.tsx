"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	createGoalAction,
	type GoalInput,
	updateGoalAction,
} from "@/features/planning/actions";
import type { PlanningGoal } from "@/features/planning/queries";
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

export const GOAL_TYPE_LABELS: Record<string, string> = {
	emergency_reserve: "Reserva de emergência",
	debt_freedom: "Liberdade de dívidas",
	purchase: "Compra importante",
	passive_income: "Renda passiva",
	investment: "Investimentos",
	other: "Outro objetivo",
};

type AccountOption = { id: string; name: string };

interface GoalDialogProps {
	trigger: React.ReactNode;
	accounts: AccountOption[];
	goal?: PlanningGoal;
}

const toInputValue = (value: number) => String(value).replace(".", ",");

export function GoalDialog({ trigger, accounts, goal }: GoalDialogProps) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [name, setName] = useState(goal?.name ?? "");
	const [goalType, setGoalType] = useState(
		goal?.goalType ?? "emergency_reserve",
	);
	const [targetAmount, setTargetAmount] = useState(
		toInputValue(goal?.targetAmount ?? 0),
	);
	const [currentAmount, setCurrentAmount] = useState(
		toInputValue(goal?.currentAmount ?? 0),
	);
	const [monthlyContribution, setMonthlyContribution] = useState(
		toInputValue(goal?.monthlyContribution ?? 0),
	);
	const [targetDate, setTargetDate] = useState(goal?.targetDate ?? "");
	const [priority, setPriority] = useState(String(goal?.priority ?? 2));
	const [status, setStatus] = useState(goal?.status ?? "active");
	const [accountId, setAccountId] = useState(goal?.accountId ?? "");
	const [note, setNote] = useState(goal?.note ?? "");

	const parseNumber = (value: string) =>
		Number.parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		const payload: GoalInput = {
			name,
			goalType: goalType as GoalInput["goalType"],
			targetAmount: parseNumber(targetAmount),
			currentAmount: parseNumber(currentAmount),
			monthlyContribution: parseNumber(monthlyContribution),
			targetDate: targetDate || null,
			priority: Number(priority),
			status: status as GoalInput["status"],
			note: note || null,
			accountId: accountId || null,
		};

		startTransition(async () => {
			const result = goal
				? await updateGoalAction({ ...payload, id: goal.id })
				: await createGoalAction(payload);
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
					<DialogTitle>{goal ? "Editar meta" : "Nova meta"}</DialogTitle>
					<DialogDescription>
						Defina o valor, o prazo e quanto pretende separar por mês.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
					<div className="grid gap-2 sm:col-span-2">
						<Label htmlFor="goal-name">Nome</Label>
						<Input
							id="goal-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="goal-type">Objetivo</Label>
						<select
							id="goal-type"
							value={goalType}
							onChange={(e) => setGoalType(e.target.value)}
							className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
						>
							{Object.entries(GOAL_TYPE_LABELS).map(([value, label]) => (
								<option key={value} value={value}>
									{label}
								</option>
							))}
						</select>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="goal-priority">Prioridade</Label>
						<select
							id="goal-priority"
							value={priority}
							onChange={(e) => setPriority(e.target.value)}
							className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
						>
							<option value="1">Alta</option>
							<option value="2">Média</option>
							<option value="3">Baixa</option>
						</select>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="goal-target">Valor alvo</Label>
						<Input
							id="goal-target"
							inputMode="decimal"
							value={targetAmount}
							onChange={(e) => setTargetAmount(e.target.value)}
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="goal-current">Valor já acumulado</Label>
						<Input
							id="goal-current"
							inputMode="decimal"
							value={currentAmount}
							onChange={(e) => setCurrentAmount(e.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="goal-monthly">Aporte mensal</Label>
						<Input
							id="goal-monthly"
							inputMode="decimal"
							value={monthlyContribution}
							onChange={(e) => setMonthlyContribution(e.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="goal-date">Data alvo</Label>
						<Input
							id="goal-date"
							type="date"
							value={targetDate}
							onChange={(e) => setTargetDate(e.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="goal-account">Conta vinculada</Label>
						<select
							id="goal-account"
							value={accountId}
							onChange={(e) => setAccountId(e.target.value)}
							className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
						>
							<option value="">Nenhuma</option>
							{accounts.map((account) => (
								<option key={account.id} value={account.id}>
									{account.name}
								</option>
							))}
						</select>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="goal-status">Status</Label>
						<select
							id="goal-status"
							value={status}
							onChange={(e) => setStatus(e.target.value)}
							className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
						>
							<option value="active">Ativa</option>
							<option value="paused">Pausada</option>
							<option value="completed">Concluída</option>
						</select>
					</div>
					<div className="grid gap-2 sm:col-span-2">
						<Label htmlFor="goal-note">Observações</Label>
						<Textarea
							id="goal-note"
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
							{isPending ? "Salvando..." : "Salvar meta"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
