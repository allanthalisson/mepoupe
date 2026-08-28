CREATE TABLE "consultorias_financeiras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"periodo" text NOT NULL,
	"modelo_id" text,
	"status" text DEFAULT 'deterministic' NOT NULL,
	"dados" jsonb NOT NULL,
	"dados_mercado_atualizados_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "snapshots_mercado" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"ativo_id" uuid NOT NULL,
	"ticker" text NOT NULL,
	"fonte" text DEFAULT 'brapi' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"preco_mercado" numeric(16, 4),
	"pl" numeric(16, 6),
	"pvp" numeric(16, 6),
	"ev_ebit" numeric(16, 6),
	"dividend_yield" numeric(16, 6),
	"roe" numeric(16, 6),
	"liquidez_corrente" numeric(16, 6),
	"divida_patrimonio" numeric(16, 6),
	"crescimento_receita" numeric(16, 6),
	"margem_lucro" numeric(16, 6),
	"vacancia" numeric(16, 6),
	"quantidade_imoveis" integer,
	"liquidez_diaria" numeric(18, 2),
	"dados_brutos" jsonb,
	"cotacao_atualizada_em" timestamp with time zone,
	"fundamentos_atualizados_em" timestamp with time zone,
	"ultimo_erro" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consultorias_financeiras" ADD CONSTRAINT "consultorias_financeiras_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots_mercado" ADD CONSTRAINT "snapshots_mercado_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots_mercado" ADD CONSTRAINT "snapshots_mercado_ativo_id_ativos_investimento_id_fk" FOREIGN KEY ("ativo_id") REFERENCES "public"."ativos_investimento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "consultorias_financeiras_user_period_idx" ON "consultorias_financeiras" USING btree ("user_id","periodo");--> statement-breakpoint
CREATE UNIQUE INDEX "snapshots_mercado_ativo_idx" ON "snapshots_mercado" USING btree ("ativo_id");--> statement-breakpoint
CREATE INDEX "snapshots_mercado_user_id_idx" ON "snapshots_mercado" USING btree ("user_id");