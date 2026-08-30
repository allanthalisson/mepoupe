import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { savedInsights } from "@/db/schema";
import { db } from "@/shared/lib/db";
import {
	type InsightsResponse,
	InsightsResponseSchema,
} from "@/shared/lib/schemas/insights";
import { isValidPeriodKey } from "@/shared/utils/period";

export const savedInsightsPeriodSchema = z
	.string()
	.refine(
		isValidPeriodKey,
		"Período inválido (formato esperado: YYYY-MM ou YYYY-MM:YYYY-MM)",
	);

export type SavedInsightsRecord = {
	insights: InsightsResponse;
	modelId: string;
	createdAt: string;
};

export async function fetchSavedInsights(
	userId: string,
	period: string,
): Promise<SavedInsightsRecord | null> {
	const validatedPeriod = savedInsightsPeriodSchema.parse(period);

	const result = await db
		.select()
		.from(savedInsights)
		.where(
			and(
				eq(savedInsights.userId, userId),
				eq(savedInsights.period, validatedPeriod),
			),
		)
		.limit(1);

	if (result.length === 0) {
		return null;
	}

	const saved = result[0];
	const insights = InsightsResponseSchema.parse(JSON.parse(saved.data));

	return {
		insights,
		modelId: saved.modelId,
		createdAt: saved.createdAt.toISOString(),
	};
}
