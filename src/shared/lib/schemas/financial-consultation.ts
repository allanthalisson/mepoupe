import { z } from "zod";

const AdviceItemSchema = z.object({
	title: z.string(),
	rationale: z.string(),
	action: z.string(),
	horizon: z.enum(["agora", "este_mês", "próximos_3_meses", "longo_prazo"]),
});

export const FinancialConsultationSchema = z.object({
	summary: z.string(),
	healthStatus: z.enum(["attention", "stable", "on_track"]),
	priorities: z.array(AdviceItemSchema).min(2).max(6),
	expenseAnalysis: z.array(z.string()).min(1).max(6),
	investmentAnalysis: z.array(z.string()).min(1).max(8),
	risks: z.array(z.string()).max(8),
	dataGaps: z.array(z.string()).max(8),
	nextMonthlyReview: z.array(z.string()).min(2).max(8),
	disclaimer: z.string(),
});

export type FinancialConsultationData = z.infer<
	typeof FinancialConsultationSchema
>;
