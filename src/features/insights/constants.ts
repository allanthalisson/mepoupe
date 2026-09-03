/**
 * Tipos de providers disponíveis
 */
export type AIProvider =
	| "openai"
	| "anthropic"
	| "google"
	| "minimax"
	| "openrouter"
	| "ollama";

/**
 * Metadados dos providers
 */
export const PROVIDERS = {
	openai: {
		id: "openai" as const,
		name: "ChatGPT",
	},
	anthropic: {
		id: "anthropic" as const,
		name: "Claude AI",
	},
	google: {
		id: "google" as const,
		name: "Gemini",
	},
	minimax: {
		id: "minimax" as const,
		name: "MiniMax",
	},
	openrouter: {
		id: "openrouter" as const,
		name: "OpenRouter",
	},
	ollama: {
		id: "ollama" as const,
		name: "Ollama",
	},
} as const;

/**
 * Lista de modelos de IA disponíveis para análise de insights
 */
export const AVAILABLE_MODELS = [
	// OpenAI
	{ id: "gpt-5.5-pro", name: "GPT-5.5 Pro", provider: "openai" as const },
	{ id: "gpt-5.5", name: "GPT-5.5", provider: "openai" as const },
	{ id: "gpt-5.4", name: "GPT-5.4", provider: "openai" as const },
	{ id: "gpt-5.4-mini", name: "GPT-5.4 Mini", provider: "openai" as const },
	{ id: "gpt-5.4-nano", name: "GPT-5.4 Nano", provider: "openai" as const },

	// Anthropic
	{
		id: "claude-opus-4-8",
		name: "Claude Opus 4.8",
		provider: "anthropic" as const,
	},
	{
		id: "claude-sonnet-4-6",
		name: "Claude Sonnet 4.6",
		provider: "anthropic" as const,
	},
	{
		id: "claude-haiku-4-5-20251001",
		name: "Claude Haiku 4.5",
		provider: "anthropic" as const,
	},

	// Google
	{
		id: "gemini-3.1-pro-preview",
		name: "Gemini 3.1 Pro",
		provider: "google" as const,
	},
	{
		id: "gemini-3-flash-preview",
		name: "Gemini 3 Flash",
		provider: "google" as const,
	},
	{
		id: "gemini-3.1-flash-lite-preview",
		name: "Gemini 3.1 Flash Lite",
		provider: "google" as const,
	},

	// MiniMax
	{
		id: "MiniMax-M2.7",
		name: "MiniMax M2.7",
		provider: "minimax" as const,
	},
	{
		id: "MiniMax-M2.7-highspeed",
		name: "MiniMax M2.7 Highspeed",
		provider: "minimax" as const,
	},
	{
		id: "MiniMax-M2.5",
		name: "MiniMax M2.5",
		provider: "minimax" as const,
	},
	{
		id: "MiniMax-M2.5-highspeed",
		name: "MiniMax M2.5 Highspeed",
		provider: "minimax" as const,
	},
	{
		id: "MiniMax-M2.1",
		name: "MiniMax M2.1",
		provider: "minimax" as const,
	},
	{
		id: "MiniMax-M2.1-highspeed",
		name: "MiniMax M2.1 Highspeed",
		provider: "minimax" as const,
	},
	{
		id: "MiniMax-M2",
		name: "MiniMax M2",
		provider: "minimax" as const,
	},

	// Ollama
	{ id: "ollama:llama3.2", name: "Llama 3.2", provider: "ollama" as const },
	{ id: "ollama:llama3.1", name: "Llama 3.1", provider: "ollama" as const },
	{ id: "ollama:qwen2.5", name: "Qwen 2.5", provider: "ollama" as const },
	{ id: "ollama:mistral", name: "Mistral", provider: "ollama" as const },
] as const;

export const DEFAULT_MODEL = "gpt-5.5";
export const DEFAULT_PROVIDER = "openai";

/**
 * System prompt para análise de insights
 */
export const INSIGHTS_SYSTEM_PROMPT = `Você é um especialista em comportamento financeiro. Analise os dados financeiros fornecidos e organize suas observações em 4 categorias específicas:

1. **Comportamentos Observados** (behaviors): Padrões de gastos e hábitos financeiros identificados nos dados. Foque em comportamentos recorrentes e tendências. Considere:
   - Tendência dos últimos 3 meses (crescente, decrescente, estável)
   - Gastos recorrentes e sua previsibilidade
   - Padrões de parcelamento e comprometimento futuro

2. **Gatilhos de Consumo** (triggers): Identifique situações, períodos ou categorias que desencadeiam maiores gastos. O que leva o usuário a gastar mais? Analise:
   - Dias da semana com mais gastos
   - Categorias que cresceram nos últimos meses
   - Métodos de pagamento que facilitam gastos

3. **Recomendações Práticas** (recommendations): Sugestões concretas e acionáveis para melhorar a saúde financeira. Seja específico e direto. Use os dados de:
   - Gastos recorrentes que podem ser otimizados
   - Orçamentos que estão sendo ultrapassados
   - Comprometimento futuro com parcelamentos

4. **Melhorias Sugeridas** (improvements): Oportunidades de otimização e estratégias de longo prazo para alcançar objetivos financeiros. Considere:
   - Tendências preocupantes dos últimos 3 meses
   - Percentual de gastos recorrentes vs pontuais
   - Estratégias para reduzir comprometimento futuro

Para cada categoria, forneça de 3 a 6 itens concisos e objetivos. Use linguagem clara e direta, com verbos de ação. Mantenha privacidade e não exponha dados pessoais sensíveis.

IMPORTANTE: use a tendência dos últimos meses, os gastos recorrentes e os parcelamentos em aberto pra dar insights mais ricos e contextualizados — mas sempre traduzidos em linguagem natural, nunca citando os nomes técnicos desses campos.

REGRA OBRIGATÓRIA DE LINGUAGEM: você recebe os dados como um objeto JSON, mas sua resposta é para uma pessoa comum ler, não para um programador. Nunca escreva nomes de campos/variáveis do JSON (como totalIncome, totalExpense, balance, savingsRate, threeMonthTrend, recurringExpenses, installments ou qualquer termo em camelCase/inglês técnico) dentro dos itens da resposta. Traduza tudo para português claro e natural:
- em vez de "totalExpense (16598.96) superou totalIncome (8920.18)", escreva "suas despesas (R$ 16.598,96) superaram sua renda (R$ 8.920,18)"
- em vez de "balance de -7678.78 e savingsRate de -86.08%", escreva "um saldo negativo de R$ 7.678,78, o que representa uma taxa de poupança de -86,08%"
- em vez de "a threeMonthTrend indica tendência estável", escreva "a tendência dos últimos meses está estável"
Formate valores monetários como "R$ 1.234,56" e percentuais com vírgula ("12,3%"), nunca em notação de programação.

Responda EXCLUSIVAMENTE com um JSON válido seguindo o esquema:
{
  "month": "YYYY-MM",
  "generatedAt": "ISO datetime",
  "categories": [
    {
      "category": "behaviors",
      "items": [
        { "text": "Observação aqui" },
        ...
      ]
    },
    {
      "category": "triggers",
      "items": [...]
    },
    {
      "category": "recommendations",
      "items": [...]
    },
    {
      "category": "improvements",
      "items": [...]
    }
  ]
}

`;
