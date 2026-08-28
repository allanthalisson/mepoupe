"use client";

import {
	RiArrowDownSLine,
	RiDownload2Line,
	RiExternalLinkLine,
	RiKeyLine,
	RiNotification3Line,
	RiQrCodeLine,
	RiShieldCheckLine,
} from "@remixicon/react";
import type { ReactNode } from "react";
import { useState } from "react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import { cn } from "@/shared/utils/ui";
import { ApiTokensForm } from "./api-tokens-form";

interface ApiToken {
	id: string;
	name: string;
	tokenPrefix: string;
	lastUsedAt: Date | null;
	lastUsedIp: string | null;
	createdAt: Date;
	expiresAt: Date | null;
	revokedAt: Date | null;
}

interface CompanionTabProps {
	tokens: ApiToken[];
}

const steps: {
	icon: typeof RiDownload2Line;
	title: string;
	description: ReactNode;
}[] = [
	{
		icon: RiDownload2Line,
		title: "Instale o app",
		description: (
			<>
				Baixe o APK no{" "}
				<a
					href="https://github.com/felipegcoutinho/openmonetis-companion"
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-0.5 text-primary hover:underline"
				>
					GitHub
					<RiExternalLinkLine className="h-3 w-3" />
				</a>
			</>
		),
	},
	{
		icon: RiQrCodeLine,
		title: "Gere uma chave",
		description: 'Clique em "Novo Token" abaixo e dê um nome ao dispositivo.',
	},
	{
		icon: RiNotification3Line,
		title: "Configure permissões",
		description: "Conceda acesso às notificações.",
	},
	{
		icon: RiShieldCheckLine,
		title: "Pronto!",
		description: "Notificações serão enviadas ao me.poupe.",
	},
];

export function CompanionTab({ tokens }: CompanionTabProps) {
	const [tutorialOpen, setTutorialOpen] = useState(false);

	return (
		<div className="space-y-6">
			{/* Steps */}
			<div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
				{steps.map((step, index) => (
					<div key={step.title} className="flex items-start gap-2">
						<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
							<step.icon className="h-4 w-4" />
						</div>
						<div className="min-w-0">
							<p className="text-sm font-medium leading-tight">
								{index + 1}. {step.title}
							</p>
							<p className="text-xs text-muted-foreground">
								{step.description}
							</p>
						</div>
					</div>
				))}
			</div>

			{/* Mini tutorial: como criar a chave passo a passo */}
			<Collapsible open={tutorialOpen} onOpenChange={setTutorialOpen}>
				<CollapsibleTrigger asChild>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="gap-2 text-muted-foreground"
					>
						<RiKeyLine className="h-4 w-4" />
						{tutorialOpen
							? "Ocultar tutorial de criação da chave"
							: "Como criar minha chave? Ver tutorial"}
						<RiArrowDownSLine
							className={cn(
								"h-4 w-4 transition-transform",
								tutorialOpen && "rotate-180",
							)}
						/>
					</Button>
				</CollapsibleTrigger>
				<CollapsibleContent className="space-y-4 overflow-hidden pt-3 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2">
					<ol className="space-y-3 rounded-lg border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
						<li className="flex gap-2">
							<span className="font-semibold text-foreground">1.</span>
							<span>
								Clique no botão <strong>"Novo Token"</strong>, logo abaixo desta
								lista de dispositivos.
							</span>
						</li>
						<li className="flex gap-2">
							<span className="font-semibold text-foreground">2.</span>
							<span>
								Dê um nome fácil de reconhecer, como o modelo do celular (ex:
								"Meu Celular" ou "Galaxy S24"), e clique em{" "}
								<strong>"Criar Token"</strong>.
							</span>
						</li>
						<li className="flex gap-2">
							<span className="font-semibold text-foreground">3.</span>
							<span>
								Sua chave será gerada na hora. Clique no ícone de cópia ao lado
								dela para copiá-la — ela é exibida apenas essa vez, então não
								feche a janela antes de copiar.
							</span>
						</li>
						<li className="flex gap-2">
							<span className="font-semibold text-foreground">4.</span>
							<span>
								Abra o app OpenMonetis Companion no seu celular Android, cole a
								chave no campo de configuração e conceda o acesso às
								notificações quando solicitado.
							</span>
						</li>
						<li className="flex gap-2">
							<span className="font-semibold text-foreground">5.</span>
							<span>
								Pronto! As notificações dos seus bancos (Nubank, Itaú, Bradesco,
								Inter, C6 e outros) passam a chegar direto na sua caixa de
								entrada do OpenMonetis.
							</span>
						</li>
					</ol>

					<Alert>
						<RiShieldCheckLine />
						<AlertTitle>Trate sua chave como uma senha</AlertTitle>
						<AlertDescription>
							<p>
								Qualquer pessoa com essa chave pode enviar notificações em seu
								nome. Nunca a compartilhe.
							</p>
							<p>
								Perdeu o celular ou trocou de aparelho? Revogue o token antigo
								na lista abaixo e gere um novo — leva menos de um minuto.
							</p>
						</AlertDescription>
					</Alert>
				</CollapsibleContent>
			</Collapsible>

			{/* Devices */}
			<ApiTokensForm tokens={tokens} />
		</div>
	);
}
