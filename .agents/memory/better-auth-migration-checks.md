---
name: Better Auth migration checks
description: Durable validation rules for Better Auth upgrades and non-browser smoke clients.
---

When migrating or upgrading Better Auth, verify the active database schema against the installed package version and exercise auth through the same origin policy used by browsers.

**Why:** A visually correct client and successful typecheck can still hide runtime schema drift. Non-browser smoke clients can also fail origin protection even though browser requests are valid, or falsely pass if origin checks are bypassed.

**How to apply:** After schema changes, run an additive database migration, then test signup, session lookup, protected data access, sign-out, and post-sign-out rejection. Smoke clients should send a valid `Origin` and retain the session cookie exactly as a browser would.