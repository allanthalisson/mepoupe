"use client";

import { RiSparklingLine } from "@remixicon/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { resetDemoDataAction } from "@/features/onboarding/actions";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";

/**
 * Aviso persistente enquanto existirem dados de exemplo gerados pelo
 * onboarding. Some sozinho assim que a pessoa zera os dados (o servidor
 * simplesmente não tem mais contas com isDemo=true).
 */
export function DemoDataBanner() {
	const [isPending, startTransition] = useTransition();
	const [confirmOpen, setConfirmOpen] = useState(false);

	const handleReset = () => {
		startTransition(async () => {
			const result = await resetDemoDataAction();
			setConfirmOpen(false);
			if (result.success) {
				toast.success("Dados de exemplo removidos.");
			} else {
				toast.error(result.error ?? "Não foi possível remover os dados.");
			}
		});
	};

	return (
		<div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-dashed bg-primary/5 p-4 sm:flex-row sm:items-center">
			<div className="flex items-start gap-2.5">
				<RiSparklingLine className="mt-0.5 size-4 shrink-0 text-primary" />
				<p className="text-sm">
					<span className="font-medium">Você está vendo dados de exemplo.</span>{" "}
					<span className="text-muted-foreground">
						Importe seus dados reais quando estiver pronto e zere os fictícios.
					</span>
				</p>
			</div>
			<Button
				size="sm"
				variant="outline"
				className="shrink-0"
				onClick={() => setConfirmOpen(true)}
				disabled={isPending}
			>
				Zerar dados de exemplo
			</Button>

			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Zerar dados de exemplo?</AlertDialogTitle>
						<AlertDialogDescription>
							Isso remove as contas, o cartão e os lançamentos de exemplo
							gerados no onboarding. Seus dados reais não são afetados. Esta
							ação não pode ser desfeita.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
						<AlertDialogAction onClick={handleReset} disabled={isPending}>
							{isPending ? "Removendo…" : "Zerar dados"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
