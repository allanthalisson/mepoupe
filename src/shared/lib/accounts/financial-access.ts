import { and, eq, or, type SQL, sql } from "drizzle-orm";
import { accountShares, payers, transactions } from "@/db/schema";

export function buildFinancialAdminAccessFilter({
	userId,
	adminPayerId,
}: {
	userId: string;
	adminPayerId: string;
}): SQL {
	return or(
		and(
			eq(transactions.userId, userId),
			eq(transactions.payerId, adminPayerId),
		),
		sql`EXISTS (
			SELECT 1
			FROM ${accountShares}
			INNER JOIN ${payers}
				ON ${payers.id} = ${transactions.payerId}
				AND ${payers.role} = 'admin'
			WHERE ${accountShares.accountId} = ${transactions.accountId}
				AND ${accountShares.sharedWithUserId} = ${userId}
		)`,
	) as SQL;
}
