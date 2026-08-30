CREATE TABLE "conversas_assistente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"titulo" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mensagens_assistente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversa_id" uuid NOT NULL,
	"papel" text NOT NULL,
	"conteudo" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversas_assistente" ADD CONSTRAINT "conversas_assistente_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensagens_assistente" ADD CONSTRAINT "mensagens_assistente_conversa_id_conversas_assistente_id_fk" FOREIGN KEY ("conversa_id") REFERENCES "public"."conversas_assistente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversas_assistente_user_id_idx" ON "conversas_assistente" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "mensagens_assistente_conversa_id_idx" ON "mensagens_assistente" USING btree ("conversa_id","created_at");