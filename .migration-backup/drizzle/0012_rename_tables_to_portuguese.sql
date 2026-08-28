-- Migration: Rename English table names to Portuguese
-- This migration renames tables to maintain consistency with the codebase

-- Rename tables
ALTER TABLE "user_preferences" RENAME TO "preferencias_usuario";
ALTER TABLE "pagador_shares" RENAME TO "compartilhamentos_pagador";
ALTER TABLE "saved_insights" RENAME TO "insights_salvos";
ALTER TABLE "api_tokens" RENAME TO "tokens_api";
ALTER TABLE "inbox_items" RENAME TO "pre_lancamentos";
ALTER TABLE "installment_anticipations" RENAME TO "antecipacoes_parcelas";

-- Rename indexes for preferencias_usuario (was user_preferences)
-- The unique constraint index name is auto-generated, keeping it as is since Drizzle handles it

-- Rename indexes for compartilhamentos_pagador (was pagador_shares)
ALTER INDEX IF EXISTS "pagador_shares_unique" RENAME TO "compartilhamentos_pagador_unique";

-- Rename indexes for insights_salvos (was saved_insights)
ALTER INDEX IF EXISTS "saved_insights_user_period_idx" RENAME TO "insights_salvos_user_period_idx";

-- Rename indexes for tokens_api (was api_tokens)
ALTER INDEX IF EXISTS "api_tokens_user_id_idx" RENAME TO "tokens_api_user_id_idx";
ALTER INDEX IF EXISTS "api_tokens_token_hash_idx" RENAME TO "tokens_api_token_hash_idx";

-- Rename indexes for pre_lancamentos (was inbox_items)
ALTER INDEX IF EXISTS "inbox_items_user_id_status_idx" RENAME TO "pre_lancamentos_user_id_status_idx";
ALTER INDEX IF EXISTS "inbox_items_user_id_created_at_idx" RENAME TO "pre_lancamentos_user_id_created_at_idx";

-- Rename indexes for antecipacoes_parcelas (was installment_anticipations)
ALTER INDEX IF EXISTS "installment_anticipations_series_id_idx" RENAME TO "antecipacoes_parcelas_series_id_idx";
ALTER INDEX IF EXISTS "installment_anticipations_user_id_idx" RENAME TO "antecipacoes_parcelas_user_id_idx";
