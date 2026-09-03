import { connection } from "next/server";
import { AssistantPage } from "@/features/assistant/components/assistant-page";
import { fetchAssistantConversations } from "@/features/assistant/queries";
import { ContentErrorBoundary } from "@/shared/components/feedback/content-error-boundary";
import { getUserId } from "@/shared/lib/auth/server";

export default function Page() {
	return (
		<ContentErrorBoundary
			title="Não foi possível carregar o Assistente"
			description="Suas conversas não puderam ser carregadas agora."
		>
			<AssistantContent />
		</ContentErrorBoundary>
	);
}

async function AssistantContent() {
	await connection();
	const userId = await getUserId();
	const conversations = await fetchAssistantConversations(userId).catch(
		(error) => {
			console.error("Falha ao buscar conversas do Assistente:", error);
			return [];
		},
	);

	return (
		<main className="flex flex-col gap-6">
			<AssistantPage initialConversations={conversations} />
		</main>
	);
}
