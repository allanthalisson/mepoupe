import { and, eq, ilike, not, or, sql } from "drizzle-orm";
import {
	accountShares,
	financialAccounts,
	payers,
	transactions,
} from "@/db/schema";
import { INITIAL_BALANCE_NOTE } from "@/shared/lib/accounts/constants";
import { db } from "@/shared/lib/db";
import { loadLogoOptions } from "@/shared/lib/logo/options";
import { PAYER_ROLE_ADMIN } from "@/shared/lib/payers/constants";

export type AccountData = {
	id: string;
	name: string;
	accountType: string;
	status: string;
	note: string | null;
	logo: string | null;
	initialBalance: number;
	balance: number;
	excludeFromBalance: boolean;
	excludeInitialBalanceFromIncome: boolean;
	ownerUserId: string;
	accessLevel: "owner" | "read" | "write";
	canEdit: boolean;
	canWrite: boolean;
};

async function fetchAccountsByStatus(
	userId: string,
	archived: boolean,
): Promise<{ accounts: AccountData[]; logoOptions: string[] }> {
	const [accountRows, logoOptions] = await Promise.all([
		db
			.select({
				id: financialAccounts.id,
				name: financialAccounts.name,
				accountType: financialAccounts.accountType,
				status: financialAccounts.status,
				note: financialAccounts.note,
				logo: financialAccounts.logo,
				initialBalance: financialAccounts.initialBalance,
				excludeFromBalance: financialAccounts.excludeFromBalance,
				excludeInitialBalanceFromIncome:
					financialAccounts.excludeInitialBalanceFromIncome,
				ownerUserId: financialAccounts.userId,
				sharedPermission: accountShares.permission,
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
				and(
					or(
						eq(financialAccounts.userId, userId),
						eq(accountShares.sharedWithUserId, userId),
					),
					archived
						? ilike(financialAccounts.status, "inativa")
						: not(ilike(financialAccounts.status, "inativa")),
				),
			)
			.groupBy(
				financialAccounts.id,
				financialAccounts.name,
				financialAccounts.accountType,
				financialAccounts.status,
				financialAccounts.note,
				financialAccounts.logo,
				financialAccounts.initialBalance,
				financialAccounts.excludeFromBalance,
				financialAccounts.excludeInitialBalanceFromIncome,
				financialAccounts.userId,
				accountShares.permission,
			),
		loadLogoOptions(),
	]);

	const accounts = accountRows.map((account) => ({
		id: account.id,
		name: account.name,
		accountType: account.accountType,
		status: account.status,
		note: account.note,
		logo: account.logo,
		initialBalance: Number(account.initialBalance ?? 0),
		balance:
			Number(account.initialBalance ?? 0) +
			Number(account.balanceMovements ?? 0),
		excludeFromBalance: account.excludeFromBalance,
		excludeInitialBalanceFromIncome: account.excludeInitialBalanceFromIncome,
		ownerUserId: account.ownerUserId,
		accessLevel:
			account.ownerUserId === userId
				? ("owner" as const)
				: account.sharedPermission === "write"
					? ("write" as const)
					: ("read" as const),
		canEdit: account.ownerUserId === userId,
		canWrite:
			account.ownerUserId === userId || account.sharedPermission === "write",
	}));

	return { accounts, logoOptions };
}

async function fetchAccountsForUser(
	userId: string,
): Promise<{ accounts: AccountData[]; logoOptions: string[] }> {
	return fetchAccountsByStatus(userId, false);
}

async function fetchInactiveForUser(
	userId: string,
): Promise<{ accounts: AccountData[]; logoOptions: string[] }> {
	return fetchAccountsByStatus(userId, true);
}

export async function fetchAllAccountsForUser(userId: string): Promise<{
	activeAccounts: AccountData[];
	archivedAccounts: AccountData[];
	logoOptions: string[];
}> {
	const [activeData, archivedData] = await Promise.all([
		fetchAccountsForUser(userId),
		fetchInactiveForUser(userId),
	]);

	return {
		activeAccounts: activeData.accounts,
		archivedAccounts: archivedData.accounts,
		logoOptions: activeData.logoOptions,
	};
}
