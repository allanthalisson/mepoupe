---
name: Bulk import ownership
description: Security rule for authenticated batch imports that reference user-owned records.
---

Bulk imports must validate ownership of every distinct referenced resource before beginning the write transaction, even when normal single-record creation already performs equivalent checks.

**Why:** A batch endpoint can bypass the ownership boundary enforced by ordinary CRUD and create cross-user relationships through supplied foreign IDs.

**How to apply:** Resolve and validate all distinct account, category, card, or similar IDs against the authenticated user before inserting any rows. Add a two-user regression test that proves foreign IDs are rejected and create no records.