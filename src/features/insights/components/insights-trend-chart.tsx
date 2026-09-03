"use client";

import { RiLineChartLine } from "@remixicon/react";
import {
	Bar,
	CartesianGrid,
	ComposedChart,
	Line,
	ReferenceLine,
	XAxis,
} from "recharts";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
} from "@/shared/components/ui/chart";
import type { FinancialSummary } from "@/shared/lib/financial-analysis/financial-summary";
import { formatCurrency } from "@/shared/utils/currency";
import { formatCompactPeriodLabel } from "@/shared/utils/period";

interface InsightsTrendChartProps {
	data: FinancialSummary[];
}

const chartConfig = {
	receita: {
		label: "Receita",
		color: "var(--success)",
	},
	despesa: {
		label: "Despesa",
		color: "var(--destructive)",
	},
	saldo: {
		label: "Saldo",
		color: "var(--primary)",
	},
} satisfies ChartConfig;

/**
 * Tendência dos últimos meses — dado 100% determinístico (getMonthlyCashFlow),
 * nunca gerado pela IA. Fica sempre visível, independente de já ter rodado
 * uma análise ou não.
 */
export function InsightsTrendChart({ data }: InsightsTrendChartProps) {
	if (data.length === 0) return null;

	const chartData = data.map((month) => ({
		period: formatCompactPeriodLabel(month.period).toLowerCase(),
		receita: month.income,
		despesa: month.expenses,
		saldo: month.balance,
	}));

	const isEmpty = chartData.every(
		(item) => item.receita === 0 && item.despesa === 0 && item.saldo === 0,
	);
	if (isEmpty) return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<RiLineChartLine className="size-4 text-primary" />
					Tendência dos últimos meses
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2 px-2 sm:px-6">
				<ChartContainer
					className="aspect-auto h-[240px] w-full"
					config={chartConfig}
				>
					<ComposedChart
						accessibilityLayer
						data={chartData}
						margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
					>
						<CartesianGrid strokeDasharray="3 3" vertical={false} />
						<ReferenceLine stroke="var(--border)" y={0} />
						<XAxis
							axisLine={false}
							dataKey="period"
							tickLine={false}
							tickMargin={8}
						/>
						<ChartTooltip
							content={({ active, payload }) => {
								if (!active || !payload || payload.length === 0) return null;
								const period = payload[0]?.payload.period as string | undefined;

								return (
									<div className="rounded-lg border bg-background p-2 shadow-sm">
										{period && (
											<p className="mb-2 font-medium text-muted-foreground text-xs">
												{period}
											</p>
										)}
										<div className="grid gap-2">
											{payload.map((entry) => {
												const config =
													chartConfig[
														entry.dataKey as keyof typeof chartConfig
													];
												const value = entry.value as number;
												return (
													<div
														className="flex items-center gap-2"
														key={String(entry.dataKey ?? entry.name)}
													>
														<div
															className="size-2 rounded-full"
															style={{ backgroundColor: config?.color }}
														/>
														<span className="text-muted-foreground text-xs">
															{config?.label}:
														</span>
														<span className="font-medium text-xs">
															{formatCurrency(value)}
														</span>
													</div>
												);
											})}
										</div>
									</div>
								);
							}}
							cursor={{ fill: "var(--muted)", opacity: 0.3 }}
						/>
						<Bar
							dataKey="receita"
							fill={chartConfig.receita.color}
							maxBarSize={60}
							radius={[4, 4, 0, 0]}
						/>
						<Bar
							dataKey="despesa"
							fill={chartConfig.despesa.color}
							maxBarSize={60}
							radius={[4, 4, 0, 0]}
						/>
						<Line
							activeDot={{ r: 5 }}
							dataKey="saldo"
							dot={{ fill: chartConfig.saldo.color, r: 3 }}
							stroke={chartConfig.saldo.color}
							strokeWidth={2}
							type="monotone"
						/>
					</ComposedChart>
				</ChartContainer>
				<div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
					{Object.values(chartConfig).map((config) => (
						<div className="flex items-center gap-1.5" key={config.label}>
							<div
								className="size-2 rounded-full"
								style={{ backgroundColor: config.color }}
							/>
							<span>{config.label}</span>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
