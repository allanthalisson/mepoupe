#!/bin/bash
set -e

pnpm install --frozen-lockfile
# Development-only, non-destructive schema reconciliation. Tracked migrations
# remain the source of truth for releases; this hook never uses --force.
pnpm --filter @workspace/db run push
