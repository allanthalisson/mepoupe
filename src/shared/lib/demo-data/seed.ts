import { and, eq, inArray } from "drizzle-orm";
import {
	cards,
	categories,
	financialAccounts,
	transactions,
} from "@/db/schema";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import { formatDecimalForDbRequired } from "@/shared/utils/currency";
import { addMonthsToDate, getBusinessTodayInfo } from "@/shared/utils/date";
import { derivePeriodFromDate } from "@/shared/utils/period";

/**
 * Dados de exemplo gerados no onboarding para quem ainda não importou
 * transações reais. Tudo marcado com `isDemo` na conta (cartões e
 * lançamentos ficam vinculados a ela e somem em cascata em `resetDemoData`).
 */

const DEMO_ACCOUNT = {
	name: "Nubank",
	accountType: "Carteira Digital",
	status: "Ativa",
	logo: "nubank.png",
	initialBalance: "3200.00",
} as const;

const DEMO_CHECKING_ACCOUNT = {
	name: "Itaú",
	accountType: "Conta Corrente",
	status: "Ativa",
	logo: "itau.png",
	initialBalance: "6500.00",
} as const;

const DEMO_CARD = {
	name: "Nubank Mastercard",
	brand: "Mastercard",
	status: "Ativo",
	logo: "nubank.png",
	limit: "4000.00",
	closingDay: "20",
	dueDay: "27",
} as const;

type DemoTransactionTemplate = {
	name: string;
	categoryName: string;
	transactionType: "Despesa" | "Receita";
	amount: number;
	paymentMethod: string;
	destination: "checking" | "wallet" | "card";
	day: number;
};

// Lançamentos ilustrativos, gerados tanto no mês atual quanto no anterior
// para o dashboard ter alguma comparação entre períodos.
const DEMO_TRANSACTIONS: DemoTransactionTemplate[] = [
	{
		name: "Salário",
		categoryName: "Salário",
		transactionType: "Receita",
		amount: 6800,
		paymentMethod: "Transferência bancária",
		destination: "checking",
		day: 5,
	},
	{
		name: "Aluguel",
		categoryName: "Moradia",
		transactionType: "Despesa",
		amount: 1800,
		paymentMethod: "Transferência bancária",
		destination: "checking",
		day: 10,
	},
	{
		name: "Energia e água",
		categoryName: "Energia e água",
		transactionType: "Despesa",
		amount: 220,
		paymentMethod: "Boleto",
		destination: "checking",
		day: 12,
	},
	{
		name: "Internet",
		categoryName: "Internet",
		transactionType: "Despesa",
		amount: 120,
		paymentMethod: "Boleto",
		destination: "checking",
		day: 15,
	},
	{
		name: "Mercado do mês",
		categoryName: "Mercado",
		transactionType: "Despesa",
		amount: 450,
		paymentMethod: "Pix",
		destination: "wallet",
		day: 8,
	},
	{
		name: "Farmácia",
		categoryName: "Saúde",
		transactionType: "Despesa",
		amount: 90,
		paymentMethod: "Pix",
		destination: "wallet",
		day: 18,
	},
	{
		name: "iFood",
		categoryName: "Delivery",
		transactionType: "Despesa",
		amount: 65,
		paymentMethod: "Cartão de crédito",
		destination: "card",
		day: 3,
	},
	{
		name: "Uber",
		categoryName: "Transporte",
		transactionType: "Despesa",
		amount: 38,
		paymentMethod: "Cartão de crédito",
		destination: "card",
		day: 6,
	},
	{
		name: "Netflix",
		categoryName: "Assinaturas",
		transactionType: "Despesa",
		amount: 55,
		paymentMethod: "Cartão de crédito",
		destination: "card",
		day: 1,
	},
	{
		name: "Spotify",
		categoryName: "Assinaturas",
		transactionType: "Despesa",
		amount: 22,
		paymentMethod: "Cartão de crédito",
		destination: "card",
		day: 1,
	},
	{
		name: "Posto de gasolina",
		categoryName: "Transporte",
		transactionType: "Despesa",
		amount: 180,
		paymentMethod: "Cartão de crédito",
		destination: "card",
		day: 14,
	},
	{
		name: "Cinema",
		categoryName: "Lazer",
		transactionType: "Despesa",
		amount: 60,
		paymentMethod: "Cartão de crédito",
		destination: "card",
		day: 20,
	},
	{
		name: "Restaurante",
		categoryName: "Restaurantes",
		transactionType: "Despesa",
		amount: 130,
		paymentMethod: "Cartão de crédito",
		destination: "card",
		day: 22,
	},
	{
		name: "Loja de roupas",
		categoryName: "Vestuário",
		transactionType: "Despesa",
		amount: 210,
		paymentMethod: "Cartão de crédito",
		destination: "card",
		day: 17,
	},
];

