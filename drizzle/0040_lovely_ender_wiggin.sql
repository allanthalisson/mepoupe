CREATE TABLE "candidatos_investimento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticker" text NOT NULL,
	"nome" text NOT NULL,
	"classe_ativo" text NOT NULL,
	"preco_atual" numeric(16, 4),
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
	"ultimo_erro" text,
	"sincronizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sugestoes_dispensadas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"ticker" text NOT NULL,
	"dispensado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sugestoes_dispensadas" ADD CONSTRAINT "sugestoes_dispensadas_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "candidatos_investimento_ticker_idx" ON "candidatos_investimento" USING btree ("ticker");--> statement-breakpoint
CREATE INDEX "candidatos_investimento_classe_ativo_idx" ON "candidatos_investimento" USING btree ("classe_ativo");--> statement-breakpoint
CREATE UNIQUE INDEX "sugestoes_dispensadas_user_ticker_idx" ON "sugestoes_dispensadas" USING btree ("user_id","ticker");