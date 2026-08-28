import { eq, ilike, isNull, ne, not, or } from "drizzle-orm";
import { financialAccounts, transactions } from "@/db/schema";
import {
	ACCOUNT_AUTO_INVOICE_NOTE_PREFIX,
	INITIAL_BALANCE_NOTE,
	REFUND_NOTE_PREFIX,
} from "@/shared/lib/accounts/constants";
import { buildFinancialAdminAccessFilter } from "@/shared/lib/accounts/financial-access";

export { excludeTransactionsFromExcludedAccounts } from "@/shared/lib/accounts/query-filters";

type DashboardAdminFiltersParams = {
	userId: string;
	adminPayerId: string;
};

export const buildDashboardAdminFilters = ({
	userId,
	adminPayerId,
}: DashboardAdminFiltersParams) =>
	[buildFinancialAdminAccessFilter({ userId, adminPayerId })] as const;

export const excludeAutoInvoiceEntries = () =>
	or(
		isNull(transactions.note),
		not(ilike(transactions.note, `${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`)),
	);

export const excludeRefundEntries = () =>
	or(
		isNull(transactions.note),
		not(ilike(transactions.note, `${REFUND_NOTE_PREFIX}%`)),
	);

export const excludeInitialBalanceWhenConfigured = () =>
	or(
		isNull(transactions.note),
		ne(transactions.note, INITIAL_BALANCE_NOTE),
		isNull(financialAccounts.excludeInitialBalanceFromIncome),
		eq(financialAccounts.excludeInitialBalanceFromIncome, false),
	);
