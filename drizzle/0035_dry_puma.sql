CREATE TABLE "compartilhamentos_conta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conta_id" uuid NOT NULL,
	"shared_with_user_id" text NOT NULL,
	"permission" text DEFAULT 'read' NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "compartilhamentos_conta" ADD CONSTRAINT "compartilhamentos_conta_conta_id_contas_id_fk" FOREIGN KEY ("conta_id") REFERENCES "public"."contas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compartilhamentos_conta" ADD CONSTRAINT "compartilhamentos_conta_shared_with_user_id_user_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compartilhamentos_conta" ADD CONSTRAINT "compartilhamentos_conta_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "compartilhamentos_conta_unique" ON "compartilhamentos_conta" USING btree ("conta_id","shared_with_user_id");--> statement-breakpoint
CREATE INDEX "compartilhamentos_conta_shared_with_user_id_idx" ON "compartilhamentos_conta" USING btree ("shared_with_user_id");--> statement-breakpoint
CREATE INDEX "compartilhamentos_conta_conta_id_idx" ON "compartilhamentos_conta" USING btree ("conta_id");