/**
 * Utility functions for safe number conversions and formatting
 */

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Safely converts unknown value to number
 * @param value - Value to convert
 * @param defaultValue - Default value if conversion fails
 * @returns Converted number or default value
 */
export function safeToNumber(value: unknown, defaultValue: number = 0): number {
	if (typeof value === "number") {
		return value;
	}

	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isNaN(parsed) ? defaultValue : parsed;
	}

	if (value === null || value === undefined) {
		return defaultValue;
	}

	const parsed = Number(value);
	return Number.isNaN(parsed) ? defaultValue : parsed;
}

export const roundMoney = (value: number) => Math.round(value * 100) / 100;
export const roundPercentage = (value: number) => Math.round(value * 10) / 10;

/**
 * Taxa de poupança: (receita - despesa) / receita, em %. `null` sem receita
 * (não dá pra calcular uma taxa sensata contra base zero).
 */
export const savingsRate = (income: number, expenses: number) =>
	income > 0 ? roundPercentage(((income - expenses) / income) * 100) : null;
