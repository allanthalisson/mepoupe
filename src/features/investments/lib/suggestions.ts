import type { CourseAssetClass, CoursePortfolioMap } from "./course-method";
import type { screenFundamentals } from "./fundamental-screening";

export type SuggestionScreening = ReturnType<typeof screenFundamentals>;

export type SuggestionCandidate = {
	ticker: string;
	name: string;
	assetClass: string;
	currentPrice: number | null;
	hasError: boolean;
	screening: SuggestionScreening;
};

export type InvestmentSuggestion = {
	ticker: string;
	name: string;
	assetClass: CourseAssetClass;
	currentPrice: number | null;
	screeningStatus: "approved" | "attention";
	passed: number;
	available: number;
	alreadyOwned: boolean;
	suggestedContribution: number;
};

// Só ações e FIIs têm um universo de candidatos com triagem fundamentalista
// nesse método — renda fixa e exterior não são "escolha de ativo individual"
// da mesma forma.
const SCREENABLE_CLASSES: CourseAssetClass[] = ["stocks", "reits"];
const MAX_SUGGESTIONS_PER_CLASS = 3;
// Mesmo teto de concentração citado nas aulas: acima disso, o ativo já não
// deveria receber mais aporte, mesmo que continue passando na triagem.
const MAX_CONCENTRATION_PERCENT = 10;

function round(value: number, precision = 2) {
	const factor = 10 ** precision;
	return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Cruza o mapa de carteira do método (aporte sugerido por classe) com o
 * universo de candidatos já triados, pra sugerir tickers concretos e como
 * dividir o aporte do mês entre eles. Só sugere ações/FIIs que:
 * - são da classe que o método já pediu reforço (contribution > 0);
 * - passam na triagem (aprovado ou ao menos em atenção, nunca "insuficiente");
 * - não foram dispensados explicitamente pelo usuário;
 * - não estão concentrados acima do teto das aulas na carteira atual.
 */
export function buildInvestmentSuggestions(
	courseMap: CoursePortfolioMap,
	candidates: SuggestionCandidate[],
	ownedTickers: Set<string>,
	concentrationByTicker: Map<string, number>,
	dismissedTickers: Set<string>,
): InvestmentSuggestion[] {
	if (courseMap.status !== "ready") return [];

	const suggestions: InvestmentSuggestion[] = [];

	for (const assetClass of SCREENABLE_CLASSES) {
		const classInfo = courseMap.classes.find(
			(item) => item.assetClass === assetClass,
		);
		if (!classInfo || classInfo.contribution <= 0) continue;

		const eligible = candidates
			.filter((candidate) => candidate.assetClass === assetClass)
			.filter((candidate) => !candidate.hasError && candidate.screening)
			.filter((candidate) => candidate.screening?.status !== "insufficient")
			.filter(
				(candidate) => !dismissedTickers.has(candidate.ticker.toUpperCase()),
			)
			.filter((candidate) => {
				const concentration =
					concentrationByTicker.get(candidate.ticker.toUpperCase()) ?? 0;
				return concentration < MAX_CONCENTRATION_PERCENT;
			})
			.sort((a, b) => {
				// Aprovado antes de atenção; depois, maior cobertura de
				// métricas disponíveis passando; depois, prioriza diversificar
				// (ativo que o usuário ainda não tem) sobre reforçar um já
				// existente; por fim, ordem alfabética como desempate estável.
				const statusRank = (s: SuggestionScreening) =>
					s?.status === "approved" ? 0 : 1;
				const rankDiff = statusRank(a.screening) - statusRank(b.screening);
				if (rankDiff !== 0) return rankDiff;

				const scoreA = a.screening
					? a.screening.passed / a.screening.available
					: 0;
				const scoreB = b.screening
					? b.screening.passed / b.screening.available
					: 0;
				if (scoreB !== scoreA) return scoreB - scoreA;

				const ownedA = ownedTickers.has(a.ticker.toUpperCase()) ? 1 : 0;
				const ownedB = ownedTickers.has(b.ticker.toUpperCase()) ? 1 : 0;
				if (ownedA !== ownedB) return ownedA - ownedB;

				return a.ticker.localeCompare(b.ticker);
			})
			.slice(0, MAX_SUGGESTIONS_PER_CLASS);

		if (eligible.length === 0) continue;

		const perTicker = round(classInfo.contribution / eligible.length);
		for (const candidate of eligible) {
			if (!candidate.screening) continue;
			suggestions.push({
				ticker: candidate.ticker,
				name: candidate.name,
				assetClass,
				currentPrice: candidate.currentPrice,
				screeningStatus: candidate.screening.status as "approved" | "attention",
				passed: candidate.screening.passed,
				available: candidate.screening.available,
				alreadyOwned: ownedTickers.has(candidate.ticker.toUpperCase()),
				suggestedContribution: perTicker,
			});
		}
	}

	return suggestions;
}
