"use server";

import { generateText, stepCountIs } from "ai";
import { z } from "zod";
import { ASSISTANT_SYSTEM_PROMPT } from "@/features/assistant/constants";
import { buildAssistantTools } from "@/features/assistant/lib/tools";
import { DEFAULT_MODEL } from "@/features/insights/constants";
import { resolveLanguageModel } from "@/shared/lib/ai/model-provider";
import { getUser } from "@/shared/lib/auth/server";
import { fetchUserIntegrationSecrets } from "@/shared/lib/integrations/user-keys";
import type { ActionResult } from "@/shared/lib/types/actions";

const QUESTION_MAX_LENGTH = 500;
const MAX_TOOL_STEPS = 6;

const askAssistantSchema = z.object({
	question: z
		.string()
		.trim()
		.min(1, "Digite uma pergunta.")
		.max(
			QUESTION_MAX_LENGTH,
			`A pergunta deve ter no máximo ${QUESTION_MAX_LENGTH} caracteres.`,
		),
	modelId: z.string().trim().min(1).optional(),
});

export type AskAssistantInput = z.input<typeof askAssistantSchema>;

/**
 * Pergunta → LLM decide quais tools chamar → tool roda uma consulta
 * server-side já isolada por `userId` → LLM interpreta o resultado
 * estruturado e responde. Sem persistência ainda (vem numa próxima etapa);
 * cada chamada é uma pergunta isolada.
 */
export async function askAssistantAction(
	input: AskAssistantInput,
): Promise<ActionResult<{ answer: string }>> {
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

		const result = await generateText({
			model: resolvedModel.model,
			system: ASSISTANT_SYSTEM_PROMPT,
			prompt: data.question,
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

		return {
			success: true,
			message: "ok",
			data: { answer: result.text },
		};
	} catch (error) {
		console.error("Error in askAssistantAction:", error);
		return {
			success: false,
			error: "Erro ao consultar o Assistente. Tente novamente.",
		};
	}
}
