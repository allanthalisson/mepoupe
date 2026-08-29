import "server-only";

const BRAPI_BASE_URL = "https://brapi.dev/api/v2";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
	return value && typeof value === "object" ? (value as JsonRecord) : {};
}

function asNumber(value: unknown): number | null {
	if (value === null || value === undefined || value === "") return null;
	const number = typeof value === "number" ? value : Number(value);
	return Number.isFinite(number) ? number : null;
}

function firstResult(payload: unknown) {
	const record = asRecord(payload);
	const results = Array.isArray(record.results) ? record.results : [];
	return asRecord(results[0]);
}

async function brapiFetch(path: string, tokenOverride?: string | null) {
	const token = (tokenOverride || process.env.BRAPI_TOKEN)?.trim();
	const response = await fetch(`${BRAPI_BASE_URL}${path}`, {
		headers: token ? { Authorization: `Bearer ${token}` } : undefined,
		signal: AbortSignal.timeout(12_000),
		cache: "no-store",
	});
	if (!response.ok) throw new Error(`BRAPI_${response.status}`);
	return response.json() as Promise<unknown>;
}

export type MarketProviderData = {
	marketPrice: number | null;
	marketTime: Date | null;
	priceToEarnings: number | null;
	priceToBook: number | null;
	enterpriseToEbit: number | null;
	dividendYield: number | null;
	returnOnEquity: number | null;
	currentRatio: number | null;
	debtToEquity: number | null;
	revenueGrowth: number | null;
	profitMargin: number | null;
	vacancyRate: number | null;
	propertyCount: number | null;
	dailyLiquidity: number | null;
	fundamentalsAvailable: boolean;
	raw: JsonRecord;
};

export async function fetchBrapiMarketData(
	ticker: string,
	options: {
		includeFundamentals: boolean;
		includeFiiDetails?: boolean;
		tokenOverride?: string | null;
	},
): Promise<MarketProviderData> {
	const symbol = encodeURIComponent(ticker.trim().toUpperCase());
	const token = options.tokenOverride;
	const quotePayload = await brapiFetch(
		`/stocks/quote?symbols=${symbol}`,
		token,
	);
	const quote = firstResult(quotePayload);
	const quoteData = asRecord(quote.data);
	if (asNumber(quoteData.regularMarketPrice) === null) {
		throw new Error("BRAPI_EMPTY_QUOTE");
	}
	const quoteTimestamp = asNumber(quoteData.regularMarketTime);
	let statistics: JsonRecord = {};
	let financial: JsonRecord = {};
	let fiiIndicators: JsonRecord = {};
	let fiiProperties: JsonRecord = {};

	if (options.includeFundamentals) {
		const [statisticsResult, financialResult] = await Promise.allSettled([
			brapiFetch(`/stocks/statistics?symbols=${symbol}`, token),
			brapiFetch(`/stocks/financial-data?symbols=${symbol}`, token),
		]);
		if (statisticsResult.status === "fulfilled") {
			statistics = asRecord(firstResult(statisticsResult.value).data);
		}
		if (financialResult.status === "fulfilled") {
			financial = asRecord(firstResult(financialResult.value).data);
		}
	}
	if (options.includeFundamentals && options.includeFiiDetails) {
		const [indicatorResult, propertiesResult] = await Promise.allSettled([
			brapiFetch(`/fii/indicators?symbols=${symbol}`, token),
			brapiFetch(`/fii/properties?symbols=${symbol}`, token),
		]);
		if (indicatorResult.status === "fulfilled") {
			fiiIndicators = asRecord(firstResult(indicatorResult.value).data);
		}
		if (propertiesResult.status === "fulfilled") {
			fiiProperties = asRecord(firstResult(propertiesResult.value).data);
		}
	}
	const properties = Array.isArray(fiiProperties.properties)
		? fiiProperties.properties
		: Array.isArray(fiiProperties.items)
			? fiiProperties.items
			: [];
	const fundamentalsAvailable =
		Object.keys(statistics).length > 0 ||
		Object.keys(financial).length > 0 ||
		Object.keys(fiiIndicators).length > 0 ||
		Object.keys(fiiProperties).length > 0;

	return {
		marketPrice: asNumber(quoteData.regularMarketPrice),
		marketTime: quoteTimestamp ? new Date(quoteTimestamp * 1000) : null,
		priceToEarnings: asNumber(statistics.trailingPE),
		priceToBook: asNumber(statistics.priceToBook),
		// A brapi gratuita expõe EV/EBITDA, não EV/EBIT. Não substituímos
		// silenciosamente um indicador pelo outro.
		enterpriseToEbit: null,
		dividendYield: asNumber(statistics.dividendYield),
		returnOnEquity: asNumber(financial.returnOnEquity),
		currentRatio: asNumber(financial.currentRatio),
		debtToEquity: asNumber(financial.debtToEquity),
		revenueGrowth: asNumber(financial.revenueGrowthAnnual),
		profitMargin:
			asNumber(financial.profitMargins) ?? asNumber(statistics.profitMargins),
		vacancyRate:
			asNumber(fiiIndicators.vacancyRate) ??
			asNumber(fiiIndicators.physicalVacancy),
		propertyCount:
			asNumber(fiiIndicators.propertyCount) ??
			asNumber(fiiProperties.propertyCount) ??
			(properties.length > 0 ? properties.length : null),
		dailyLiquidity: asNumber(quoteData.regularMarketVolume),
		fundamentalsAvailable,
		raw: {
			quote: quoteData,
			statistics,
			financial,
			fiiIndicators,
			fiiProperties,
		},
	};
}
