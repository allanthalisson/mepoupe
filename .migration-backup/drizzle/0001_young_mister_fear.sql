CREATE INDEX "cartoes_user_id_status_idx" ON "cartoes" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "categorias_user_id_type_idx" ON "categorias" USING btree ("user_id","tipo");--> statement-breakpoint
CREATE INDEX "contas_user_id_status_idx" ON "contas" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "faturas_user_id_period_idx" ON "faturas" USING btree ("user_id","periodo");--> statement-breakpoint
CREATE INDEX "faturas_cartao_id_period_idx" ON "faturas" USING btree ("cartao_id","periodo");--> statement-breakpoint
CREATE INDEX "lancamentos_user_id_period_idx" ON "lancamentos" USING btree ("user_id","periodo");--> statement-breakpoint
CREATE INDEX "lancamentos_user_id_purchase_date_idx" ON "lancamentos" USING btree ("user_id","data_compra");--> statement-breakpoint
CREATE INDEX "lancamentos_series_id_idx" ON "lancamentos" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX "lancamentos_transfer_id_idx" ON "lancamentos" USING btree ("transfer_id");--> statement-breakpoint
CREATE INDEX "lancamentos_user_id_condition_idx" ON "lancamentos" USING btree ("user_id","condicao");--> statement-breakpoint
CREATE INDEX "lancamentos_cartao_id_period_idx" ON "lancamentos" USING btree ("cartao_id","periodo");--> statement-breakpoint
CREATE INDEX "orcamentos_user_id_period_idx" ON "orcamentos" USING btree ("user_id","periodo");--> statement-breakpoint
CREATE INDEX "pagadores_user_id_status_idx" ON "pagadores" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "pagadores_user_id_role_idx" ON "pagadores" USING btree ("user_id","role");