import { and, eq } from "drizzle-orm";
import { cache } from "react";
import { payers } from "@/db/schema";
import { db } from "@/shared/lib/db";
import { PAYER_ROLE_ADMIN } from "@/shared/lib/payers/constants";

/**
 * Returns the admin pagador ID for a user (cached per request via React.cache).
 * Eliminates the need for JOIN with payers in ~20 dashboard queries.
 */
export const getAdminPayerId = cache(
	async (userId: string): Promise<string | null> => {
		const [row] = await db
			.select({ id: payers.id })
			.from(payers)
			.where(and(eq(payers.userId, userId), eq(payers.role, PAYER_ROLE_ADMIN)))
			.limit(1);
		return row?.id ?? null;
	},
);
