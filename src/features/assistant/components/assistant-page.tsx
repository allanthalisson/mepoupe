"use client";

import {
	RiAddLine,
	RiDeleteBinLine,
	RiRobot2Line,
	RiSendPlaneLine,
	RiUser3Line,
} from "@remixicon/react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	askAssistantAction,
	deleteConversationAction,
	getConversationMessagesAction,
} from "@/features/assistant/actions";
import type {
	AssistantConversationSummary,
	AssistantMessageRecord,
} from "@/features/assistant/queries";
import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/utils/ui";

const SUGGESTED_QUESTIONS = [
	"Quanto gastei este mês?",
	"Onde estou gastando mais que deveria?",
	"Minha taxa de poupança está melhorando?",
	"Quanto consigo investir por mês atualmente?",
];

let tempMessageCounter = 0;
const nextTempId = () => `temp-${Date.now()}-${tempMessageCounter++}`;

interface AssistantPageProps {
	initialConversations: AssistantConversationSummary[];
}

export function AssistantPage({ initialConversations }: AssistantPageProps) {
	const [conversations, setConversations] = useState(initialConversations);
	const [activeConversationId, setActiveConversationId] = useState<
		string | null
	>(null);
	const [messages, setMessages] = useState<AssistantMessageRecord[]>([]);
	const [question, setQuestion] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const [isLoadingThread, startLoadThreadTransition] = useTransition();

	const handleNewConversation = () => {
		setActiveConversationId(null);
		setMessages([]);
		setError(null);
	};

	const handleSelectConversation = (conversationId: string) => {
		if (conversationId === activeConversationId) return;
		setError(null);
		startLoadThreadTransition(async () => {
			const result = await getConversationMessagesAction({ conversationId });
			if (result.success && result.data) {
				setActiveConversationId(conversationId);
				setMessages(result.data);
			} else if (!result.success) {
				toast.error(result.error);
			}
		});
	};

	const handleDeleteConversation = (conversationId: string) => {
		startTransition(async () => {
			const result = await deleteConversationAction({ conversationId });
			if (result.success) {
				setConversations((prev) =>
					prev.filter((conversation) => conversation.id !== conversationId),
				);
				if (activeConversationId === conversationId) {
					handleNewConversation();
				}
			} else {
				toast.error(result.error);
			}
		});
	};

	const ask = (value: string) => {
		setError(null);
		const optimisticUserMessage: AssistantMessageRecord = {
			id: nextTempId(),
			role: "user",
			content: value,
			createdAt: new Date().toISOString(),
		};
		setMessages((prev) => [...prev, optimisticUserMessage]);

		startTransition(async () => {
			const result = await askAssistantAction({
				question: value,
				conversationId: activeConversationId ?? undefined,
			});

			if (!result.success) {
				setError(result.error);
				toast.error(result.error);
				return;
			}
			if (!result.data) {
				setError("O Assistente não devolveu uma resposta. Tente novamente.");
				return;
			}

			const { conversationId, answer } = result.data;
			setMessages((prev) => [
				...prev,
				{
					id: nextTempId(),
					role: "assistant",
					content: answer,
					createdAt: new Date().toISOString(),
				},
			]);

			const isNewConversation = conversationId !== activeConversationId;
			setActiveConversationId(conversationId);
			setConversations((prev) => {
				const now = new Date().toISOString();
				if (isNewConversation) {
					const title =
						value.trim().length > 80
							? `${value.trim().slice(0, 79)}…`
							: value.trim();
					return [{ id: conversationId, title, updatedAt: now }, ...prev];
				}
				const rest = prev.filter(
					(conversation) => conversation.id !== conversationId,
				);
				const current = prev.find(
					(conversation) => conversation.id === conversationId,
				);
				return current ? [{ ...current, updatedAt: now }, ...rest] : prev;
			});
		});
	};

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		const trimmed = question.trim();
		if (!trimmed || isPending) return;
		setQuestion("");
		ask(trimmed);
	};

	const handleSuggested = (value: string) => {
		if (isPending) return;
		ask(value);
	};

	const isEmptyThread = messages.length === 0;

	return (
		<div className="flex flex-col gap-4 md:flex-row">
			<Card className="md:w-72 md:shrink-0">
				<CardHeader>
					<Button
						className="w-full justify-start"
						disabled={isPending}
						onClick={handleNewConversation}
						size="sm"
						type="button"
						variant="secondary"
					>
						<RiAddLine className="size-4" />
						Nova conversa
					</Button>
				</CardHeader>
				<CardContent className="max-h-[70vh] space-y-1 overflow-y-auto md:max-h-[calc(100vh-14rem)]">
					{conversations.length === 0 ? (
						<p className="px-1 text-muted-foreground text-xs">
							Suas conversas com o Assistente aparecem aqui.
						</p>
					) : (
						conversations.map((conversation) => (
							<div
								className={cn(
									"group flex items-center gap-1 rounded-md pr-1 hover:bg-muted",
									conversation.id === activeConversationId && "bg-muted",
								)}
								key={conversation.id}
							>
								<button
									className="min-w-0 flex-1 truncate rounded-md px-2 py-2 text-left text-xs"
									disabled={isLoadingThread}
									onClick={() => handleSelectConversation(conversation.id)}
									type="button"
								>
									<span className="block truncate font-medium">
										{conversation.title}
									</span>
									<span className="text-muted-foreground">
										{formatDistanceToNow(new Date(conversation.updatedAt), {
											addSuffix: true,
											locale: ptBR,
										})}
									</span>
								</button>
								<Button
									className="shrink-0 opacity-0 group-hover:opacity-100"
									disabled={isPending}
									onClick={() => handleDeleteConversation(conversation.id)}
									size="icon-sm"
									type="button"
									variant="ghost"
								>
									<RiDeleteBinLine className="size-3.5" />
								</Button>
							</div>
						))
					)}
				</CardContent>
			</Card>

			<div className="flex flex-1 flex-col gap-4">
				<Card className="flex-1">
					<CardHeader className="flex flex-row items-center gap-3">
						<div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<RiRobot2Line className="size-4" />
						</div>
						<div>
							<CardTitle>Assistente</CardTitle>
							<CardDescription>
								As respostas usam sempre cálculos reais do seu histórico — a IA
								só explica o resultado, nunca inventa valores.
							</CardDescription>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						{isEmptyThread && !isLoadingThread ? (
							<div className="flex flex-wrap gap-2">
								{SUGGESTED_QUESTIONS.map((suggestion) => (
									<Button
										disabled={isPending}
										key={suggestion}
										onClick={() => handleSuggested(suggestion)}
										size="sm"
										type="button"
										variant="outline"
									>
										{suggestion}
									</Button>
								))}
							</div>
						) : (
							<div className="max-h-[50vh] space-y-3 overflow-y-auto">
								{isLoadingThread ? (
									<p className="text-muted-foreground text-sm">
										Carregando conversa...
									</p>
								) : (
									messages.map((message) => (
										<div
											className={cn(
												"flex gap-2",
												message.role === "user" && "flex-row-reverse",
											)}
											key={message.id}
										>
											<div
												className={cn(
													"flex size-7 shrink-0 items-center justify-center rounded-full",
													message.role === "user"
														? "bg-muted text-muted-foreground"
														: "bg-primary/10 text-primary",
												)}
											>
												{message.role === "user" ? (
													<RiUser3Line className="size-3.5" />
												) : (
													<RiRobot2Line className="size-3.5" />
												)}
											</div>
											<div
												className={cn(
													"max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed",
													message.role === "user"
														? "bg-primary text-primary-foreground"
														: "bg-muted",
												)}
											>
												{message.content}
											</div>
										</div>
									))
								)}
								{isPending && (
									<p className="text-muted-foreground text-sm">
										Consultando seus dados...
									</p>
								)}
								{error && <p className="text-destructive text-sm">{error}</p>}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<form className="flex flex-col gap-3" onSubmit={handleSubmit}>
							<Textarea
								className="min-h-20"
								disabled={isPending}
								onChange={(event) => setQuestion(event.target.value)}
								placeholder="Ex: quanto gastei com Uber nos últimos 3 meses?"
								value={question}
							/>
							<Button
								className="self-end"
								disabled={isPending || !question.trim()}
								type="submit"
							>
								<RiSendPlaneLine className="size-4" />
								{isPending ? "Consultando..." : "Perguntar"}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
