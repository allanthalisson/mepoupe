import { and, asc, desc, eq } from "drizzle-orm";
import { assistantConversations, assistantMessages } from "@/db/schema";
import { db } from "@/shared/lib/db";

export type AssistantConversationSummary = {
	id: string;
	title: string;
	updatedAt: string;
};

export type AssistantMessageRecord = {
	id: string;
	role: "user" | "assistant";
	content: string;
	createdAt: string;
};

const MAX_CONVERSATIONS = 30;
/** Quantas mensagens anteriores viram contexto pro modelo numa conversa existente. */
export const MAX_CONTEXT_MESSAGES = 20;

export async function fetchAssistantConversations(
	userId: string,
): Promise<AssistantConversationSummary[]> {
	const rows = await db.query.assistantConversations.findMany({
		columns: { id: true, title: true, updatedAt: true },
		where: eq(assistantConversations.userId, userId),
		orderBy: [desc(assistantConversations.updatedAt)],
		limit: MAX_CONVERSATIONS,
	});

	return rows.map((row) => ({
		id: row.id,
		title: row.title,
		updatedAt: row.updatedAt.toISOString(),
	}));
}

export async function fetchConversationMessages(
	userId: string,
	conversationId: string,
): Promise<AssistantMessageRecord[] | null> {
	const conversation = await db.query.assistantConversations.findFirst({
		columns: { id: true },
		where: and(
			eq(assistantConversations.id, conversationId),
			eq(assistantConversations.userId, userId),
		),
	});
	if (!conversation) return null;

	const rows = await db.query.assistantMessages.findMany({
		where: eq(assistantMessages.conversationId, conversationId),
		orderBy: [asc(assistantMessages.createdAt)],
	});

	return rows.map((row) => ({
		id: row.id,
		role: row.role === "assistant" ? "assistant" : "user",
		content: row.content,
		createdAt: row.createdAt.toISOString(),
	}));
}
