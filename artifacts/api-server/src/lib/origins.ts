const normalizeOrigin = (origin: string) => origin.replace(/\/$/, "");

const previewOrigin = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : undefined;
const replitOrigins = (process.env.REPLIT_DOMAINS ?? "")
  .split(",")
  .filter(Boolean)
  .map((domain) => `https://${domain}`);

export const baseURL = normalizeOrigin(
  process.env.BETTER_AUTH_URL ?? previewOrigin ?? "http://localhost:8080",
);

export const trustedOrigins = Array.from(
  new Set(
    [
      baseURL,
      "http://localhost:8080",
      previewOrigin,
      ...replitOrigins,
    ]
      .filter((origin): origin is string => Boolean(origin))
      .map(normalizeOrigin),
  ),
);

export function isTrustedOrigin(origin: string | undefined): boolean {
  return Boolean(origin && trustedOrigins.includes(normalizeOrigin(origin)));
}