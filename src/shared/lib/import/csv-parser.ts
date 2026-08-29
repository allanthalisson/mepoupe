import type {
	ImportedTransaction,
	ImportStatement,
} from "@/shared/lib/import/types";

const HEADER_ALIASES = {
	date: [
		"data",
		"date",
		"data lancamento",
		"data do lancamento",
		"data transacao",
		"data da transacao",
		"transaction date",
		"posted date",
	],
	description: [
		"descricao",
		"description",
		"historico",
		"estabelecimento",
		"lancamento",
		"memo",
		"name",
		"nome",
		"detalhes",
		"details",
		// Fatura do cartão do Nubank exporta em inglês: date,title,amount
		"title",
	],
	amount: [
		"valor",
		"amount",
		"valor lancamento",
		"valor da transacao",
		"transaction amount",
	],
	debit: ["debito", "debit", "saida", "despesa", "withdrawal"],
	credit: ["credito", "credit", "entrada", "receita", "deposit"],
	type: ["tipo", "type", "natureza", "transaction type"],
	category: ["categoria", "category"],
	externalId: ["id", "identificador", "transaction id", "fitid", "documento"],
} as const;

type Field = keyof typeof HEADER_ALIASES;

function normalizeHeader(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim()
		.replace(/[_-]+/g, " ")
		.replace(/\s+/g, " ");
}

function countDelimiter(line: string, delimiter: string): number {
	let count = 0;
	let quoted = false;

	for (let index = 0; index < line.length; index++) {
		const char = line[index];
		if (char === '"') {
			if (quoted && line[index + 1] === '"') index++;
			else quoted = !quoted;
		} else if (!quoted && char === delimiter) {
			count++;
		}
	}

	return count;
}

function detectDelimiter(content: string): string {
	const firstLine = content.split(/\r?\n/, 1)[0] ?? "";
	const candidates = [";", ",", "\t"];
	return candidates.reduce((best, candidate) =>
		countDelimiter(firstLine, candidate) > countDelimiter(firstLine, best)
			? candidate
			: best,
	);
}

function parseRows(content: string, delimiter: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = "";
	let quoted = false;

	for (let index = 0; index < content.length; index++) {
		const char = content[index];

		if (char === '"') {
			if (quoted && content[index + 1] === '"') {
				field += '"';
				index++;
			} else {
				quoted = !quoted;
			}
			continue;
		}

		if (!quoted && char === delimiter) {
			row.push(field.trim());
			field = "";
			continue;
		}

		if (!quoted && (char === "\n" || char === "\r")) {
			if (char === "\r" && content[index + 1] === "\n") index++;
			row.push(field.trim());
			if (row.some((value) => value !== "")) rows.push(row);
			row = [];
			field = "";
			continue;
		}

		field += char;
	}

	row.push(field.trim());
	if (row.some((value) => value !== "")) rows.push(row);
	return rows;
}

function resolveColumns(headers: string[]): Partial<Record<Field, number>> {
	const normalizedHeaders = headers.map(normalizeHeader);
	const columns: Partial<Record<Field, number>> = {};

	for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [
		Field,
		readonly string[],
	][]) {
		const index = normalizedHeaders.findIndex((header) =>
			aliases.includes(header),
		);
		if (index >= 0) columns[field] = index;
	}

	return columns;
}

