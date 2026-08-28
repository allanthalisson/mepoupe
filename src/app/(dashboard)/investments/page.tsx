import { connection } from "next/server";
import { InvestmentsPage } from "@/features/investments/components/investments-page";
import { fetchInvestmentsPageData } from "@/features/investments/queries";
import { getUserId } from "@/shared/lib/auth/server";

export default async function Page() {
	await connection();
	const userId = await getUserId();
	const data = await fetchInvestmentsPageData(userId);
	return <InvestmentsPage data={data} />;
}
