import { sql } from "drizzle-orm";
import { boolean, date, index, integer, numeric, pgTable, primaryKey, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Better Auth's canonical tables retain the imported application's camelCase mappings.
export const user = pgTable("user", {
  id: text("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(), image: text("image"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
});
export const account = pgTable("account", {
  id: text("id").primaryKey(), accountId: text("accountId").notNull(), providerId: text("providerId").notNull(),
  issuer: text("issuer").notNull().default("credential"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"), refreshToken: text("refreshToken"), idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { withTimezone: true }),
  scope: text("scope"), password: text("password"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull(), updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
}, t => ({ userIdIdx: index("account_user_id_idx").on(t.userId) }));
export const session = pgTable("session", {
  id: text("id").primaryKey(), expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(), createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(), ipAddress: text("ipAddress"), userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
}, t => ({ userIdIdx: index("session_user_id_idx").on(t.userId) }));
export const verification = pgTable("verification", {
  id: text("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }), updatedAt: timestamp("updatedAt", { withTimezone: true }),
});

export const financialAccounts = pgTable("contas", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), name: text("nome").notNull(),
  accountType: text("tipo_conta").notNull(), note: text("anotacao"), status: text("status").notNull().default("ativa"),
  logo: text("logo").notNull().default(""), initialBalance: numeric("saldo_inicial", { precision: 12, scale: 2 }).notNull().default("0"),
  excludeFromBalance: boolean("excluir_do_saldo").notNull().default(false),
  excludeInitialBalanceFromIncome: boolean("excluir_saldo_inicial_receitas").notNull().default(false),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => ({ userIdIdx: index("contas_user_id_idx").on(t.userId) }));
export const categories = pgTable("categorias", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), name: text("nome").notNull(), type: text("tipo").notNull(),
  icon: text("icone"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
}, t => ({ userIdTypeIdx: index("categorias_user_id_type_idx").on(t.userId, t.type) }));
export const cards = pgTable("cartoes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), name: text("nome").notNull(),
  closingDay: text("dt_fechamento").notNull(), dueDay: text("dt_vencimento").notNull(), note: text("anotacao"),
  limit: numeric("limite", { precision: 10, scale: 2 }).notNull().default("0"), brand: text("bandeira"), logo: text("logo"),
  status: text("status").notNull().default("ativo"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: uuid("conta_id").notNull().references(() => financialAccounts.id, { onDelete: "cascade" }),
});
export const transactions = pgTable("lancamentos", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), condition: text("condicao").notNull().default("realizado"),
  name: text("nome").notNull(), paymentMethod: text("forma_pagamento").notNull().default("conta"), note: text("anotacao"),
  amount: numeric("valor", { precision: 12, scale: 2 }).notNull(), purchaseDate: date("data_compra", { mode: "date" }).notNull(),
  transactionType: text("tipo_transacao").notNull(), installmentCount: smallint("qtde_parcela"), period: text("periodo").notNull(),
  currentInstallment: smallint("parcela_atual"), dueDate: date("data_vencimento", { mode: "date" }),
  isSettled: boolean("realizado").notNull().default(true), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  cardId: uuid("cartao_id").references(() => cards.id, { onDelete: "cascade" }),
  accountId: uuid("conta_id").references(() => financialAccounts.id, { onDelete: "cascade" }),
  categoryId: uuid("categoria_id").references(() => categories.id, { onDelete: "cascade" }),
  ofxImportFingerprint: text("ofx_import_fingerprint"), importBatchId: text("import_batch_id"),
}, t => ({ userPeriodIdx: index("lancamentos_user_id_period_idx").on(t.userId, t.period), userDateIdx: index("lancamentos_user_id_purchase_date_idx").on(t.userId, t.purchaseDate) }));

export const budgets = pgTable("orcamentos", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), amount: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  period: text("periodo").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  categoryId: uuid("categoria_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
}, t => ({ userPeriodIdx: index("orcamentos_user_id_period_idx").on(t.userId, t.period) }));
export const payers = pgTable("pagadores", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), name: text("nome").notNull(), email: text("email"),
  avatarUrl: text("avatar_url"), status: text("status").notNull().default("ativo"), note: text("anotacao"),
  role: text("role"), isAutoSend: boolean("is_auto_send").notNull().default(false), shareCode: text("share_code").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});
export const notes = pgTable("anotacoes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), title: text("titulo"), description: text("descricao"),
  type: text("tipo").notNull().default("nota"), tasks: text("tasks"), archived: boolean("arquivada").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});
export const savedInsights = pgTable("insights_salvos", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  period: text("period").notNull(), modelId: text("model_id").notNull(), data: text("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const inboxItems = pgTable("pre_lancamentos", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  sourceApp: text("source_app").notNull(), sourceAppName: text("source_app_name"), originalTitle: text("original_title"),
  originalText: text("original_text").notNull(), notificationTimestamp: timestamp("notification_timestamp", { withTimezone: true }).notNull(),
  parsedName: text("parsed_name"), parsedAmount: numeric("parsed_amount", { precision: 12, scale: 2 }), status: text("status").notNull().default("pending"),
  transactionId: uuid("lancamento_id").references(() => transactions.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const attachments = pgTable("anexos", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  fileKey: text("chave_arquivo").notNull().unique(), fileName: text("nome_arquivo").notNull(), fileSize: integer("tamanho_bytes").notNull(),
  mimeType: text("mime_type").notNull(), content: text("conteudo"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const transactionAttachments = pgTable("anexos_lancamento", {
  transactionId: uuid("lancamento_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  attachmentId: uuid("anexo_id").notNull().references(() => attachments.id, { onDelete: "cascade" }),
}, t => ({ pk: primaryKey({ columns: [t.transactionId, t.attachmentId] }) }));