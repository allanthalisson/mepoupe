"use server";

import { and, eq, ilike } from "drizzle-orm";
import { z } from "zod";
import { accountShares, financialAccounts, user as users } from "@/db/schema";
import {
	type ActionResult,
	handleActionError,
	revalidateForEntity,
} from "@/shared/lib/actions/helpers";
import { getUser } from "@/shared/lib/auth/server";
import { db } from "@/shared/lib/db";
import { uuidSchema } from "@/shared/lib/schemas/common";

const shareSchema = z.object({
	accountId: uuidSchema("Conta"),
	email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
	permission: z.enum(["read", "write"]),
});

const removeShareSchema = z.object({
	shareId: uuidSchema("Compartilhamento"),
});

export type AccountShareData = {
	id: string;
	userId: string;
	name: string;
	email: string;
	permission: "read" | "write";
};

export async function fetchAccountSharesAction(
	accountId: string,
): Promise<
	| { success: true; shares: AccountShareData[] }
	| { success: false; error: string }
> {
	try {
		const currentUser = await getUser();
		const parsedAccountId = uuidSchema("Conta").parse(accountId);
		const account = await db.query.financialAccounts.findFirst({
			columns: { id: true },
			where: and(
				eq(financialAccounts.id, parsedAccountId),
				eq(financialAccounts.userId, currentUser.id),
			),
		});
		if (!account) return { success: false, error: "Conta não encontrada." };

		const rows = await db
			.select({
				id: accountShares.id,
				userId: users.id,
				name: users.name,
				email: users.email,
				permission: accountShares.permission,
			})
			.from(accountShares)
			.innerJoin(users, eq(accountShares.sharedWithUserId, users.id))
			.where(eq(accountShares.accountId, parsedAccountId));

		return {
			success: true,
			shares: rows.map((row) => ({
				...row,
				permission: row.permission === "write" ? "write" : "read",
			})),
		};
	} catch (error) {
		console.error("Falha ao buscar compartilhamentos da conta:", error);
		return { success: false, error: "Não foi possível carregar os acessos." };
	}
}

export async function shareAccountAction(
	input: z.input<typeof shareSchema>,
): Promise<ActionResult> {
	try {
		const currentUser = await getUser();
		const data = shareSchema.parse(input);
		const [account, targetUser] = await Promise.all([
			db.query.financialAccounts.findFirst({
				columns: { id: true },
				where: and(
					eq(financialAccounts.id, data.accountId),
					eq(financialAccounts.userId, currentUser.id),
				),
			}),
			db.query.user.findFirst({
				columns: { id: true },
				where: ilike(users.email, data.email),
			}),
		]);

		if (!account) return { success: false, error: "Conta não encontrada." };
		if (!targetUser) {
			return {
				success: false,
				error: "Essa pessoa precisa criar uma conta no aplicativo primeiro.",
			};
		}
		if (targetUser.id === currentUser.id) {
			return { success: false, error: "A conta já pertence a você." };
		}

		await db
			.insert(accountShares)
			.values({
				accountId: data.accountId,
				sharedWithUserId: targetUser.id,
				permission: data.permission,
				createdByUserId: currentUser.id,
			})
			.onConflictDoUpdate({
				target: [accountShares.accountId, accountShares.sharedWithUserId],
				set: { permission: data.permission },
			});

		revalidateForEntity("accounts", currentUser.id);
		revalidateForEntity("accounts", targetUser.id);
		return { success: true, message: "Acesso à conta atualizado." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function removeAccountShareAction(
	input: z.input<typeof removeShareSchema>,
): Promise<ActionResult> {
	try {
		const currentUser = await getUser();
		const data = removeShareSchema.parse(input);
		const [share] = await db
			.select({
				id: accountShares.id,
				sharedWithUserId: accountShares.sharedWithUserId,
			})
			.from(accountShares)
			.innerJoin(
				financialAccounts,
				and(
					eq(accountShares.accountId, financialAccounts.id),
					eq(financialAccounts.userId, currentUser.id),
				),
			)
			.where(eq(accountShares.id, data.shareId));

		if (!share) {
			return { success: false, error: "Compartilhamento não encontrado." };
		}

		await db.delete(accountShares).where(eq(accountShares.id, share.id));
		revalidateForEntity("accounts", currentUser.id);
		revalidateForEntity("accounts", share.sharedWithUserId);
		return { success: true, message: "Acesso removido." };
	} catch (error) {
		return handleActionError(error);
	}
}
