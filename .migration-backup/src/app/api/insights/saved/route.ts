import { NextResponse } from "next/server";
import {
	fetchSavedInsights,
	savedInsightsPeriodSchema,
} from "@/features/insights/queries";
import { getOptionalUserSession } from "@/shared/lib/auth/server";

const PRIVATE_RESPONSE_HEADERS = {
	"Cache-Control": "private, no-store",
};

export async function GET(request: Request) {
	const period = new URL(request.url).searchParams.get("period") ?? "";
	const validatedPeriod = savedInsightsPeriodSchema.safeParse(period);

	if (!validatedPeriod.success) {
		return NextResponse.json(
			{
				error: validatedPeriod.error.issues[0]?.message ?? "Período inválido.",
			},
			{
				status: 400,
				headers: PRIVATE_RESPONSE_HEADERS,
			},
		);
	}

	const session = await getOptionalUserSession();
	if (!session?.user) {
		return NextResponse.json(
			{ error: "Não autenticado" },
			{ status: 401, headers: PRIVATE_RESPONSE_HEADERS },
		);
	}

	const insights = await fetchSavedInsights(
		session.user.id,
		validatedPeriod.data,
	);

	return NextResponse.json(insights, {
		headers: PRIVATE_RESPONSE_HEADERS,
	});
}
