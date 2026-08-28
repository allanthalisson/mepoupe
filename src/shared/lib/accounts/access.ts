import { and, eq, inArray, or } from "drizzle-orm";
import { accountShares, financialAccounts } from "@/db/schema";
import { db } from "@/shared/lib/db";

export type AccountPermission = "owner" | "read" | "write";

const normalizeIds = (ids: Array<string | null | undefined>) => [
	...new Set(ids.filter((id): id is string => Boolean(id))),
];

export async function getAccountAccess(userId: string, accountId: string) {
	const [row] = await db
		.select({
			accountId: financialAccounts.id,
			ownerUserId: financialAccounts.userId,
			sharedPermission: accountShares.permission,
		})
		.from(financialAccounts)
		.leftJoin(
			accountShares,
			and(
				eq(accountShares.accountId, financialAccounts.id),
				eq(accountShares.sharedWithUserId, userId),
			),
		)
		.where(
			and(
				eq(financialAccounts.id, accountId),
				or(
					eq(financialAccounts.userId, userId),
					eq(accountShares.sharedWithUserId, userId),
				),
			),
		)
		.limit(1);

	if (!row) return null;
	const permission: AccountPermission =
		row.ownerUserId === userId
			? "owner"
			: row.sharedPermission === "write"
				? "write"
				: "read";

	return {
		accountId: row.accountId,
		ownerUserId: row.ownerUserId,
		permission,
		canWrite: permission === "owner" || permission === "write",
		isOwner: permission === "owner",
	};
}

export async function fetchAccessibleAccountIds(
	userId: string,
	accountIds: Array<string | null | undefined>,
	requireWrite = false,
): Promise<Set<string>> {
	const ids = normalizeIds(accountIds);
	if (ids.length === 0) return new Set();

	const accessCondition = requireWrite
		? or(
				eq(financialAccounts.userId, userId),
				and(
					eq(accountShares.sharedWithUserId, userId),
					eq(accountShares.permission, "write"),
				),
			)
		: or(
				eq(financialAccounts.userId, userId),
				eq(accountShares.sharedWithUserId, userId),
			);

	const rows = await db
		.select({ id: financialAccounts.id })
		.from(financialAccounts)
		.leftJoin(
			accountShares,
			and(
				eq(accountShares.accountId, financialAccounts.id),
				eq(accountShares.sharedWithUserId, userId),
			),
		)
		.where(and(inArray(financialAccounts.id, ids), accessCondition));

	return new Set(rows.map((row) => row.id));
}
