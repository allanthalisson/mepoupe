/**
 * Resumo financeiro de um período — a agregação mais barata e mais pedida
 * (dashboard, Assistente). Deliberadamente não reaproveita
 * `buildFinancialDiagnosis`: aquele cálculo também monta oportunidades de
 * economia por estabelecimento/categoria, caro demais pra uma pergunta como
 * "quanto eu ganhei/gastei este mês".
 */
import { and, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { transactions } from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/shared/lib/accounts/constants";
import { buildFinancialAdminAccessFilter } from "@/shared/lib/accounts/financial-access";
import { excludeTransactionsFromExcludedAccounts } from "@/shared/lib/accounts/query-filters";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import { roundMoney, savingsRate } from "@/shared/utils/number";

export type FinancialSummary = {
	period: string;
	income: number;
	expenses: number;
	balance: number;
	savingsRate: number | null;
};

/** Parte pura, testável sem banco. */
export function buildFinancialSummary(
	period: string,
	income: number,
	expenses: number,
): FinancialSummary {
	return {
		period,
		income: roundMoney(income),
		expenses: roundMoney(expenses),
		balance: roundMoney(income - expenses),
		savingsRate: savingsRate(income, expenses),
	};
}

/**
 * Resumo (receita/despesa/saldo/taxa de poupança) de um único período ou de
 * um intervalo contínuo de períodos, já consolidado.
 */
export async function getFinancialSummary(
	userId: string,
	periodStart: string,
	periodEnd: string = periodStart,
): Promise<FinancialSummary> {
	const adminPayerId = await getAdminPayerId(userId);
	if (!adminPayerId) {
		return buildFinancialSummary(periodEnd, 0, 0);
	}

	const rows = await db
		.select({
			transactionType: transactions.transactionType,
			amount: transactions.amount,
		})
		.from(transactions)
		.where(
			and(
				buildFinancialAdminAccessFilter({ userId, adminPayerId }),
				gte(transactions.period, periodStart),
				lte(transactions.period, periodEnd),
				inArray(transactions.transactionType, ["Receita", "Despesa"]),
				or(
					isNull(transactions.note),
					sql`${transactions.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
				),
				excludeTransactionsFromExcludedAccounts(),
			),
		);

	let income = 0;
	let expenses = 0;
	for (const row of rows) {
		const amount = Math.abs(Number(row.amount));
		if (row.transactionType === "Receita") income += amount;
		else expenses += amount;
	}

	const periodLabel =
		periodStart === periodEnd ? periodEnd : `${periodStart}:${periodEnd}`;
	return buildFinancialSummary(periodLabel, income, expenses);
}

/**
 * Fluxo de caixa período a período (um resumo por mês, em vez de
 * consolidado) — útil pra "como minha taxa de poupança evoluiu".
 */
export async function getMonthlyCashFlow(
	userId: string,
	periods: string[],
): Promise<FinancialSummary[]> {
	if (periods.length === 0) return [];

	const adminPayerId = await getAdminPayerId(userId);
	if (!adminPayerId) {
		return periods.map((period) => buildFinancialSummary(period, 0, 0));
	}

	const rows = await db
		.select({
			period: transactions.period,
			transactionType: transactions.transactionType,
			amount: transactions.amount,
		})
		.from(transactions)
		.where(
			and(
				buildFinancialAdminAccessFilter({ userId, adminPayerId }),
				inArray(transactions.period, periods),
				inArray(transactions.transactionType, ["Receita", "Despesa"]),
				or(
					isNull(transactions.note),
					sql`${transactions.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
				),
				excludeTransactionsFromExcludedAccounts(),
			),
		);

	const byPeriod = new Map(
		periods.map((period) => [period, { income: 0, expenses: 0 }]),
	);
	for (const row of rows) {
		const bucket = byPeriod.get(row.period);
		if (!bucket) continue;
		const amount = Math.abs(Number(row.amount));
		if (row.transactionType === "Receita") bucket.income += amount;
		else bucket.expenses += amount;
	}

	return periods.map((period) => {
		const bucket = byPeriod.get(period) ?? { income: 0, expenses: 0 };
		return buildFinancialSummary(period, bucket.income, bucket.expenses);
	});
}
