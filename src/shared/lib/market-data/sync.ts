import "server-only";
import { and, eq } from "drizzle-orm";
import { investmentAssets, marketAssetSnapshots } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { fetchBrapiMarketData } from "./brapi";

const QUOTE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const FUNDAMENTALS_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const decimal = (value: number | null, scale = 6) =>
	value === null ? null : value.toFixed(scale);

export async function syncUserMarketData(userId: string, force = false) {
	const assets = await db
		.select()
		.from(investmentAssets)
		.where(eq(investmentAssets.userId, userId));
	let updated = 0;
	let skipped = 0;
	let failed = 0;

	for (const asset of assets) {
		if (
			!asset.ticker ||
			!["stocks", "reits", "international", "etfs"].includes(asset.assetClass)
		) {
			skipped += 1;
			continue;
		}
		const existing = await db.query.marketAssetSnapshots.findFirst({
			where: and(
				eq(marketAssetSnapshots.assetId, asset.id),
				eq(marketAssetSnapshots.userId, userId),
			),
		});
		const now = new Date();
		const quoteStale =
			!existing?.updatedAt ||
			now.getTime() - existing.updatedAt.getTime() >= QUOTE_MAX_AGE_MS;
		const fundamentalsStale =
			!existing?.fundamentalsUpdatedAt ||
			now.getTime() - existing.fundamentalsUpdatedAt.getTime() >=
				FUNDAMENTALS_MAX_AGE_MS;
		if (!force && !quoteStale && !fundamentalsStale) {
			skipped += 1;
			continue;
		}

		try {
			const includeFundamentals = force || fundamentalsStale;
			const data = await fetchBrapiMarketData(asset.ticker, {
				includeFundamentals,
				includeFiiDetails: asset.assetClass === "reits",
			});
			const values = {
				userId,
				assetId: asset.id,
				ticker: asset.ticker.trim().toUpperCase(),
				status:
					includeFundamentals && !data.fundamentalsAvailable
						? "partial"
						: "success",
				marketPrice: decimal(data.marketPrice, 4),
				dailyLiquidity: decimal(data.dailyLiquidity, 2),
				rawData:
					includeFundamentals || !existing?.rawData
						? data.raw
						: { ...existing.rawData, quote: data.raw.quote },
				quoteUpdatedAt: data.marketTime ?? now,
				fundamentalsUpdatedAt: includeFundamentals
					? now
					: existing?.fundamentalsUpdatedAt,
				lastError:
					includeFundamentals && !data.fundamentalsAvailable
						? "FUNDAMENTALS_UNAVAILABLE"
						: null,
				updatedAt: now,
				...(includeFundamentals
					? {
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
						}
					: {}),
			};
			await db.insert(marketAssetSnapshots).values(values).onConflictDoUpdate({
				target: marketAssetSnapshots.assetId,
				set: values,
			});
			if (data.marketPrice !== null) {
				await db
					.update(investmentAssets)
					.set({ currentPrice: data.marketPrice.toFixed(4), updatedAt: now })
					.where(
						and(
							eq(investmentAssets.id, asset.id),
							eq(investmentAssets.userId, userId),
						),
					);
			}
			updated += 1;
		} catch (error) {
			failed += 1;
			const safeError =
				error instanceof Error && error.message.startsWith("BRAPI_")
					? error.message
					: "MARKET_PROVIDER_UNAVAILABLE";
			await db
				.insert(marketAssetSnapshots)
				.values({
					userId,
					assetId: asset.id,
					ticker: asset.ticker.trim().toUpperCase(),
					status: "error",
					lastError: safeError,
					updatedAt: now,
				})
				.onConflictDoUpdate({
					target: marketAssetSnapshots.assetId,
					set: { status: "error", lastError: safeError, updatedAt: now },
				});
		}
	}

	return { assets: assets.length, updated, skipped, failed };
}
