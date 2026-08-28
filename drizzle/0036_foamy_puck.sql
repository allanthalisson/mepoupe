CREATE TABLE "dividas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"credor" text,
	"saldo_devedor" numeric(14, 2) NOT NULL,
	"taxa_juros_anual" numeric(8, 4) DEFAULT '0' NOT NULL,
	"pagamento_minimo" numeric(14, 2) DEFAULT '0' NOT NULL,
	"pagamento_planejado" numeric(14, 2) DEFAULT '0' NOT NULL,
	"dia_vencimento" smallint,
	"status" text DEFAULT 'active' NOT NULL,
	"anotacao" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metas_financeiras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"tipo_meta" text NOT NULL,
	"valor_alvo" numeric(14, 2) NOT NULL,
	"valor_atual" numeric(14, 2) DEFAULT '0' NOT NULL,
	"aporte_mensal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"data_alvo" date,
	"prioridade" smallint DEFAULT 2 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"anotacao" text,
	"conta_id" uuid,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ativos_investimento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"ticker" text,
	"classe_ativo" text NOT NULL,
	"instituicao" text,
	"quantidade" numeric(20, 8) DEFAULT '0' NOT NULL,
	"preco_medio" numeric(16, 4) DEFAULT '0' NOT NULL,
	"preco_atual" numeric(16, 4) DEFAULT '0' NOT NULL,
	"renda_mensal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"alocacao_alvo" numeric(5, 2) DEFAULT '0' NOT NULL,
	"anotacao" text,
	"meta_id" uuid,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dividas" ADD CONSTRAINT "dividas_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metas_financeiras" ADD CONSTRAINT "metas_financeiras_conta_id_contas_id_fk" FOREIGN KEY ("conta_id") REFERENCES "public"."contas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metas_financeiras" ADD CONSTRAINT "metas_financeiras_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativos_investimento" ADD CONSTRAINT "ativos_investimento_meta_id_metas_financeiras_id_fk" FOREIGN KEY ("meta_id") REFERENCES "public"."metas_financeiras"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ativos_investimento" ADD CONSTRAINT "ativos_investimento_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dividas_user_id_status_idx" ON "dividas" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "metas_financeiras_user_id_status_idx" ON "metas_financeiras" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "metas_financeiras_conta_id_idx" ON "metas_financeiras" USING btree ("conta_id");--> statement-breakpoint
CREATE INDEX "ativos_investimento_user_id_idx" ON "ativos_investimento" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ativos_investimento_meta_id_idx" ON "ativos_investimento" USING btree ("meta_id");