import {
	RiBankCard2Line,
	RiBarChartBoxLine,
	RiCalendarLine,
	RiDownloadCloudLine,
	RiErrorWarningLine,
	RiEyeOffLine,
	RiFileTextLine,
	RiFlashlightLine,
	RiLayoutGridLine,
	RiLineChartLine,
	RiLockLine,
	RiPercentLine,
	RiPieChartLine,
	RiRobot2Line,
	RiShieldCheckLine,
	RiSmartphoneLine,
	RiTeamLine,
	RiTimeLine,
	RiWalletLine,
} from "@remixicon/react";
import type { ComponentType } from "react";

type FeatureItem = {
	icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
	title: string;
	description: string;
	colorVar: string;
};

export const navLinks = [
	{ href: "#funcionalidades", label: "Funcionalidades" },
	{ href: "#mobile", label: "Mobile" },
	{ href: "#para-quem-e", label: "Para quem é" },
] as const;

export const mainFeatures: FeatureItem[] = [
	{
		icon: RiWalletLine,
		title: "Contas e transações",
		description:
			"Contas bancárias, cartões e dinheiro em um só lugar, se organize como preferir.",
		colorVar: "var(--data-5)",
	},
	{
		icon: RiPercentLine,
		title: "Parcelamentos avançados",
		description:
			"Controle compras parceladas e antecipe parcelas com cálculo automático de desconto.",
		colorVar: "var(--data-4)",
	},
	{
		icon: RiRobot2Line,
		title: "Insights com IA",
		description:
			"Análises por IA com insights sobre padrões de gastos e recomendações personalizadas.",
		colorVar: "var(--data-6)",
	},
	{
		icon: RiBarChartBoxLine,
		title: "Relatórios e gráficos",
		description:
			"20+ widgets interativos, relatórios por categoria e exportação em PDF e Excel.",
		colorVar: "var(--data-5)",
	},
	{
		icon: RiBankCard2Line,
		title: "Faturas de cartão",
		description:
			"Acompanhe faturas por período, limites e vencimentos de cada cartão.",
		colorVar: "var(--data-1)",
	},
	{
		icon: RiTeamLine,
		title: "Gestão colaborativa",
		description:
			"Compartilhe acesso com permissões granulares (admin/viewer) e notificações por e-mail.",
		colorVar: "var(--data-3)",
	},
];

export const extraFeatures: FeatureItem[] = [
	{
		icon: RiPieChartLine,
		title: "Categorias e orçamentos",
		description:
			"Categorias personalizadas com orçamentos mensais e indicadores visuais de progresso.",
		colorVar: "var(--data-6)",
	},
	{
		icon: RiFileTextLine,
		title: "Anotações e tarefas",
		description:
			"Notas de texto e listas de tarefas com checkboxes e arquivamento.",
		colorVar: "var(--data-6)",
	},
	{
		icon: RiCalendarLine,
		title: "Calendário financeiro",
		description:
			"Visualize transações em calendário mensal para não perder prazos.",
		colorVar: "var(--data-2)",
	},
	{
		icon: RiDownloadCloudLine,
		title: "Importação em massa",
		description: "Importe múltiplos lançamentos de uma só vez.",
		colorVar: "var(--data-5)",
	},
	{
		icon: RiEyeOffLine,
		title: "Modo privacidade",
		description:
			"Oculte valores com um clique. Tema dark/light e calculadora integrada.",
		colorVar: "var(--data-4)",
	},
	{
		icon: RiFlashlightLine,
		title: "Performance otimizada",
		description: "Interface rápida e otimizada para uso diário.",
		colorVar: "var(--data-5)",
	},
];

export const pwaHighlights: FeatureItem[] = [
	{
		icon: RiSmartphoneLine,
		title: "Instale direto da web",
		description: "Adicione à tela inicial e abra como app, sem loja.",
		colorVar: "var(--data-3)",
	},
	{
		icon: RiLayoutGridLine,
		title: "Acesso rápido ao que importa",
		description: "Dashboard, inbox e lançamentos a um toque.",
		colorVar: "var(--data-5)",
	},
	{
		icon: RiFlashlightLine,
		title: "Experiência mobile mais direta",
		description: "Modo standalone com navegação limpa e fluida.",
		colorVar: "var(--data-4)",
	},
];

export const whoIsItForItems: FeatureItem[] = [
	{
		icon: RiTimeLine,
		title: "Tem disciplina de registrar gastos",
		description:
			"Não se importa em dedicar alguns minutos por dia ou semana para manter tudo atualizado",
		colorVar: "var(--data-4)",
	},
	{
		icon: RiLockLine,
		title: "Quer controle total sobre seus dados",
		description:
			"Prefere hospedar seus próprios dados ao invés de depender de serviços terceiros",
		colorVar: "var(--data-5)",
	},
	{
		icon: RiLineChartLine,
		title: "Gosta de entender exatamente onde o dinheiro vai",
		description:
			"Quer visualizar padrões de gastos e tomar decisões informadas",
		colorVar: "var(--data-3)",
	},
	{
		icon: RiTimeLine,
		title: "Não é plug and play",
		description:
			"Você vai precisar configurar as coisas, conectar suas contas e ajustar o sistema para o seu jeito de usar.",
		colorVar: "var(--data-4)",
	},
	{
		icon: RiShieldCheckLine,
		title: "Não é para qualquer um",
		description:
			"Não é uma empresa, não é um SaaS, não é uma plataforma. É um projeto pessoal.",
		colorVar: "var(--data-1)",
	},
	{
		icon: RiErrorWarningLine,
		title: "Não sou responsável por nada",
		description:
			"Não sou responsável por nada que aconteça com você ou com seus dados.",
		colorVar: "var(--data-5)",
	},
];
