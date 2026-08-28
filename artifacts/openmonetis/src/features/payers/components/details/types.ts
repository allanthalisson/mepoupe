export type PayerInfo = {
	id: string;
	name: string;
	email: string | null;
	avatarUrl: string | null;
	status: string;
	note: string | null;
	role: string | null;
	isAutoSend: boolean;
	createdAt: string;
	lastMailAt: string | null;
	shareCode: string | null;
	canEdit: boolean;
};

export type PayerSummaryPreview = {
	periodLabel: string;
	totalExpenses: number;
	paymentSplits: {
		card: number;
		boleto: number;
		instant: number;
	};
	cardUsage: { name: string; amount: number }[];
	boletoStats: {
		totalAmount: number;
		paidAmount: number;
		pendingAmount: number;
		paidCount: number;
		pendingCount: number;
	};
	lancamentoCount: number;
};
