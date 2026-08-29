"use server";

import {
	type ActionResult,
	handleActionError,
	revalidateForEntity,
} from "@/shared/lib/actions/helpers";
import { getUserId } from "@/shared/lib/auth/server";
import { resetDemoData, seedDemoData } from "@/shared/lib/demo-data/seed";

export async function seedDemoDataAction(): Promise<ActionResult> {
	try {
		const userId = await getUserId();
		await seedDemoData(userId);
		revalidateForEntity("accounts", userId);
		return { success: true, message: "Dados de exemplo criados." };
	} catch (error) {
		return handleActionError(error);
	}
}

export async function resetDemoDataAction(): Promise<ActionResult> {
	try {
		const userId = await getUserId();
		await resetDemoData(userId);
		revalidateForEntity("accounts", userId);
		return { success: true, message: "Dados de exemplo removidos." };
	} catch (error) {
		return handleActionError(error);
	}
}
