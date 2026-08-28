CREATE TABLE "anexos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"chave_arquivo" text NOT NULL,
	"nome_arquivo" text NOT NULL,
	"tamanho_bytes" integer NOT NULL,
	"mime_type" text NOT NULL,
	"conteudo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "anexos_chave_arquivo_unique" UNIQUE("chave_arquivo")
);
--> statement-breakpoint
CREATE TABLE "orcamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"periodo" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"categoria_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pre_lancamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"source_app" text NOT NULL,
	"source_app_name" text,
	"original_title" text,
	"original_text" text NOT NULL,
	"notification_timestamp" timestamp with time zone NOT NULL,
	"parsed_name" text,
	"parsed_amount" numeric(12, 2),
	"status" text DEFAULT 'pending' NOT NULL,
	"lancamento_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anotacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titulo" text,
	"descricao" text,
	"tipo" text DEFAULT 'nota' NOT NULL,
	"tasks" text,
	"arquivada" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pagadores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"email" text,
	"avatar_url" text,
	"status" text DEFAULT 'ativo' NOT NULL,
	"anotacao" text,
	"role" text,
	"is_auto_send" boolean DEFAULT false NOT NULL,
	"share_code" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights_salvos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"period" text NOT NULL,
	"model_id" text NOT NULL,
	"data" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anexos_lancamento" (
	"lancamento_id" uuid NOT NULL,
	"anexo_id" uuid NOT NULL,
	CONSTRAINT "anexos_lancamento_lancamento_id_anexo_id_pk" PRIMARY KEY("lancamento_id","anexo_id")
);
--> statement-breakpoint
ALTER TABLE "lancamentos" ADD COLUMN "ofx_import_fingerprint" text;--> statement-breakpoint
ALTER TABLE "lancamentos" ADD COLUMN "import_batch_id" text;--> statement-breakpoint
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_lancamentos" ADD CONSTRAINT "pre_lancamentos_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pre_lancamentos" ADD CONSTRAINT "pre_lancamentos_lancamento_id_lancamentos_id_fk" FOREIGN KEY ("lancamento_id") REFERENCES "public"."lancamentos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anotacoes" ADD CONSTRAINT "anotacoes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagadores" ADD CONSTRAINT "pagadores_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights_salvos" ADD CONSTRAINT "insights_salvos_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anexos_lancamento" ADD CONSTRAINT "anexos_lancamento_lancamento_id_lancamentos_id_fk" FOREIGN KEY ("lancamento_id") REFERENCES "public"."lancamentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anexos_lancamento" ADD CONSTRAINT "anexos_lancamento_anexo_id_anexos_id_fk" FOREIGN KEY ("anexo_id") REFERENCES "public"."anexos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orcamentos_user_id_period_idx" ON "orcamentos" USING btree ("user_id","periodo");