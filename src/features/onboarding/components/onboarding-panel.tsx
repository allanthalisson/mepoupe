"use client";

import {
	RiArrowRightLine,
	RiSparklingLine,
	RiWallet3Line,
} from "@remixicon/react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { seedDemoDataAction } from "@/features/onboarding/actions";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";

/**
 * Tela de boas-vindas exibida quando a pessoa ainda não tem nenhuma conta
 * ou cartão cadastrado. Essencial (criar conta) fica lado a lado com o
 * "plus" opcional (ver com dados de exemplo) — nenhum dos dois bloqueia o
 * outro.
 */
export function OnboardingPanel() {
	const [isPending, startTransition] = useTransition();

	const handleSeedDemo = () => {
		startTransition(async () => {
			const result = await seedDemoDataAction();
			if (result.success) {
				toast.success(
					"Prontinho! Preenchemos o dashboard com dados de exemplo.",
				);
			} else {
				toast.error(result.error ?? "Não foi possível gerar os dados.");
			}
		});
	};

	return (
		<Card className="hover-lift">
			<CardContent className="flex flex-col gap-6 py-2">
				<div className="space-y-1.5">
					<h2 className="text-lg font-semibold">Vamos começar</h2>
					<p className="text-sm text-muted-foreground">
						Você ainda não tem nenhuma conta ou cartão cadastrado. Escolha como
						quer seguir — dá pra trocar de ideia a qualquer momento.
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<div className="flex flex-col gap-3 rounded-lg border p-4">
						<div className="flex items-center gap-2">
							<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
								<RiWallet3Line className="size-4 text-primary" />
							</div>
							<p className="font-medium text-sm">Usar meus dados</p>
						</div>
						<p className="text-muted-foreground text-xs">
							Cadastre sua primeira conta ou cartão para começar a lançar suas
							finanças reais.
						</p>
						<Button asChild size="sm" className="mt-auto w-full sm:w-fit">
							<Link href="/accounts">
								Criar minha primeira conta
								<RiArrowRightLine className="size-4" />
							</Link>
						</Button>
					</div>

					<div className="flex flex-col gap-3 rounded-lg border border-dashed p-4">
						<div className="flex items-center gap-2">
							<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
								<RiSparklingLine className="size-4 text-primary" />
							</div>
							<p className="font-medium text-sm">Ver com dados de exemplo</p>
						</div>
						<p className="text-muted-foreground text-xs">
							Preenchemos o dashboard com contas, cartão e lançamentos fictícios
							para você explorar o app. Dá pra zerar tudo depois.
						</p>
						<Button
							size="sm"
							variant="outline"
							className="mt-auto w-full sm:w-fit"
							onClick={handleSeedDemo}
							disabled={isPending}
						>
							{isPending ? "Gerando…" : "Ver com dados de exemplo"}
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
