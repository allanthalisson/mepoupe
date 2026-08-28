import { after, connection } from "next/server";
import { InvestmentsPage } from "@/features/investments/components/investments-page";
import { fetchInvestmentsPageData } from "@/features/investments/queries";
import { getUserId } from "@/shared/lib/auth/server";
import { syncUserMarketData } from "@/shared/lib/market-data/sync";

export default async function Page() {
	await connection();
	const userId = await getUserId();
	const data = await fetchInvestmentsPageData(userId);
	after(async () => {
		try {
			await syncUserMarketData(userId);
		} catch (error) {
			console.error("Stale market refresh failed:", error);
		}
	});
	return <InvestmentsPage data={data} />;
}
