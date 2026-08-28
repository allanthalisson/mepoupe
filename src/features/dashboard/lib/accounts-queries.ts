import { and, eq, or, sql } from "drizzle-orm";
import {
	accountShares,
	financialAccounts,
	payers,
	transactions,
} from "@/db/schema";
import {
	INITIAL_BALANCE_NOTE,
	isAccountInactive,
} from "@/shared/lib/accounts/constants";
import { db } from "@/shared/lib/db";
import { PAYER_ROLE_ADMIN } from "@/shared/lib/payers/constants";
import { safeToNumber as toNumber } from "@/shared/utils/number";

type RawDashboardAccount = {
	id: string;
	name: string;
	accountType: string;
	status: string;
	logo: string | null;
	initialBalance: string | number | null;
	balanceMovements: unknown;
};

export type DashboardAccount = {
	id: string;
	name: string;
	accountType: string;
	status: string;
	logo: string | null;
	initialBalance: number;
	balance: number;
	excludeFromBalance: boolean;
};

type DashboardAccountsSnapshot = {
	totalBalance: number;
	accounts: DashboardAccount[];
};

export async function fetchDashboardAccounts(
	userId: string,
): Promise<DashboardAccountsSnapshot> {
	const rows = await db
		.select({
			id: financialAccounts.id,
			name: financialAccounts.name,
			accountType: financialAccounts.accountType,
			status: financialAccounts.status,
			logo: financialAccounts.logo,
			initialBalance: financialAccounts.initialBalance,
			excludeFromBalance: financialAccounts.excludeFromBalance,
			balanceMovements: sql<number>`
        coalesce(
          sum(
				case
				  when ${payers.id} is null then 0
              when ${transactions.note} = ${INITIAL_BALANCE_NOTE} then 0
              else ${transactions.amount}
            end
          ),
          0
        )
      `,
		})
		.from(financialAccounts)
		.leftJoin(
			accountShares,
			and(
				eq(accountShares.accountId, financialAccounts.id),
				eq(accountShares.sharedWithUserId, userId),
			),
		)
		.leftJoin(
			transactions,
			and(
				eq(transactions.accountId, financialAccounts.id),
				eq(transactions.isSettled, true),
			),
		)
		.leftJoin(
			payers,
			and(
				eq(transactions.payerId, payers.id),
				eq(payers.role, PAYER_ROLE_ADMIN),
			),
		)
		.where(
			or(
				eq(financialAccounts.userId, userId),
				eq(accountShares.sharedWithUserId, userId),
			),
		)
		.groupBy(
			financialAccounts.id,
			financialAccounts.name,
			financialAccounts.accountType,
			financialAccounts.status,
			financialAccounts.logo,
			financialAccounts.initialBalance,
			financialAccounts.excludeFromBalance,
			accountShares.permission,
		);

	const accounts = rows
		.map(
			(
				row: RawDashboardAccount & { excludeFromBalance: boolean },
			): DashboardAccount => {
				const initialBalance = toNumber(row.initialBalance);
				const balanceMovements = toNumber(row.balanceMovements);

				return {
					id: row.id,
					name: row.name,
					accountType: row.accountType,
					status: row.status,
					logo: row.logo,
					initialBalance,
					balance: initialBalance + balanceMovements,
					excludeFromBalance: row.excludeFromBalance,
				};
			},
		)
		.sort((a, b) => b.balance - a.balance);

	const totalBalance = accounts
		.filter(
			(account) =>
				!account.excludeFromBalance && !isAccountInactive(account.status),
		)
		.reduce((total, account) => total + account.balance, 0);

	return {
		totalBalance,
		accounts,
	};
}
