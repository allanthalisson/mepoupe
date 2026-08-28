import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, categories } from "@workspace/db";
import * as schema from "@workspace/db/schema";
import { baseURL, trustedOrigins } from "./origins";

if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET must be set");

export const auth = betterAuth({
  secret: process.env.SESSION_SECRET,
  baseURL,
  trustedOrigins,
  database: drizzleAdapter(db, { provider: "pg", schema, camelCase: true }),
  emailAndPassword: { enabled: true, autoSignIn: true },
  advanced: { cookiePrefix: "openmonetis", cookieOptions: { sameSite: "lax", secure: process.env.NODE_ENV === "production", httpOnly: true } },
  databaseHooks: { user: { create: { after: async (newUser) => {
    await db.insert(categories).values([
      { userId: newUser.id, name: "Salário", type: "receita", icon: "wallet" },
      { userId: newUser.id, name: "Alimentação", type: "despesa", icon: "utensils" },
      { userId: newUser.id, name: "Moradia", type: "despesa", icon: "home" },
    ]);
  } } } },
});