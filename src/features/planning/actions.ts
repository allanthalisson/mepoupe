"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { debts, financialGoals } from "@/db/schema";
import { fetchAccessibleAccountIds } from "@/shared/lib/accounts/access";
import {
	type ActionResult,
	handleActionError,
	revalidateForEntity,
} from "@/shared/lib/actions/helpers";
import { getUser } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import { noteSchema, uuidSchema } from "@/shared/lib/schemas/common";
import { formatDecimalForDbRequired } from "@/shared/utils/currency";
import { parseLocalDateString } from "@/shared/utils/date";

const optionalDateSchema = z
	.string()
	.trim()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
	.nullish()
	.transform((value) => (value ? parseLocalDateString(value) : null));

const moneySchema = z.coerce
	.number({ message: "Informe um valor válido." })
	.min(0, "O valor não pode ser negativo.");

const goalBaseSchema = z.object({
	name: z.string().trim().min(1, "Informe o nome da meta."),
	goalType: z.enum([
		"emergency_reserve",
		"debt_freedom",
		"purchase",
		"passive_income",
		"investment",
		"other",
	]),
	targetAmount: moneySchema.positive("O valor alvo deve ser maior que zero."),
	currentAmount: moneySchema.default(0),
	monthlyContribution: moneySchema.default(0),
	targetDate: optionalDateSchema,
	priority: z.coerce.number().int().min(1).max(3).default(2),
	status: z.enum(["active", "paused", "completed"]).default("active"),
	note: noteSchema,
	accountId: uuidSchema("Conta").nullish(),
});

const goalUpdateSchema = goalBaseSchema.extend({ id: uuidSchema("Meta") });
const deleteSchema = z.object({ id: uuidSchema("Registro") });

const debtBaseSchema = z.object({
	name: z.string().trim().min(1, "Informe o nome da dívida."),
	creditor: z.string().trim().nullish(),
	currentBalance: moneySchema.positive("O saldo deve ser maior que zero."),
	annualInterestRate: z.coerce.number().min(0).max(10000).default(0),
	minimumPayment: moneySchema.default(0),
	plannedPayment: moneySchema.default(0),
	dueDay: z.coerce.number().int().min(1).max(31).nullish(),
	status: z.enum(["active", "paid"]).default("active"),
	note: noteSchema,
});

const debtUpdateSchema = debtBaseSchema.extend({ id: uuidSchema("Dívida") });

export type GoalInput = z.input<typeof goalBaseSchema>;
export type GoalUpdateInput = z.input<typeof goalUpdateSchema>;
export type DebtInput = z.input<typeof debtBaseSchema>;
export type DebtUpdateInput = z.input<typeof debtUpdateSchema>;

async function validateGoalAccount(userId: string, accountId?: string | null) {
	if (!accountId) return true;
	const ids = await fetchAccessibleAccountIds(userId, [accountId]);
	return ids.has(accountId);
}

