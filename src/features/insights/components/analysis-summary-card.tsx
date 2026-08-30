import {
	RiCalendarLine,
	RiDatabase2Line,
	RiEditLine,
	RiExpandUpDownLine,
	RiInformationLine,
	RiSearchLine,
	RiShieldCheckLine,
	RiSparklingLine,
} from "@remixicon/react";
import type React from "react";
import { type AIProvider, PROVIDERS } from "@/features/insights/constants";
import { USER_INSTRUCTIONS_MAX_LENGTH } from "@/features/insights/lib/user-instructions";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Textarea } from "@/shared/components/ui/textarea";
import {
	comparePeriods,
	displayPeriod,
	formatShortPeriodLabel,
} from "@/shared/utils/period";
import { cn } from "@/shared/utils/ui";
import { ProviderIcon } from "./provider-icon";

interface AnalysisSummaryCardProps {
	selectedPeriods: string[];
	onSelectedPeriodsChange: (periods: string[]) => void;
	availablePeriods: string[];
	currentProvider: AIProvider;
	selectedModelLabel: string;
	userInstructions: string;
	onUserInstructionsChange: (value: string) => void;
}

function describeSelectedPeriods(selectedPeriods: string[]): string {
	if (selectedPeriods.length <= 1) {
		return selectedPeriods[0]
			? displayPeriod(selectedPeriods[0])
			: "Nenhum período selecionado";
	}

	const sorted = [...selectedPeriods].sort(comparePeriods);
	const first = sorted[0];
	const last = sorted[sorted.length - 1];

	return `${formatShortPeriodLabel(first)} – ${formatShortPeriodLabel(last)} (${sorted.length} meses)`;
}

