import { connection } from "next/server";
import { PlanningPage } from "@/features/planning/components/planning-page";
import { fetchPlanningPageData } from "@/features/planning/queries";
import { getUserId } from "@/shared/lib/auth/server";

export default async function Page() {
	await connection();
	const userId = await getUserId();
	const data = await fetchPlanningPageData(userId);
	return <PlanningPage data={data} />;
}
