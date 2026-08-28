/* Run against a locally running API: API_URL=http://localhost:5000 pnpm --filter @workspace/scripts smoke */
const base = process.env.API_URL ?? "http://localhost:5000";
let cookie = "";

async function call(path: string, init: RequestInit = {}): Promise<{ response: Response; body: any }> {
  const response = await fetch(`${base}/api${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      origin: base,
      ...(cookie ? { cookie } : {}),
      ...(init.headers ?? {}),
    },
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const contentType = response.headers.get("content-type") ?? "";
  const body = response.status === 204
    ? null
    : contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  return { response, body };
}

function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}

async function create(path: string, body: object, label: string) {
  const result = await call(path, { method: "POST", body: JSON.stringify(body) });
  assert(result.response.status === 201, `${label} create failed: ${JSON.stringify(result.body)}`);
  return result.body;
}

async function remove(path: string, label: string) {
  const result = await call(path, { method: "DELETE" });
  assert(result.response.status === 204, `${label} delete failed: ${JSON.stringify(result.body)}`);
}

const today = new Date().toISOString().slice(0, 10);
const period = today.slice(0, 7);
const unique = `smoke-${Date.now()}@example.test`;

assert((await call("/dashboard")).response.status === 401, "dashboard must require authentication");
assert((await call("/auth/sign-up/email", { method: "POST", body: JSON.stringify({ name: "Smoke Test", email: unique, password: "SmokeTest123!" }) })).response.ok, "signup failed");
assert((await call("/auth/get-session")).body?.user?.email === unique, "session missing after signup");
const primaryCookie = cookie;

const hostileRead = await call("/dashboard", { headers: { origin: "https://malicious.example" } });
assert(!hostileRead.response.headers.get("access-control-allow-origin"), "hostile origin received CORS access");
const hostileWrite = await call("/accounts", {
  method: "POST",
  headers: { origin: "https://malicious.example" },
  body: JSON.stringify({ name: "Conta hostil", accountType: "Conta Corrente" }),
});
assert(hostileWrite.response.status === 403, "hostile origin mutation was not rejected");

const account = await create("/accounts", { name: "Conta smoke", accountType: "Conta Corrente" }, "account");
const category = await create("/categories", { name: "Categoria smoke", type: "despesa" }, "category");
const payer = await create("/payers", { name: "Pagador smoke", email: unique }, "payer");
assert((await call("/payers")).body.some((row: any) => row.id === payer.id), "payer list missing created payer");
assert((await call(`/payers/${payer.id}`, { method: "PATCH", body: JSON.stringify({ name: "Pagador atualizado", email: unique }) })).response.ok, "payer update failed");

const note = await create("/notes", { title: "Nota smoke", description: "Persistida" }, "note");
assert((await call("/notes")).body.some((row: any) => row.id === note.id), "note list missing created note");
const insight = await create("/insights", { period, modelId: "smoke", data: { resumo: "Persistido" } }, "insight");
assert((await call("/insights")).body.some((row: any) => row.id === insight.id), "insight list missing created insight");
const inbox = await create("/inbox", { originalText: "Entrada smoke", status: "pending" }, "inbox");
const inboxRead = await call(`/inbox/${inbox.id}`, { method: "PATCH", body: JSON.stringify({ originalText: inbox.originalText, status: "read" }) });
assert(inboxRead.response.ok && inboxRead.body.status === "read", "inbox mark-read failed");

const budget = await create("/budgets", { categoryId: category.id, period, amount: 500 }, "budget");
assert((await call("/budgets")).body.some((row: any) => row.id === budget.id), "budget list missing created budget");
const attachment = await create("/attachments", { fileName: "comprovante.txt", mimeType: "text/plain", content: "conteúdo persistido" }, "attachment");
const download = await call(`/attachments/${attachment.id}/download`);
assert(download.response.ok && download.body === "conteúdo persistido", "attachment download failed");

const card = await create("/cards", { name: "Cartão smoke", accountId: account.id, closingDay: "25", dueDay: "2", limit: 1000 }, "card");
const cardTransaction = await create("/transactions", {
  name: "Compra no cartão",
  amount: 42.5,
  accountId: account.id,
  categoryId: category.id,
  cardId: card.id,
  purchaseDate: today,
  transactionType: "despesa",
}, "card transaction");

const statement = await call(`/accounts/${account.id}/statement`);
assert(statement.response.ok && statement.body.transactions.some((row: any) => row.id === cardTransaction.id), "statement missing persisted transaction");
const invoice = await call(`/cards/${card.id}/invoice`);
assert(invoice.response.ok && invoice.body.transactions.some((row: any) => row.id === cardTransaction.id) && invoice.body.total === 42.5, "invoice missing card transaction");
assert((await call("/calendar")).body.some((row: any) => row.id === cardTransaction.id), "calendar missing transaction");

for (const reportId of ["category-trends", "card-usage", "installments", "establishments"]) {
  const report = await call(`/reports/${reportId}`);
  assert(report.response.ok && Array.isArray(report.body.items), `report ${reportId} failed`);
}

const importRow = {
  name: "Importação smoke",
  amount: 12.34,
  accountId: account.id,
  categoryId: category.id,
  purchaseDate: today,
  transactionType: "despesa",
  fingerprint: `smoke-${Date.now()}`,
};
cookie = "";
const secondEmail = `smoke-second-${Date.now()}@example.test`;
assert((await call("/auth/sign-up/email", { method: "POST", body: JSON.stringify({ name: "Second Smoke User", email: secondEmail, password: "SmokeTest123!" }) })).response.ok, "second-user signup failed");
const secondAccount = await create("/accounts", { name: "Conta de outro usuário", accountType: "Conta Corrente" }, "second-user account");
const secondCategory = await create("/categories", { name: "Categoria de outro usuário", type: "despesa" }, "second-user category");
const secondCookie = cookie;
cookie = primaryCookie;
const crossUserImport = await call("/transactions/import", {
  method: "POST",
  body: JSON.stringify({ rows: [{ ...importRow, accountId: secondAccount.id, categoryId: secondCategory.id }] }),
});
assert(crossUserImport.response.status === 400, "cross-user transaction import was not rejected");
cookie = secondCookie;
await remove(`/categories/${secondCategory.id}`, "second-user category");
await remove(`/accounts/${secondAccount.id}`, "second-user account");
assert((await call("/auth/sign-out", { method: "POST", body: "{}" })).response.ok, "second-user logout failed");
cookie = primaryCookie;
const firstImport = await call("/transactions/import", { method: "POST", body: JSON.stringify({ rows: [importRow] }) });
assert(firstImport.response.status === 201 && firstImport.body.imported === 1 && firstImport.body.skipped === 0, "first transaction import failed");
const duplicateImport = await call("/transactions/import", { method: "POST", body: JSON.stringify({ rows: [importRow] }) });
assert(duplicateImport.response.status === 201 && duplicateImport.body.imported === 0 && duplicateImport.body.skipped === 1, "transaction import deduplication failed");

assert((await call("/dashboard")).body?.recent?.length > 0, "dashboard did not reflect persisted transactions");

const allTransactions = await call("/transactions");
for (const transaction of allTransactions.body.filter((row: any) => row.id === cardTransaction.id || row.name === importRow.name)) {
  await remove(`/transactions/${transaction.id}`, "transaction");
}
await remove(`/attachments/${attachment.id}`, "attachment");
await remove(`/budgets/${budget.id}`, "budget");
await remove(`/inbox/${inbox.id}`, "inbox");
await remove(`/insights/${insight.id}`, "insight");
await remove(`/notes/${note.id}`, "note");
await remove(`/payers/${payer.id}`, "payer");
await remove(`/cards/${card.id}`, "card");
await remove(`/categories/${category.id}`, "category");
await remove(`/accounts/${account.id}`, "account");

assert((await call("/auth/sign-out", { method: "POST", body: "{}" })).response.ok, "logout failed");
assert((await call("/dashboard")).response.status === 401, "dashboard must require authentication after logout");
console.log("OpenMonetis full feature smoke test passed.");

export {};