export const PAYER_STATUS_OPTIONS = ["Ativo", "Inativo"] as const;

export type PayerStatus = (typeof PAYER_STATUS_OPTIONS)[number];

export const PAYER_ROLE_ADMIN = "admin";
export const PAYER_ROLE_THIRD_PARTY = "terceiro";
export const DEFAULT_PAYER_AVATAR = "default_icon.png";
