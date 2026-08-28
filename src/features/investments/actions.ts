"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
	financialConsultations,
	financialGoals,
	investmentAssets,
} from "@/db/schema";
import {
	type ActionResult,
	handleActionError,
	revalidateForEntity,
} from "@/shared/lib/actions/helpers";
import { getUser } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import { generateFinancialConsultation } from "@/shared/lib/financial-consultant/service";
import { syncUserMarketData } from "@/shared/lib/market-data/sync";
import { noteSchema, uuidSchema } from "@/shared/lib/schemas/common";
import type { FinancialConsultationData } from "@/shared/lib/schemas/financial-consultation";
import { FinancialConsultationSchema } from "@/shared/lib/schemas/financial-consultation";

const nonNegativeNumber = z.coerce
	.number({ message: "Informe um valor válido." })
	.min(0, "O valor não pode ser negativo.");

const assetSchema = z.object({
	name: z.string().trim().min(1, "Informe o nome do investimento."),
	ticker: z.string().trim().max(24).nullish(),
	assetClass: z.enum([
		"fixed_income",
		"stocks",
		"reits",
		"international",
		"etfs",
		"crypto",
		"retirement",
		"cash",
		"other",
	]),
	institution: z.string().trim().max(120).nullish(),
	quantity: nonNegativeNumber,
	averagePrice: nonNegativeNumber,
	currentPrice: nonNegativeNumber,
	monthlyIncome: nonNegativeNumber,
	targetAllocation: z.coerce.number().min(0).max(100),
	note: noteSchema,
	goalId: uuidSchema("Meta").nullish(),
});

const updateAssetSchema = assetSchema.extend({
	id: uuidSchema("Investimento"),
});
const deleteAssetSchema = z.object({ id: uuidSchema("Investimento") });

export type InvestmentAssetInput = z.input<typeof assetSchema>;
export type InvestmentAssetUpdateInput = z.input<typeof updateAssetSchema>;

async function validateGoal(userId: string, goalId?: string | null) {
	if (!goalId) return true;
	const goal = await db.query.financialGoals.findFirst({
		columns: { id: true },
		where: and(
			eq(financialGoals.id, goalId),
			eq(financialGoals.userId, userId),
		),
	});
	return Boolean(goal);
}

const decimal = (value: number, scale = 2) => value.toFixed(scale);

export async function createInvestmentAssetAction(
	input: InvestmentAssetInput,
): Promise<ActionResult> {
	try {
		const currentUser = await getUser();
		const data = assetSchema.parse(input);
		if (!(await validateGoal(currentUser.id, data.goalId))) {
			return { success: false, error: "Meta vinculada não encontrada." };
		}

		await db.insert(investmentAssets).values({
			name: data.name,
			ticker: data.ticker || null,
			assetClass: data.assetClass,
			institution: data.institution || null,
			quantity: decimal(data.quantity, 8),
			averagePrice: decimal(data.averagePrice, 4),
			currentPrice: decimal(data.currentPrice, 4),
			monthlyIncome: decimal(data.monthlyIncome),
			targetAllocation: decimal(data.targetAllocation),
			note: data.note ?? null,
			goalId: data.goalId ?? null,
			userId: currentUser.id,
		});

		revalidateForEntity("investments", currentUser.id);
		return { success: true, message: "Investimento adicionado." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function updateInvestmentAssetAction(
	input: InvestmentAssetUpdateInput,
): Promise<ActionResult> {
	try {
		const currentUser = await getUser();
		const data = updateAssetSchema.parse(input);
		if (!(await validateGoal(currentUser.id, data.goalId))) {
			return { success: false, error: "Meta vinculada não encontrada." };
		}

		const [updated] = await db
			.update(investmentAssets)
			.set({
				name: data.name,
				ticker: data.ticker || null,
				assetClass: data.assetClass,
				institution: data.institution || null,
				quantity: decimal(data.quantity, 8),
				averagePrice: decimal(data.averagePrice, 4),
				currentPrice: decimal(data.currentPrice, 4),
				monthlyIncome: decimal(data.monthlyIncome),
				targetAllocation: decimal(data.targetAllocation),
				note: data.note ?? null,
				goalId: data.goalId ?? null,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(investmentAssets.id, data.id),
					eq(investmentAssets.userId, currentUser.id),
				),
			)
			.returning({ id: investmentAssets.id });

		if (!updated)
			return { success: false, error: "Investimento não encontrado." };
		revalidateForEntity("investments", currentUser.id);
		return { success: true, message: "Investimento atualizado." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function deleteInvestmentAssetAction(
	input: z.input<typeof deleteAssetSchema>,
): Promise<ActionResult> {
	try {
		const currentUser = await getUser();
		const data = deleteAssetSchema.parse(input);
		const [deleted] = await db
			.delete(investmentAssets)
			.where(
				and(
					eq(investmentAssets.id, data.id),
					eq(investmentAssets.userId, currentUser.id),
				),
			)
			.returning({ id: investmentAssets.id });

		if (!deleted)
			return { success: false, error: "Investimento não encontrado." };
		revalidateForEntity("investments", currentUser.id);
		return { success: true, message: "Investimento removido." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function syncInvestmentMarketDataAction(): Promise<
	ActionResult<{ updated: number; skipped: number; failed: number }>
> {
	try {
		const currentUser = await getUser();
		const result = await syncUserMarketData(currentUser.id);
		revalidateForEntity("investments", currentUser.id);
		return {
			success: true,
			data: result,
			message:
				result.failed > 0
					? `Atualização concluída com ${result.failed} ativo(s) indisponível(is).`
					: "Dados de mercado atualizados.",
		};
	} catch (error) {
		console.error("Market data sync failed:", error);
		return {
			success: false,
			error: "Não foi possível atualizar o mercado agora.",
		};
	}
}

const consultationInputSchema = z.object({
	period: z.string().regex(/^\d{4}-\d{2}$/),
	modelId: z.string().trim().min(2).max(160),
});

export async function generateFinancialConsultationAction(
	input: z.input<typeof consultationInputSchema>,
): Promise<ActionResult<FinancialConsultationData>> {
	try {
		const currentUser = await getUser();
		const data = consultationInputSchema.parse(input);
		const recent = await db.query.financialConsultations.findFirst({
			where: and(
				eq(financialConsultations.userId, currentUser.id),
				eq(financialConsultations.period, data.period),
			),
		});
		const recentData = recent
			? FinancialConsultationSchema.safeParse(recent.data)
			: null;
		if (
			recent &&
			recentData?.success &&
			Date.now() - recent.updatedAt.getTime() < 60 * 60 * 1000
		) {
			return {
				success: true,
				data: recentData.data,
				message: "A consultoria já está atualizada.",
			};
		}
		const result = await generateFinancialConsultation({
			userId: currentUser.id,
			period: data.period,
			modelId: data.modelId,
		});
		if (!result.success) return result;
		revalidateForEntity("investments", currentUser.id);
		return {
			success: true,
			data: result.data,
			message: "Consultoria mensal atualizada.",
		};
	} catch (error) {
		console.error("Error generating financial consultation:", error);
		return {
			success: false,
			error: "Não foi possível gerar a consultoria agora.",
		};
	}
}
