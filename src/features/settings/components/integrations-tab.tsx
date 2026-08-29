"use client";

import { RiCheckLine, RiExternalLinkLine } from "@remixicon/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AVAILABLE_MODELS } from "@/features/insights/constants";
import {
	removeIntegrationKeyAction,
	saveConsultantModelAction,
	saveIntegrationKeyAction,
} from "@/features/settings/actions";
import {
	AI_PROVIDER_KEY_URLS,
	AI_PROVIDER_LABELS,
	type IntegrationKind,
	USER_CONFIGURABLE_AI_PROVIDERS,
} from "@/features/settings/lib/integrations";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";

type IntegrationEntry = { configured: boolean; masked: string | null };

interface IntegrationsTabProps {
	brapi: IntegrationEntry;
	aiProviders: Record<string, IntegrationEntry>;
	consultantModelId: string | null;
}

function SecretKeyRow({
	kind,
	label,
	description,
	helpUrl,
	entry,
}: {
	kind: IntegrationKind;
	label: string;
	description: string;
	helpUrl?: string;
	entry: IntegrationEntry;
}) {
	const [value, setValue] = useState("");
	const [isPending, startTransition] = useTransition();

	const handleSave = () => {
		const trimmed = value.trim();
		if (!trimmed) return;
		startTransition(async () => {
			const result = await saveIntegrationKeyAction({ kind, value: trimmed });
			if (result.success) {
				toast.success(result.message ?? "Chave salva.");
				setValue("");
			} else {
				toast.error(result.error ?? "Erro ao salvar.");
			}
		});
	};

	const handleRemove = () => {
		startTransition(async () => {
			const result = await removeIntegrationKeyAction({ kind });
			if (result.success) {
				toast.success("Chave removida.");
			} else {
				toast.error(result.error ?? "Erro ao remover.");
			}
		});
	};

	return (
		<div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="min-w-0 flex-1 space-y-1">
				<div className="flex items-center gap-2">
					<p className="text-sm font-medium">{label}</p>
					{entry.configured && (
						<Badge variant="success" className="gap-1">
							<RiCheckLine className="size-3" />
							Configurada
						</Badge>
					)}
				</div>
				<p className="text-xs text-muted-foreground">{description}</p>
				{entry.configured && entry.masked && (
					<p className="font-mono text-xs text-muted-foreground">
						{entry.masked}
					</p>
				)}
				{helpUrl && (
					<a
						href={helpUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
					>
						Como conseguir
						<RiExternalLinkLine className="size-3" />
					</a>
				)}
			</div>
			<div className="flex gap-2">
				<Input
					type="password"
					placeholder={entry.configured ? "Nova chave" : "Cole sua chave"}
					value={value}
					onChange={(e) => setValue(e.target.value)}
					disabled={isPending}
					className="w-full sm:w-56"
				/>
				<Button
					size="sm"
					onClick={handleSave}
					disabled={isPending || !value.trim()}
				>
					Salvar
				</Button>
				{entry.configured && (
					<Button
						size="sm"
						variant="outline"
						onClick={handleRemove}
						disabled={isPending}
					>
						Remover
					</Button>
				)}
			</div>
		</div>
	);
}

function ConsultantModelSelect({
	currentModelId,
}: {
	currentModelId: string | null;
}) {
	const [isPending, startTransition] = useTransition();

	const handleChange = (modelId: string) => {
		startTransition(async () => {
			const result = await saveConsultantModelAction({
				modelId: modelId === "default" ? null : modelId,
			});
			if (result.success) toast.success("Preferência salva.");
			else toast.error(result.error ?? "Erro ao salvar.");
		});
	};

	return (
		<div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="min-w-0 flex-1 space-y-1">
				<p className="text-sm font-medium">
					Modelo para consultoria automática
				</p>
				<p className="text-xs text-muted-foreground">
					Modelo usado na revisão financeira mensal dos Investimentos. Sem
					escolha, usa o padrão do sistema.
				</p>
			</div>
			<Select
				defaultValue={currentModelId ?? "default"}
				onValueChange={handleChange}
				disabled={isPending}
			>
				<SelectTrigger className="w-full sm:w-56">
					<SelectValue placeholder="Padrão do sistema" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="default">Padrão do sistema</SelectItem>
					{AVAILABLE_MODELS.map((model) => (
						<SelectItem key={model.id} value={model.id}>
							{model.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

export function IntegrationsTab({
	brapi,
	aiProviders,
	consultantModelId,
}: IntegrationsTabProps) {
	return (
		<div className="space-y-8">
			<div className="space-y-3">
				<div>
					<h3 className="font-semibold">Dados de mercado</h3>
					<p className="text-sm text-muted-foreground">
						Sua própria chave da brapi.dev para cotações e fundamentos de ações
						e FIIs no painel de Investimentos.
					</p>
				</div>
				<SecretKeyRow
					kind="brapi"
					label="BRAPI_TOKEN"
					description="Gratuito, criando uma conta em brapi.dev."
					helpUrl="https://brapi.dev"
					entry={brapi}
				/>
			</div>

			<div className="space-y-3">
				<div>
					<h3 className="font-semibold">Provedores de IA</h3>
					<p className="text-sm text-muted-foreground">
						Configure sua própria chave para usar seu provedor preferido nos
						Insights e na consultoria financeira automática. Totalmente
						opcional.
					</p>
				</div>
				<div className="space-y-3">
					{USER_CONFIGURABLE_AI_PROVIDERS.map((provider) => (
						<SecretKeyRow
							key={provider}
							kind={provider}
							label={AI_PROVIDER_LABELS[provider]}
							description="Usada apenas para suas próprias análises e consultorias."
							helpUrl={AI_PROVIDER_KEY_URLS[provider]}
							entry={
								aiProviders[provider] ?? { configured: false, masked: null }
							}
						/>
					))}
				</div>
				<ConsultantModelSelect currentModelId={consultantModelId} />
			</div>
		</div>
	);
}
