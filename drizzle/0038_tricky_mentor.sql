CREATE TABLE "integracoes_usuario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"brapi_token" text,
	"ai_api_keys" jsonb,
	"consultant_model_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integracoes_usuario_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "integracoes_usuario" ADD CONSTRAINT "integracoes_usuario_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;