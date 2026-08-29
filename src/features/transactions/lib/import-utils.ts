export function normalizeDescriptionKey(description: string): string {
	return description.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Chave "solta" de estabelecimento: remove acentos, dígitos (IDs de
 * transação, datas, códigos de autorização) e pontuação, mantendo só as
 * palavras. Duas ocorrências do mesmo estabelecimento em datas diferentes
 * (ex.: "UBER *TRIP 384920" e "UBER *TRIP 573921") caem na mesma chave,
 * o que a normalização exata de `normalizeDescriptionKey` não consegue.
 */
export function looseMerchantKey(description: string): string {
	return description
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/\d+/g, " ")
		.replace(/[^a-z\s]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}
