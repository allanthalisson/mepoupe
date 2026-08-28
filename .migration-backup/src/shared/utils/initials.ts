/**
 * Builds a 2-character initials string from a name.
 * Falls back to the provided `fallback` (default "??") when the name is empty.
 */
export function buildInitials(value: string, fallback = "??"): string {
	const parts = value.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return fallback;
	if (parts.length === 1) {
		const firstPart = parts[0];
		return firstPart ? firstPart.slice(0, 2).toUpperCase() : fallback;
	}
	const firstChar = parts[0]?.[0] ?? "";
	const secondChar = parts[1]?.[0] ?? "";
	return `${firstChar}${secondChar}`.toUpperCase() || fallback;
}
