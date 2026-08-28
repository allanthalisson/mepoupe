import "server-only";
import { and, eq } from "drizzle-orm";
import { financialConsultations, user } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { syncUserMarketData } from "@/shared/lib/market-data/sync";
import { generateFinancialConsultation } from "./service";

function currentPeriod() {
	const now = new Date();
	return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function refreshAllFinancialData() {
	const users = await db.select({ id: user.id }).from(user);
	const modelId = process.env.FINANCIAL_CONSULTANT_MODEL?.trim();
	const period = currentPeriod();
	const summary = {
		users: users.length,
		marketUpdated: 0,
		marketFailed: 0,
		consultationsGenerated: 0,
		consultationsFailed: 0,
	};

	for (const currentUser of users) {
		const market = await syncUserMarketData(currentUser.id);
		summary.marketUpdated += market.updated;
		summary.marketFailed += market.failed;
		if (!modelId) continue;
		const existing = await db.query.financialConsultations.findFirst({
			columns: { id: true, updatedAt: true },
			where: and(
				eq(financialConsultations.userId, currentUser.id),
				eq(financialConsultations.period, period),
			),
		});
		if (
			existing &&
			Date.now() - existing.updatedAt.getTime() < 7 * 24 * 60 * 60 * 1000
		)
			continue;
		try {
			const result = await generateFinancialConsultation({
				userId: currentUser.id,
				period,
				modelId,
			});
			if (result.success) summary.consultationsGenerated += 1;
			else summary.consultationsFailed += 1;
		} catch (error) {
			console.error("Automatic financial consultation failed:", error);
			summary.consultationsFailed += 1;
		}
	}
	return summary;
}