function parseDate(value: string): string | null {
	const normalized = value.trim();
	const iso = normalized.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
	if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

	const dmy = normalized.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
	if (!dmy) return null;

	const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
	return `${year}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
}

function parseMoney(value: string): number | null {
	const raw = value.trim();
	if (!raw) return null;

	const negative =
		raw.startsWith("-") ||
		raw.endsWith("-") ||
		(raw.startsWith("(") && raw.endsWith(")"));
	let numeric = raw.replace(/[^\d,.-]/g, "").replace(/-/g, "");
	const comma = numeric.lastIndexOf(",");
	const dot = numeric.lastIndexOf(".");

	if (comma >= 0 && dot >= 0) {
		const decimalSeparator = comma > dot ? "," : ".";
		const thousandSeparator = decimalSeparator === "," ? "." : ",";
		numeric = numeric.split(thousandSeparator).join("");
		numeric = numeric.replace(decimalSeparator, ".");
	} else if (comma >= 0) {
		numeric = numeric.replace(/\./g, "").replace(",", ".");
	} else if ((numeric.match(/\./g) ?? []).length > 1) {
		const parts = numeric.split(".");
		const decimals = parts.pop();
		numeric = `${parts.join("")}.${decimals}`;
	}

	const parsed = Number.parseFloat(numeric);
	if (!Number.isFinite(parsed)) return null;
	return negative ? -parsed : parsed;
}

function resolveType(
	value: string | undefined,
): ImportedTransaction["transactionType"] | null {
	if (!value) return null;
	const normalized = normalizeHeader(value);
	if (
		["receita", "entrada", "credito", "credit", "income"].includes(normalized)
	) {
		return "income";
	}
	if (["despesa", "saida", "debito", "debit", "expense"].includes(normalized)) {
		return "expense";
	}
	return null;
}

function valueAt(row: string[], index: number | undefined): string {
	return index === undefined ? "" : (row[index] ?? "").trim();
}

export function parseCsv(content: string, fileName?: string): ImportStatement {
	const cleanContent = content.replace(/^\uFEFF/, "").trim();
	if (!cleanContent) throw new Error("Arquivo CSV vazio.");

	const rows = parseRows(cleanContent, detectDelimiter(cleanContent));
	if (rows.length < 2) throw new Error("CSV vazio ou sem linhas de dados.");

	const normalizedHeaders = rows[0].map(normalizeHeader);
	let columns = resolveColumns(rows[0]);
	const hasAmountColumn =
		columns.amount !== undefined ||
		columns.debit !== undefined ||
		columns.credit !== undefined;

	// Fallback posicional: quando NENHUMA coluna bate com um apelido conhecido
	// (comum em exports de apps de banco com nomes de coluna incomuns), mas o
	// arquivo tem exatamente 3 colunas, assume a ordem mais comum: data,
	// descrição, valor. Só entra em ação quando nada foi reconhecido — se
	// pelo menos uma coluna já bateu, é mais seguro pedir pra ajustar o
	// cabeçalho do que arriscar um mapeamento errado.
	if (
		columns.date === undefined &&
		columns.description === undefined &&
		!hasAmountColumn &&
		rows[0].length === 3
	) {
		columns = { date: 0, description: 1, amount: 2 };
	}

	if (columns.date === undefined || columns.description === undefined) {
		throw new Error(
			'O CSV precisa ter colunas de "Data" e "Descrição" (ou "Histórico").',
		);
	}

	// Faturas de cartão exportadas pelo Nubank (date,title,amount) usam a
	// coluna "title" — um alias que só aparece nesse formato — e seguem a
	// convenção de fatura: valor positivo é despesa (o que você gastou),
	// negativo é estorno/pagamento. Extratos de conta corrente fazem o
	// oposto (positivo = entrada), daí só invertemos quando não há coluna
	// explícita de tipo/débito/crédito para desambiguar.
	const isCardInvoiceFormat =
		normalizedHeaders[columns.description] === "title" &&
		columns.type === undefined &&
		columns.debit === undefined &&
		columns.credit === undefined;
	if (
		columns.amount === undefined &&
		columns.debit === undefined &&
		columns.credit === undefined
	) {
		throw new Error(
			'O CSV precisa ter uma coluna de "Valor" ou colunas de "Débito"/"Crédito".',
		);
	}

	const transactions: ImportedTransaction[] = [];
	for (const row of rows.slice(1)) {
		const date = parseDate(valueAt(row, columns.date));
		const description = valueAt(row, columns.description);
		const amountValue = parseMoney(valueAt(row, columns.amount));
		const debitValue = parseMoney(valueAt(row, columns.debit));
		const creditValue = parseMoney(valueAt(row, columns.credit));
		const explicitType = resolveType(valueAt(row, columns.type));

		let signedAmount = amountValue;
		let transactionType = explicitType;
		if (creditValue !== null && creditValue !== 0) {
			signedAmount = Math.abs(creditValue);
			transactionType ??= "income";
		} else if (debitValue !== null && debitValue !== 0) {
			signedAmount = -Math.abs(debitValue);
			transactionType ??= "expense";
		}

		if (!date || !description || signedAmount === null || signedAmount === 0) {
			continue;
		}
		transactionType ??= isCardInvoiceFormat
			? signedAmount < 0
				? "income"
				: "expense"
			: signedAmount < 0
				? "expense"
				: "income";

		transactions.push({
			externalId: valueAt(row, columns.externalId) || null,
			externalIdOccurrence: 0,
			date,
			amount: Math.abs(signedAmount),
			description,
			sourceDescription: description,
			transactionType,
			categoryRaw: valueAt(row, columns.category) || null,
		});
	}

	if (transactions.length === 0) {
		throw new Error("Nenhuma transação válida encontrada no CSV.");
	}

	const dates = transactions.map((transaction) => transaction.date).sort();
	const source = fileName?.replace(/\.csv$/i, "").trim() || "CSV";

	return {
		source,
		accountNumber: null,
		period: { from: dates[0], to: dates[dates.length - 1] },
		isCreditCard: isCardInvoiceFormat,
		transactions,
	};
}

export function generateCsvTemplate(): string {
	return [
		"Data;Descrição;Valor;Tipo;Categoria",
		"01/03/2026;Salário;3000,00;receita;Salário",
		'02/03/2026;"Mercado, feira do mês";289,90;despesa;Alimentação',
	].join("\r\n");
}