export function AnalysisSummaryCard({
	selectedPeriods,
	onSelectedPeriodsChange,
	availablePeriods,
	currentProvider,
	selectedModelLabel,
	userInstructions,
	onUserInstructionsChange,
}: AnalysisSummaryCardProps) {
	const hasUserInstructions = userInstructions.trim().length > 0;

	const handleUserInstructionsChange = (value: string) => {
		onUserInstructionsChange(value.slice(0, USER_INSTRUCTIONS_MAX_LENGTH));
	};

	const handleTogglePeriod = (period: string, checked: boolean) => {
		if (checked) {
			if (selectedPeriods.includes(period)) return;
			onSelectedPeriodsChange([...selectedPeriods, period]);
			return;
		}

		if (selectedPeriods.length <= 1) return;
		onSelectedPeriodsChange(selectedPeriods.filter((item) => item !== period));
	};

	return (
		<aside>
			<Card className="border-border/70 bg-card/95 shadow-sm">
				<CardContent className="flex flex-col gap-4">
					<div className="flex items-center gap-3">
						<div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<RiSparklingLine className="size-4" />
						</div>
						<div>
							<h3 className="font-semibold text-sm">Resumo da análise</h3>
							<p className="text-muted-foreground text-xs">
								Configuração atual
							</p>
						</div>
					</div>

					<Dialog>
						<DialogTrigger asChild>
							<Button
								className="w-full justify-start"
								type="button"
								variant="secondary"
							>
								<RiEditLine className="size-4" />
								{hasUserInstructions
									? "Editar orientações da IA"
									: "Adicionar orientações da IA"}
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-2xl">
							<DialogHeader>
								<DialogTitle>Orientações para a IA</DialogTitle>
								<DialogDescription>
									Use este campo para direcionar o foco e o tom desta análise.
									Essas orientações não alteram os dados analisados nem
									substituem o formato obrigatório da resposta.
								</DialogDescription>
							</DialogHeader>

							<div className="space-y-4">
								<div className="rounded-2xl bg-warning/15 p-4">
									<div className="flex gap-3">
										<RiInformationLine className="mt-0.5 size-5 shrink-0 text-warning" />
										<div className="space-y-1">
											<p className="font-medium text-sm">
												O que pode ser ajustado
											</p>
											<p className="text-muted-foreground text-xs leading-relaxed">
												Você pode pedir mais foco em parcelamentos, gastos
												recorrentes, cartão de crédito, oportunidades de
												economia ou preferir um tom mais direto. A IA ainda deve
												seguir o schema e usar apenas os dados agregados do
												período.
											</p>
										</div>
									</div>
								</div>

								<Textarea
									className="min-h-52 resize-y"
									maxLength={USER_INSTRUCTIONS_MAX_LENGTH}
									onChange={(event) =>
										handleUserInstructionsChange(event.target.value)
									}
									placeholder="Ex: foque em parcelamentos e despesas recorrentes; seja mais direto; ignore gastos de mercado."
									value={userInstructions}
								/>

								<div className="flex items-center justify-between gap-3 text-muted-foreground text-xs">
									<span>
										Exemplos bons: “priorize economia”, “dê mais atenção ao
										cartão”, “seja objetivo”.
									</span>
									<span className="shrink-0">
										{userInstructions.length}/{USER_INSTRUCTIONS_MAX_LENGTH}
									</span>
								</div>
							</div>

							<DialogFooter>
								<Button
									onClick={() => onUserInstructionsChange("")}
									type="button"
									variant="outline"
								>
									Limpar
								</Button>
								<DialogClose asChild>
									<Button type="button">Aplicar orientações</Button>
								</DialogClose>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					<p
						className={cn(
							"min-h-8 text-xs leading-relaxed",
							hasUserInstructions ? "text-primary" : "text-info",
						)}
					>
						{hasUserInstructions
							? "Prompt personalizado ativo. As orientações serão consideradas nesta análise."
							: "Prompt padrão ativo. A análise seguirá o formato e as prioridades originais."}
					</p>

					<div className="grid gap-2">
						<div className="flex gap-3">
							<div className="mt-0.5 text-muted-foreground">
								<RiCalendarLine className="size-4" />
							</div>
							<div className="w-full space-y-1.5">
								<p className="font-semibold text-xs">Período</p>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											className="h-auto w-full justify-between px-3 py-1.5 text-left font-normal text-xs"
											type="button"
											variant="outline"
										>
											<span className="truncate">
												{describeSelectedPeriods(selectedPeriods)}
											</span>
											<RiExpandUpDownLine className="size-3.5 shrink-0 text-muted-foreground" />
										</Button>
									</PopoverTrigger>
									<PopoverContent align="start" className="w-64 p-2">
										<p className="mb-2 px-1 text-muted-foreground text-xs">
											Selecione um ou mais meses. Meses não adjacentes incluem
											os meses entre eles na análise.
										</p>
										<div className="max-h-64 space-y-0.5 overflow-y-auto">
											{availablePeriods.map((option) => {
												const checked = selectedPeriods.includes(option);
												return (
													<label
														className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-xs hover:bg-muted"
														key={option}
													>
														<Checkbox
															checked={checked}
															onCheckedChange={(value) =>
																handleTogglePeriod(option, value === true)
															}
														/>
														{displayPeriod(option)}
													</label>
												);
											})}
										</div>
									</PopoverContent>
								</Popover>
							</div>
						</div>
						<SummaryRow
							icon={<RiDatabase2Line className="size-4" />}
							label="Fonte dos dados"
							value="Transações, categorias, cartões, contas, orçamentos, recorrências e parcelamentos do mês."
						/>
					</div>

					<div>
						<p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
							Modelo selecionado
						</p>
						<div className="flex items-center gap-3">
							<ProviderIcon provider={currentProvider} />
							<div className="min-w-0 flex-1">
								<p className="font-semibold text-sm">
									{PROVIDERS[currentProvider].name}
								</p>
								<p className="truncate text-muted-foreground text-xs">
									{selectedModelLabel || "Nenhum modelo selecionado"}
								</p>
							</div>
							{currentProvider === "ollama" && (
								<Badge
									className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-none"
									variant="outline"
								>
									Local
								</Badge>
							)}
						</div>
					</div>

					<div>
						<div className="rounded-2xl bg-warning/15 p-4">
							<div className="flex gap-3">
								<RiSearchLine className="mt-0.5 size-4 shrink-0 text-warning" />
								<div className="space-y-1">
									<p className="font-medium text-xs">Escopo da análise</p>
									<p className="text-muted-foreground text-xs leading-relaxed">
										Busca comportamentos, gatilhos, recomendações e melhorias.
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className="rounded-2xl bg-violet-500/10 p-4">
						<div className="flex gap-3">
							<RiShieldCheckLine className="mt-0.5 size-4 shrink-0 text-violet-600 dark:text-violet-300" />
							<div className="space-y-1">
								<p className="font-medium text-xs">Privacidade dos dados</p>
								<p className="text-muted-foreground text-xs leading-relaxed">
									{currentProvider === "ollama"
										? "Dados enviados para sua instância Ollama."
										: "Dados enviados ao provedor externo escolhido."}
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</aside>
	);
}

function SummaryRow({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
}) {
	return (
		<div className="flex gap-3">
			<div className="mt-0.5 text-muted-foreground">{icon}</div>
			<div className="space-y-1">
				<p className="font-semibold text-xs">{label}</p>
				<p className="text-muted-foreground text-xs leading-relaxed">{value}</p>
			</div>
		</div>
	);
}
