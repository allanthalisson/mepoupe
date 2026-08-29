import type { AIProvider } from "@/features/insights/constants";

/**
 * Provedores de IA que o usuário pode configurar com a própria chave.
 * Ollama fica de fora: é local/self-hosted, configurado pelo host (admin),
 * não faz sentido por usuário.
 */
export type UserAiProvider = Exclude<AIProvider, "ollama">;

export const USER_CONFIGURABLE_AI_PROVIDERS: UserAiProvider[] = [
	"openai",
	"anthropic",
	"google",
	"minimax",
	"openrouter",
];

export const AI_PROVIDER_LABELS: Record<UserAiProvider, string> = {
	openai: "OpenAI (ChatGPT)",
	anthropic: "Anthropic (Claude)",
	google: "Google (Gemini)",
	minimax: "MiniMax",
	openrouter: "OpenRouter",
};

/** Onde o usuário consegue gerar a própria chave de cada provedor. */
export const AI_PROVIDER_KEY_URLS: Record<UserAiProvider, string> = {
	openai: "https://platform.openai.com/api-keys",
	anthropic: "https://console.anthropic.com/settings/keys",
	google: "https://aistudio.google.com/apikey",
	minimax:
		"https://www.minimax.io/platform/user-center/basic-information/interface-key",
	openrouter: "https://openrouter.ai/keys",
};

export type IntegrationKind = "brapi" | UserAiProvider;

export const INTEGRATION_KINDS = [
	"brapi",
	...USER_CONFIGURABLE_AI_PROVIDERS,
] as const;
