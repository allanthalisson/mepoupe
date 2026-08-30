"use client";

import { RiRobot2Line, RiSendPlaneLine } from "@remixicon/react";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { askAssistantAction } from "@/features/assistant/actions";
import { Button } from "@/shared/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { Textarea } from "@/shared/components/ui/textarea";

const SUGGESTED_QUESTIONS = [
	"Quanto gastei este mês?",
	"Onde estou gastando mais que deveria?",
	"Minha taxa de poupança está melhorando?",
	"Onde eu conseguiria economizar R$ 500 por mês?",
];

export function AssistantPage() {
	const [question, setQuestion] = useState("");
	const [answer, setAnswer] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const ask = (value: string) => {
		setError(null);
		setAnswer(null);
		startTransition(async () => {
			const result = await askAssistantAction({ question: value });
			if (!result.success) {
				setError(result.error);
				toast.error(result.error);
				return;
			}
			if (!result.data) {
				setError("O Assistente não devolveu uma resposta. Tente novamente.");
				return;
			}
			setAnswer(result.data.answer);
		});
	};

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		const trimmed = question.trim();
		if (!trimmed || isPending) return;
		ask(trimmed);
	};

	const handleSuggested = (value: string) => {
		setQuestion(value);
		ask(value);
	};

	return (
		<div className="flex flex-col gap-6">
			<Card>
				<CardHeader className="flex flex-row items-center gap-3">
					<div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<RiRobot2Line className="size-4" />
					</div>
					<div>
						<CardTitle>Assistente</CardTitle>
						<CardDescription>
							Converse com seus próprios dados. As respostas usam sempre
							cálculos reais do seu histórico — a IA só explica o resultado,
							nunca inventa valores.
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<form className="flex flex-col gap-3" onSubmit={handleSubmit}>
						<Textarea
							className="min-h-24"
							disabled={isPending}
							onChange={(event) => setQuestion(event.target.value)}
							placeholder="Ex: quanto gastei com Uber nos últimos 3 meses?"
							value={question}
						/>
						<Button
							className="self-start"
							disabled={isPending || !question.trim()}
							type="submit"
						>
							<RiSendPlaneLine className="size-4" />
							{isPending ? "Consultando..." : "Perguntar"}
						</Button>
					</form>

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
				</CardContent>
			</Card>

			{isPending && (
				<Card>
					<CardContent className="pt-6 text-muted-foreground text-sm">
						Consultando seus dados...
					</CardContent>
				</Card>
			)}

			{!isPending && (answer || error) && (
				<Card>
					<CardContent className="whitespace-pre-wrap pt-6 text-sm leading-relaxed">
						{error ? <p className="text-destructive">{error}</p> : answer}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
