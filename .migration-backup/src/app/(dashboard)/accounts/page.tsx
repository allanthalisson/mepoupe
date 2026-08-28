import { connection } from "next/server";
import { AccountsPage } from "@/features/accounts/components/accounts-page";
import { fetchAllAccountsForUser } from "@/features/accounts/queries";
import { getUserId } from "@/shared/lib/auth/server";

export default async function Page() {
	await connection();
	const userId = await getUserId();
	const { activeAccounts, archivedAccounts, logoOptions } =
		await fetchAllAccountsForUser(userId);

	return (
		<main className="flex flex-col items-start gap-6">
			<AccountsPage
				accounts={activeAccounts}
				archivedAccounts={archivedAccounts}
				logoOptions={logoOptions}
			/>
		</main>
	);
}
