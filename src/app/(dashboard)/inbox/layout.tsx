import { RiAtLine } from "@remixicon/react";
import PageDescription from "@/shared/components/page-description";

export const metadata = {
	title: "Pré-Lançamentos",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-6">
			<PageDescription
				icon={<RiAtLine />}
				title="Pré-Lançamentos"
				subtitle="Lançamentos pendentes de revisão"
			/>
			{children}
		</section>
	);
}
