import { z } from "zod";

export const inboxItemSchema = z.object({
	sourceApp: z.string().min(1, "sourceApp é obrigatório").max(255),
	sourceAppName: z.string().max(255).optional(),
	originalTitle: z.string().max(500).optional(),
	originalText: z.string().min(1, "originalText é obrigatório").max(5000),
	notificationTimestamp: z
		.string()
		.transform((val) => new Date(val))
		.refine((d) => !Number.isNaN(d.getTime()), "Data de notificação inválida"),
	parsedName: z.string().max(500).optional(),
	parsedAmount: z.coerce.number().optional(),
	clientId: z.string().max(255).optional(), // ID local do app para rastreamento
});

export const inboxBatchSchema = z.object({
	items: z.array(inboxItemSchema).min(1).max(50),
});
