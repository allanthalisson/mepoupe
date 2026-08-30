import { connection } from "next/server";
import { AssistantPage } from "@/features/assistant/components/assistant-page";
import { fetchAssistantConversations } from "@/features/assistant/queries";
import { getUserId } from "@/shared/lib/auth/server";

export default async function Page() {
	await connection();
	const userId = await getUserId();
	const conversations = await fetchAssistantConversations(userId);

	return (
		<main className="flex flex-col gap-6">
			<AssistantPage initialConversations={conversations} />
		</main>
	);
}
