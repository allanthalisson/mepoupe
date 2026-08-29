import "server-only";
import { investmentCandidates } from "@/db/schema";
import { screenFundamentals } from "@/features/investments/lib/fundamental-screening";
import { db } from "@/shared/lib/db";
import { fetchBrapiMarketData, fetchBrapiTickerList } from "./brapi";

// Universo de candidatos: os mais líquidos de cada classe, não o mercado
// inteiro — a própria brapi gratuita não sustentaria isso (cada candidato
// custa 2-3 chamadas de fundamentos), e é como as aulas descrevem o
// processo: uma lista curada, revisitada periodicamente, não uma varredura
// de todo o mercado.
const STOCK_CANDIDATE_LIMIT = 40;
const REIT_CANDIDATE_LIMIT = 30;
const SYNC_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const decimal = (value: number | null, scale = 6) =>
	value === null ? null : value.toFixed(scale);

async function syncOne(
	ticker: string,
	name: string,
	assetClass: "stocks" | "reits",
	token: string | undefined,
) {
	const now = new Date();
	try {
		const data = await fetchBrapiMarketData(ticker, {
			includeFundamentals: true,
			includeFiiDetails: assetClass === "reits",
			tokenOverride: token,
		});
		const values = {
			ticker,
			name,
			assetClass,
			currentPrice: decimal(data.marketPrice, 4),
			priceToEarnings: decimal(data.priceToEarnings),
			priceToBook: decimal(data.priceToBook),
			enterpriseToEbit: decimal(data.enterpriseToEbit),
			dividendYield: decimal(data.dividendYield),
			returnOnEquity: decimal(data.returnOnEquity),
			currentRatio: decimal(data.currentRatio),
			debtToEquity: decimal(data.debtToEquity),
			revenueGrowth: decimal(data.revenueGrowth),
			profitMargin: decimal(data.profitMargin),
			vacancyRate: decimal(data.vacancyRate),
			propertyCount: data.propertyCount,
			dailyLiquidity: decimal(data.dailyLiquidity, 2),
			lastError: data.fundamentalsAvailable ? null : "FUNDAMENTALS_UNAVAILABLE",
			lastSyncedAt: now,
		};
		await db.insert(investmentCandidates).values(values).onConflictDoUpdate({
			target: investmentCandidates.ticker,
			set: values,
		});
		return true;
	} catch (error) {
		const safeError =
			error instanceof Error && error.message.startsWith("BRAPI_")
				? error.message
				: "MARKET_PROVIDER_UNAVAILABLE";
		await db
			.insert(investmentCandidates)
			.values({
				ticker,
				name,
				assetClass,
				lastError: safeError,
				lastSyncedAt: now,
			})
			.onConflictDoUpdate({
				target: investmentCandidates.ticker,
				set: { lastError: safeError, lastSyncedAt: now },
			});
		return false;
	}
}

/**
 * Atualiza o universo de candidatos de ações/FIIs para as sugestões de
 * investimento. Compartilhado entre todos os usuários (não depende de
 * nenhuma carteira específica), mas precisa de UM token da brapi pra
 * rodar — o do host (BRAPI_TOKEN) ou, na falta dele, o de quem disparou a
 * sincronização (ex.: clicando em "Atualizar preços"), já que em um app
 * self-hosted é comum só o usuário ter configurado a própria chave em
 * Integrações. Não faz nada sem nenhum token, ou se a última
 * sincronização foi há menos de 24h.
 */
export async function syncInvestmentCandidates(
	tokenOverride?: string | null,
	force = false,
) {
	const token = tokenOverride || process.env.BRAPI_TOKEN;
	if (!token) return { synced: 0, skipped: true as const };

	if (!force) {
		const [mostRecent] = await db
			.select({ lastSyncedAt: investmentCandidates.lastSyncedAt })
			.from(investmentCandidates)
			.orderBy(investmentCandidates.lastSyncedAt)
			.limit(1);
		if (
			mostRecent &&
			Date.now() - mostRecent.lastSyncedAt.getTime() < SYNC_MAX_AGE_MS
		) {
			return { synced: 0, skipped: true as const };
		}
	}

	const [stockList, reitList] = await Promise.allSettled([
		fetchBrapiTickerList("stock", STOCK_CANDIDATE_LIMIT, token),
		fetchBrapiTickerList("fund", REIT_CANDIDATE_LIMIT, token),
	]);

	const candidates: {
		ticker: string;
		name: string;
		assetClass: "stocks" | "reits";
	}[] = [];
	if (stockList.status === "fulfilled") {
		for (const item of stockList.value) {
			candidates.push({
				ticker: item.ticker,
				name: item.name,
				assetClass: "stocks",
			});
		}
	}
	if (reitList.status === "fulfilled") {
		for (const item of reitList.value) {
			candidates.push({
				ticker: item.ticker,
				name: item.name,
				assetClass: "reits",
			});
		}
	}

	let synced = 0;
	for (const candidate of candidates) {
		const ok = await syncOne(
			candidate.ticker,
			candidate.name,
			candidate.assetClass,
			token,
		);
		if (ok) synced += 1;
		// A brapi limita requisições por minuto no plano gratuito; um pequeno
		// espaçamento entre candidatos evita rajada de 429 que marcaria a
		// maioria como erro (e some da lista de sugestões).
		await new Promise((resolve) => setTimeout(resolve, 350));
	}

	return { synced, skipped: false as const, total: candidates.length };
}

/**
 * Triagem persistida de cada candidato, pronta pro motor de sugestões
 * consumir sem bater na brapi de novo.
 */
export async function fetchScreenedCandidates() {
	const rows = await db.select().from(investmentCandidates);
	return rows.map((row) => {
		const fundamentalData = {
			priceToEarnings:
				row.priceToEarnings === null ? null : Number(row.priceToEarnings),
			priceToBook: row.priceToBook === null ? null : Number(row.priceToBook),
			enterpriseToEbit:
				row.enterpriseToEbit === null ? null : Number(row.enterpriseToEbit),
			dividendYield:
				row.dividendYield === null ? null : Number(row.dividendYield),
			returnOnEquity:
				row.returnOnEquity === null ? null : Number(row.returnOnEquity),
			currentRatio: row.currentRatio === null ? null : Number(row.currentRatio),
			debtToEquity: row.debtToEquity === null ? null : Number(row.debtToEquity),
			revenueGrowth:
				row.revenueGrowth === null ? null : Number(row.revenueGrowth),
			profitMargin: row.profitMargin === null ? null : Number(row.profitMargin),
			vacancyRate: row.vacancyRate === null ? null : Number(row.vacancyRate),
			propertyCount: row.propertyCount,
			dailyLiquidity:
				row.dailyLiquidity === null ? null : Number(row.dailyLiquidity),
		};
		return {
			ticker: row.ticker,
			name: row.name,
			assetClass: row.assetClass,
			currentPrice: row.currentPrice === null ? null : Number(row.currentPrice),
			lastSyncedAt: row.lastSyncedAt.toISOString(),
			hasError: row.lastError !== null,
			screening: screenFundamentals(row.assetClass, fundamentalData),
		};
	});
}