function toDateOnlyString(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

/**
 * Cria contas, um cartão e ~26 lançamentos (mês atual + anterior) marcados
 * como demo. Não faz nada se o usuário já tiver dados de exemplo.
 */
export async function seedDemoData(userId: string): Promise<void> {
	const existingDemo = await db.query.financialAccounts.findFirst({
		columns: { id: true },
		where: and(
			eq(financialAccounts.userId, userId),
			eq(financialAccounts.isDemo, true),
		),
	});
	if (existingDemo) return;

	const adminPayerId = await getAdminPayerId(userId);
	if (!adminPayerId) {
		throw new Error(
			"Pessoa com papel administrador não encontrada para gerar dados de exemplo.",
		);
	}

	const userCategories = await db
		.select({ id: categories.id, name: categories.name })
		.from(categories)
		.where(eq(categories.userId, userId));
	const categoryIdByName = new Map(
		userCategories.map((c) => [c.name, c.id] as const),
	);

	const { date: today } = getBusinessTodayInfo();

	await db.transaction(async (tx) => {
		const [walletAccount] = await tx
			.insert(financialAccounts)
			.values({
				...DEMO_ACCOUNT,
				excludeFromBalance: false,
				excludeInitialBalanceFromIncome: true,
				isDemo: true,
				userId,
			})
			.returning({ id: financialAccounts.id });

		const [checkingAccount] = await tx
			.insert(financialAccounts)
			.values({
				...DEMO_CHECKING_ACCOUNT,
				excludeFromBalance: false,
				excludeInitialBalanceFromIncome: true,
				isDemo: true,
				userId,
			})
			.returning({ id: financialAccounts.id });

		if (!walletAccount || !checkingAccount) {
			throw new Error("Não foi possível criar as contas de exemplo.");
		}

		const [card] = await tx
			.insert(cards)
			.values({
				...DEMO_CARD,
				userId,
				accountId: walletAccount.id,
			})
			.returning({ id: cards.id });

		if (!card) {
			throw new Error("Não foi possível criar o cartão de exemplo.");
		}

		const accountIdByDestination = {
			wallet: walletAccount.id,
			checking: checkingAccount.id,
			card: null,
		} as const;

		const rows = DEMO_TRANSACTIONS.flatMap((template) => {
			const categoryId = categoryIdByName.get(template.categoryName) ?? null;
			const amountSign = template.transactionType === "Despesa" ? -1 : 1;
			const amount = formatDecimalForDbRequired(
				Math.abs(template.amount) * amountSign,
			);

			return [0, -1].map((monthOffset) => {
				const purchaseDate = addMonthsToDate(
					new Date(today.getFullYear(), today.getMonth(), template.day),
					monthOffset,
				);
				const purchaseDateString = toDateOnlyString(purchaseDate);

				return {
					name: template.name,
					transactionType: template.transactionType,
					condition: "À vista" as const,
					paymentMethod: template.paymentMethod,
					note: null,
					accountId: accountIdByDestination[template.destination],
					cardId: template.destination === "card" ? card.id : null,
					categoryId,
					payerId: adminPayerId,
					isDivided: false,
					userId,
					seriesId: null,
					amount,
					purchaseDate,
					period: derivePeriodFromDate(purchaseDateString),
					isSettled: purchaseDate <= today,
					installmentCount: null,
					currentInstallment: null,
					recurrenceCount: null,
					dueDate: null,
					boletoPaymentDate: null,
				};
			});
		});

		await tx.insert(transactions).values(rows);
	});
}

/**
 * Remove todas as contas demo do usuário. Cartões e lançamentos vinculados
 * somem em cascata (FK onDelete: cascade em `cartoes`/`lancamentos`).
 */
export async function resetDemoData(
	userId: string,
): Promise<{ removed: number }> {
	const demoAccounts = await db
		.select({ id: financialAccounts.id })
		.from(financialAccounts)
		.where(
			and(
				eq(financialAccounts.userId, userId),
				eq(financialAccounts.isDemo, true),
			),
		);

	if (demoAccounts.length === 0) return { removed: 0 };

	await db.delete(financialAccounts).where(
		inArray(
			financialAccounts.id,
			demoAccounts.map((a) => a.id),
		),
	);

	return { removed: demoAccounts.length };
}

export async function hasDemoData(userId: string): Promise<boolean> {
	const row = await db.query.financialAccounts.findFirst({
		columns: { id: true },
		where: and(
			eq(financialAccounts.userId, userId),
			eq(financialAccounts.isDemo, true),
		),
	});
	return !!row;
}
