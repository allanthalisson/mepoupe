import { timingSafeEqual } from "node:crypto";
import { refreshAllFinancialData } from "@/shared/lib/financial-consultant/refresh-all";

export const maxDuration = 300;

function authorized(request: Request) {
	const configured = (
		process.env.MARKET_SYNC_SECRET ?? process.env.BETTER_AUTH_SECRET
	)?.trim();
	const received = request.headers
		.get("authorization")
		?.replace(/^Bearer\s+/i, "")
		.trim();
	if (!configured || !received) return false;
	const expectedBuffer = Buffer.from(configured);
	const receivedBuffer = Buffer.from(received);
	return (
		expectedBuffer.length === receivedBuffer.length &&
		timingSafeEqual(expectedBuffer, receivedBuffer)
	);
}

export async function POST(request: Request) {
	if (!authorized(request))
		return Response.json({ error: "Não autorizado." }, { status: 401 });
	try {
		return Response.json({ ok: true, ...(await refreshAllFinancialData()) });
	} catch (error) {
		console.error("Financial refresh job failed:", error);
		return Response.json(
			{ error: "Atualização indisponível." },
			{ status: 500 },
		);
	}
}