export async function createGoalAction(
	input: GoalInput,
): Promise<ActionResult> {
	try {
		const currentUser = await getUser();
		const data = goalBaseSchema.parse(input);
		if (!(await validateGoalAccount(currentUser.id, data.accountId))) {
			return { success: false, error: "Conta vinculada não encontrada." };
		}

		await db.insert(financialGoals).values({
			name: data.name,
			goalType: data.goalType,
			targetAmount: formatDecimalForDbRequired(data.targetAmount),
			currentAmount: formatDecimalForDbRequired(data.currentAmount),
			monthlyContribution: formatDecimalForDbRequired(data.monthlyContribution),
			targetDate: data.targetDate,
			priority: data.priority,
			status: data.status,
			note: data.note ?? null,
			accountId: data.accountId ?? null,
			userId: currentUser.id,
		});

		revalidateForEntity("planning", currentUser.id);
		return { success: true, message: "Meta criada." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function updateGoalAction(
	input: GoalUpdateInput,
): Promise<ActionResult> {
	try {
		const currentUser = await getUser();
		const data = goalUpdateSchema.parse(input);
		if (!(await validateGoalAccount(currentUser.id, data.accountId))) {
			return { success: false, error: "Conta vinculada não encontrada." };
		}

		const [updated] = await db
			.update(financialGoals)
			.set({
				name: data.name,
				goalType: data.goalType,
				targetAmount: formatDecimalForDbRequired(data.targetAmount),
				currentAmount: formatDecimalForDbRequired(data.currentAmount),
				monthlyContribution: formatDecimalForDbRequired(
					data.monthlyContribution,
				),
				targetDate: data.targetDate,
				priority: data.priority,
				status: data.status,
				note: data.note ?? null,
				accountId: data.accountId ?? null,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(financialGoals.id, data.id),
					eq(financialGoals.userId, currentUser.id),
				),
			)
			.returning({ id: financialGoals.id });

		if (!updated) return { success: false, error: "Meta não encontrada." };
		revalidateForEntity("planning", currentUser.id);
		return { success: true, message: "Meta atualizada." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function deleteGoalAction(
	input: z.input<typeof deleteSchema>,
): Promise<ActionResult> {
	try {
		const currentUser = await getUser();
		const data = deleteSchema.parse(input);
		const [deleted] = await db
			.delete(financialGoals)
			.where(
				and(
					eq(financialGoals.id, data.id),
					eq(financialGoals.userId, currentUser.id),
				),
			)
			.returning({ id: financialGoals.id });
		if (!deleted) return { success: false, error: "Meta não encontrada." };
		revalidateForEntity("planning", currentUser.id);
		return { success: true, message: "Meta removida." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function createDebtAction(
	input: DebtInput,
): Promise<ActionResult> {
	try {
		const currentUser = await getUser();
		const data = debtBaseSchema.parse(input);
		await db.insert(debts).values({
			name: data.name,
			creditor: data.creditor || null,
			currentBalance: formatDecimalForDbRequired(data.currentBalance),
			annualInterestRate: data.annualInterestRate.toFixed(4),
			minimumPayment: formatDecimalForDbRequired(data.minimumPayment),
			plannedPayment: formatDecimalForDbRequired(data.plannedPayment),
			dueDay: data.dueDay ?? null,
			status: data.status,
			note: data.note ?? null,
			userId: currentUser.id,
		});
		revalidateForEntity("planning", currentUser.id);
		return { success: true, message: "Dívida adicionada ao plano." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function updateDebtAction(
	input: DebtUpdateInput,
): Promise<ActionResult> {
	try {
		const currentUser = await getUser();
		const data = debtUpdateSchema.parse(input);
		const [updated] = await db
			.update(debts)
			.set({
				name: data.name,
				creditor: data.creditor || null,
				currentBalance: formatDecimalForDbRequired(data.currentBalance),
				annualInterestRate: data.annualInterestRate.toFixed(4),
				minimumPayment: formatDecimalForDbRequired(data.minimumPayment),
				plannedPayment: formatDecimalForDbRequired(data.plannedPayment),
				dueDay: data.dueDay ?? null,
				status: data.status,
				note: data.note ?? null,
				updatedAt: new Date(),
			})
			.where(and(eq(debts.id, data.id), eq(debts.userId, currentUser.id)))
			.returning({ id: debts.id });
		if (!updated) return { success: false, error: "Dívida não encontrada." };
		revalidateForEntity("planning", currentUser.id);
		return { success: true, message: "Dívida atualizada." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function deleteDebtAction(
	input: z.input<typeof deleteSchema>,
): Promise<ActionResult> {
	try {
		const currentUser = await getUser();
		const data = deleteSchema.parse(input);
		const [deleted] = await db
			.delete(debts)
			.where(and(eq(debts.id, data.id), eq(debts.userId, currentUser.id)))
			.returning({ id: debts.id });
		if (!deleted) return { success: false, error: "Dívida não encontrada." };
		revalidateForEntity("planning", currentUser.id);
		return { success: true, message: "Dívida removida." };
	} catch (error) {
		return handleActionError(error);
	}
}
