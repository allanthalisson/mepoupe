---
name: Replit pnpm and preview
description: Environment constraints relevant to publishing and previewing this Next.js app.
---

The Replit Node.js 20 module currently provides pnpm 10.26.1. A package.json packageManager entry for an unavailable pnpm 11 release can make every pnpm command loop while trying to self-install.

**Why:** The project became unable to build locally before the application command ran when its packageManager version diverged from the installed Replit toolchain.

**How to apply:** Keep the packageManager entry aligned with the Replit-provided pnpm runtime, and include REPLIT_DEV_DOMAIN in Next.js allowedDevOrigins for proxied preview resources.