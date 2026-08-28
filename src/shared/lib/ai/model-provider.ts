import "server-only";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import { minimax } from "vercel-minimax-ai-provider";

const MODEL_ID_REGEX = /^[a-zA-Z0-9._:/-]{2,160}$/;

export type ResolveModelResult =
	| { success: true; model: LanguageModel }
	| { success: false; error: string };

export function resolveLanguageModel(modelId: string): ResolveModelResult {
	const id = modelId.trim();
	if (!MODEL_ID_REGEX.test(id))
		return { success: false, error: "Modelo inválido." };

	if (id.startsWith("openrouter:") || (!id.includes(":") && id.includes("/"))) {
		const apiKey = process.env.OPENROUTER_API_KEY;
		if (!apiKey)
			return { success: false, error: "OPENROUTER_API_KEY não configurada." };
		const providerId = id.replace(/^openrouter:/, "");
		return {
			success: true,
			model: createOpenRouter({ apiKey }).chat(providerId),
		};
	}
	if (id.startsWith("ollama:")) {
		const providerId = id.slice("ollama:".length);
		const ollama = createOpenAICompatible({
			name: "ollama",
			baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
			apiKey: process.env.OLLAMA_API_KEY || "ollama",
			supportsStructuredOutputs: false,
		});
		return { success: true, model: ollama.chatModel(providerId) };
	}
	if (id.startsWith("claude-")) {
		if (!process.env.ANTHROPIC_API_KEY)
			return { success: false, error: "ANTHROPIC_API_KEY não configurada." };
		return { success: true, model: anthropic(id) };
	}
	if (id.startsWith("gemini-")) {
		if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY)
			return {
				success: false,
				error: "GOOGLE_GENERATIVE_AI_API_KEY não configurada.",
			};
		return { success: true, model: google(id) };
	}
	if (id.startsWith("MiniMax-")) {
		if (!process.env.MINIMAX_API_KEY)
			return { success: false, error: "MINIMAX_API_KEY não configurada." };
		return { success: true, model: minimax(id) };
	}
	if (id.startsWith("gpt-")) {
		if (!process.env.OPENAI_API_KEY)
			return { success: false, error: "OPENAI_API_KEY não configurada." };
		return { success: true, model: openai(id) };
	}
	return { success: false, error: "Provider de modelo não suportado." };
}
