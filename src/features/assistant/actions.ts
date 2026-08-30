"use server";

import { generateText, type ModelMessage, stepCountIs } from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { assistantConversations, assistantMessages } from "@/db/schema";
import { ASSISTANT_SYSTEM_PROMPT } from "@/features/assistant/constants";
import { buildAssistantTools } from "@/features/assistant/lib/tools";
import {
	type AssistantMessageRecord,
	fetchConversationMessages,
	MAX_CONTEXT_MESSAGES,
} from "@/features/assistant/queries";
import { DEFAULT_MODEL } from "@/features/insights/constants";
import { resolveLanguageModel } from "@/shared/lib/ai/model-provider";
import { getUser } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import { fetchUserIntegrationSecrets } from "@/shared/lib/integrations/user-keys";
import { uuidSchema } from "@/shared/lib/schemas/common";
import type { ActionResult } from "@/shared/lib/types/actions";

const QUESTION_MAX_LENGTH = 500;
const MAX_TOOL_STEPS = 6;
const TITLE_MAX_LENGTH = 80;

const askAssistantSchema = z.object({
	question: z
		.string()
		.trim()
		.min(1, "Digite uma pergunta.")
		.max(
			QUESTION_MAX_LENGTH,
			`A pergunta deve ter no máximo ${QUESTION_MAX_LENGTH} caracteres.`,
		),
	conversationId: uuidSchema("Conversa").optional(),
	modelId: z.string().trim().min(1).optional(),
});

export type AskAssistantInput = z.input<typeof askAssistantSchema>;
export type AskAssistantResult = {
	conversationId: string;
	answer: string;
};

function buildConversationTitle(question: string): string {
	const normalized = question.trim().replace(/\s+/g, " ");
	return normalized.length > TITLE_MAX_LENGTH
		? `${normalized.slice(0, TITLE_MAX_LENGTH - 1)}…`
		: normalized;
}

function toModelMessage(message: AssistantMessageRecord): ModelMessage {
	return message.role === "assistant"
		? { role: "assistant", content: message.content }
		: { role: "user", content: message.content };
}

/**
 * Pergunta → LLM decide quais tools chamar → tool roda uma consulta
 * server-side já isolada por `userId` → LLM interpreta o resultado
 * estruturado e responde. Sem `conversationId`, cria uma conversa nova;
 * com um `conversationId` existente, usa as últimas mensagens como
 * contexto (multi-turno) e persiste a nova troca ao final.
 */
export async function askAssistantAction(
	input: AskAssistantInput,
): Promise<ActionResult<AskAssistantResult>> {
	try {
		const user = await getUser();
		const data = askAssistantSchema.parse(input);

		const { aiApiKeys } = await fetchUserIntegrationSecrets(user.id);
		const resolvedModel = resolveLanguageModel(
			data.modelId ?? DEFAULT_MODEL,
			aiApiKeys,
		);
		if (!resolvedModel.success) {
			return { success: false, error: resolvedModel.error };
		}

		let conversationId = data.conversationId;
		let priorMessages: AssistantMessageRecord[] = [];

		if (conversationId) {
			const existing = await fetchConversationMessages(user.id, conversationId);
			if (!existing) {
				return { success: false, error: "Conversa não encontrada." };
			}
			priorMessages = existing.slice(-MAX_CONTEXT_MESSAGES);
		} else {
			const [created] = await db
				.insert(assistantConversations)
				.values({
					userId: user.id,
					title: buildConversationTitle(data.question),
				})
				.returning({ id: assistantConversations.id });
			if (!created) {
				return {
					success: false,
					error: "Não foi possível iniciar a conversa.",
				};
			}
			conversationId = created.id;
		}

		const messages: ModelMessage[] = [
			...priorMessages.map(toModelMessage),
			{ role: "user", content: data.question },
		];

		const result = await generateText({
			model: resolvedModel.model,
			system: ASSISTANT_SYSTEM_PROMPT,
			messages,
			tools: buildAssistantTools(user.id),
			stopWhen: stepCountIs(MAX_TOOL_STEPS),
		});

		if (!result.text.trim()) {
			return {
				success: false,
				error:
					"O Assistente não conseguiu formular uma resposta. Tente reformular a pergunta.",
			};
		}

		await db.insert(assistantMessages).values([
			{ conversationId, role: "user", content: data.question },
			{ conversationId, role: "assistant", content: result.text },
		]);
		await db
			.update(assistantConversations)
			.set({ updatedAt: new Date() })
			.where(eq(assistantConversations.id, conversationId));

		return {
			success: true,
			message: "ok",
			data: { conversationId, answer: result.text },
		};
	} catch (error) {
		console.error("Error in askAssistantAction:", error);
		return {
			success: false,
			error: "Erro ao consultar o Assistente. Tente novamente.",
		};
	}
}

const getConversationMessagesSchema = z.object({
	conversationId: uuidSchema("Conversa"),
});

export async function getConversationMessagesAction(
	input: z.input<typeof getConversationMessagesSchema>,
): Promise<ActionResult<AssistantMessageRecord[]>> {
	try {
		const user = await getUser();
		const data = getConversationMessagesSchema.parse(input);
		const messages = await fetchConversationMessages(
			user.id,
			data.conversationId,
		);
		if (!messages) {
			return { success: false, error: "Conversa não encontrada." };
		}
		return { success: true, message: "ok", data: messages };
	} catch (error) {
		console.error("Error in getConversationMessagesAction:", error);
		return { success: false, error: "Erro ao carregar a conversa." };
	}
}

const deleteConversationSchema = z.object({
	conversationId: uuidSchema("Conversa"),
});

export async function deleteConversationAction(
	input: z.input<typeof deleteConversationSchema>,
): Promise<ActionResult> {
	try {
		const user = await getUser();
		const data = deleteConversationSchema.parse(input);
		const [deleted] = await db
			.delete(assistantConversations)
			.where(
				and(
					eq(assistantConversations.id, data.conversationId),
					eq(assistantConversations.userId, user.id),
				),
			)
			.returning({ id: assistantConversations.id });
		if (!deleted) {
			return { success: false, error: "Conversa não encontrada." };
		}
		return { success: true, message: "Conversa removida." };
	} catch (error) {
		console.error("Error in deleteConversationAction:", error);
		return { success: false, error: "Erro ao remover a conversa." };
	}
}
