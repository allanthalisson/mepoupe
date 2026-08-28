import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/react";

const baseURL = process.env.BETTER_AUTH_URL?.replace(/\/$/, "");

export const authClient = createAuthClient({
	...(baseURL ? { baseURL } : {}),
	plugins: [passkeyClient()],
});

