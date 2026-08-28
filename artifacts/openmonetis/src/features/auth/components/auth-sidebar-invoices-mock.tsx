import Image from "next/image";
import { resolveLogoSrc } from "@/shared/lib/logo";
import { formatCurrency } from "@/shared/utils/currency";

type MockInvoice = {
	cardName: string;
	logo: string;
	amount: number;
	dueLabel: string;
};

const MOCK_INVOICES: MockInvoice[] = [
	{
		cardName: "Nubank",
		logo: "nubank.png",
		amount: 1898,
		dueLabel: "Vence hoje",
	},
	{
		cardName: "Itaú",
		logo: "itau.png",
		amount: 1923,
		dueLabel: "Vence amanhã",
	},
];

function MockInvoiceItem({
	invoice,
	divider,
}: {
	invoice: MockInvoice;
	divider: boolean;
}) {
	const logoSrc = resolveLogoSrc(invoice.logo);

	return (
		<div className={divider ? "border-b border-border/60" : undefined}>
			<div className="flex items-center justify-between py-2.5">
				<div className="flex min-w-0 flex-1 items-center gap-2.5 py-0.5">
					<div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
						{logoSrc && (
							<Image
								src={logoSrc}
								alt={`Logo ${invoice.cardName}`}
								width={36}
								height={36}
								className="h-full w-full object-contain"
							/>
						)}
					</div>
					<div className="min-w-0">
						<p className="text-sm font-medium text-foreground">
							{invoice.cardName}
						</p>
						<p className="text-xs text-muted-foreground">{invoice.dueLabel}</p>
					</div>
				</div>
				<div className="flex shrink-0 flex-col items-end gap-0.5">
					<span className="text-sm font-medium tracking-tighter text-foreground">
						{formatCurrency(invoice.amount)}
					</span>
					<span className="text-xs font-medium text-primary">Pagar</span>
				</div>
			</div>
		</div>
	);
}

export function AuthSidebarInvoicesMock() {
	return (
		<div className="rounded-xl border bg-card shadow-sm">
			<div className="border-b px-4 py-3">
				<span className="text-sm font-medium text-foreground">Faturas</span>
				<p className="mt-0.5 text-xs text-muted-foreground">
					Resumo das faturas do período
				</p>
			</div>
			<div className="px-4">
				{MOCK_INVOICES.map((invoice, index) => (
					<MockInvoiceItem
						key={invoice.cardName}
						invoice={invoice}
						divider={index < MOCK_INVOICES.length - 1}
					/>
				))}
			</div>
		</div>
	);
}
