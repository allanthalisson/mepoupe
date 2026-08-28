import type { Metadata } from "next";
import type { ReactNode } from "react";

const BASE_URL = process.env.PUBLIC_DOMAIN
	? `https://${process.env.PUBLIC_DOMAIN}`
	: "https://mepoupe.app";

const TITLE = "me.poupe | Suas finanças, do seu jeito";
const DESCRIPTION =
	"Controle lançamentos, cartões, orçamentos e categorias em um só lugar, com total privacidade.";

export const metadata: Metadata = {
	metadataBase: new URL(BASE_URL),
	title: {
		absolute: TITLE,
	},
	description: DESCRIPTION,
	keywords: [
		"finanças pessoais",
		"controle financeiro",
		"gestão financeira",
		"orçamento pessoal",
		"lançamentos financeiros",
		"cartão de crédito",
		"planejamento financeiro",
	],
	alternates: {
		canonical: "/",
	},
	openGraph: {
		type: "website",
		locale: "pt_BR",
		url: "/",
		siteName: "me.poupe",
		title: TITLE,
		description: DESCRIPTION,
		images: [
			{
				url: "/images/dashboard-preview-light.png",
				width: 1920,
				height: 1080,
				alt: "me.poupe — Dashboard de finanças pessoais",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: TITLE,
		description: DESCRIPTION,
		images: ["/images/dashboard-preview-light.png"],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
};

export default function LandingLayout({ children }: { children: ReactNode }) {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: "me.poupe",
		applicationCategory: "FinanceApplication",
		operatingSystem: "Web",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "BRL",
		},
		description: DESCRIPTION,
		url: BASE_URL,
		isAccessibleForFree: true,
		author: {
			"@type": "Organization",
			name: "me.poupe",
			url: BASE_URL,
		},
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			{children}
		</>
	);
}
