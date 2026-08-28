import {
	RiAndroidLine,
	RiGithubFill,
	RiShieldCheckLine,
	RiSmartphoneLine,
} from "@remixicon/react";
import { Link } from "wouter";
import { AnimateOnScroll } from "@/components/landing/AnimateOnScroll";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { SetupTabs } from "@/components/landing/SetupTabs";
import {
	companionBanks,
	companionSteps,
	extraFeatures,
	getMetricsItems,
	mainFeatures,
	pwaHighlights,
	stackItems,
	whoIsItForItems,
} from "@/features/landing/constants";
import { landingImages } from "@/features/landing/images";
import { Logo } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function LandingPage() {
	const metricsItems = getMetricsItems(120, 15); // Mock stats
    const copyrightYear = new Date().getFullYear();

	return (
		<div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
			<LandingNavbar />

			{/* Hero Section */}
			<section className="relative overflow-hidden pt-24 md:pt-32 lg:pt-40 pb-0">
				<div className="max-w-[90rem] mx-auto px-4 relative">
					<div className="mx-auto flex max-w-4xl flex-col items-center text-center gap-5 md:gap-6 pb-10 md:pb-14">
						<Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-primary/20 text-primary">
							<RiGithubFill className="size-4 mr-1.5" />
							Projeto Open Source
						</Badge>

						<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground">
							Suas finanças,
							<span className="text-primary block mt-1 sm:inline sm:mt-0"> do seu jeito</span>
						</h1>

						<p className="text-lg md:text-xl text-muted-foreground max-w-2xl px-4 sm:px-0">
							Gestão financeira self-hosted e open source. Lance manualmente ou
							capture notificações bancárias direto pelo{" "}
							<span className="text-foreground font-medium">
								Companion para Android
							</span>
							. Seus dados, seu servidor.
						</p>

						<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4 sm:px-0 mt-2">
							<a
										href="https://github.com/felipegcoutinho/openmonetis"
										target="_blank"
										rel="noreferrer"
										className={cn(buttonVariants({ size: "lg" }), "gap-2 w-full sm:w-auto h-12 px-8 text-base")}
									>
										<RiGithubFill className="size-5" />
										Baixar no GitHub
									</a>
								<a
										href="https://github.com/felipegcoutinho/openmonetis#readme"
										target="_blank"
										rel="noreferrer"
										className={cn(buttonVariants({ size: "lg", variant: "outline" }), "gap-2 w-full sm:w-auto h-12 px-8 text-base")}
									>
										Ver Documentação
									</a>
						</div>
					</div>

					<div className="mx-auto max-w-6xl mt-8">
						<div className="rounded-t-2xl overflow-hidden border-x border-t bg-card shadow-2xl shadow-primary/5">
							<div className="flex items-center gap-1.5 px-4 h-10 border-b bg-muted/30">
								<div className="size-3 rounded-full bg-red-500/80" />
								<div className="size-3 rounded-full bg-amber-500/80" />
								<div className="size-3 rounded-full bg-green-500/80" />
								<div className="ml-3 flex-1 max-w-xs h-5 rounded-md bg-background/50 border shadow-sm flex items-center px-2">
                                    <span className="text-[10px] text-muted-foreground">localhost:3000</span>
                                </div>
							</div>
							<img
								src={landingImages.hero.light}
								alt="OpenMonetis Dashboard Preview"
								className="w-full h-auto dark:hidden"
							/>
							<img
								src={landingImages.hero.dark}
								alt="OpenMonetis Dashboard Preview"
								className="w-full h-auto hidden dark:block"
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Metrics Bar */}
			<section className="py-10 md:py-16 border-y bg-muted/10">
				<div className="max-w-[90rem] mx-auto px-4">
					<div className="mx-auto max-w-5xl">
						<div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
							{metricsItems.map(({ icon: Icon, value, label, colorVar }) => (
								<div
									key={label}
									className="flex flex-col items-center text-center gap-2 p-4 rounded-xl hover:bg-muted/30 transition-colors"
								>
									<div className="p-3 rounded-full mb-2 bg-background border shadow-sm">
                                        <Icon className="size-6" style={{ color: colorVar }} />
                                    </div>
									<span className="text-3xl md:text-4xl font-semibold tracking-tight">
										{value}
									</span>
									<span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
										{label}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="funcionalidades" className="py-20 md:py-32">
				<div className="max-w-[90rem] mx-auto px-4">
					<div className="mx-auto max-w-6xl">
						<AnimateOnScroll>
							<div className="text-center mb-12 md:mb-20">
								<Badge variant="outline" className="mb-6 bg-muted">
									O que tem aqui
								</Badge>
								<h2 className="text-3xl sm:text-4xl md:text-5xl mb-4 md:mb-6 font-semibold tracking-tight">
									Funcionalidades que importam
								</h2>
								<p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
									Ferramentas simples para organizar suas contas, cartões,
									gastos e receitas. Sem firulas que você nunca vai usar.
								</p>
							</div>
						</AnimateOnScroll>

						<AnimateOnScroll>
							<div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
								{[...mainFeatures, ...extraFeatures].map((feature) => (
									<Card key={feature.title} className="bg-card/50 hover:bg-card transition-colors border-border/50">
										<CardContent className="p-6 md:p-8">
											<div className="flex items-center gap-4 mb-4">
												<div
													className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
													style={{
														backgroundColor: `color-mix(in oklch, ${feature.colorVar} 15%, transparent)`,
													}}
												>
													<feature.icon
														className="size-6"
														style={{ color: "var(--foreground)" }}
													/>
												</div>
												<h3 className="font-semibold text-lg leading-tight">
													{feature.title}
												</h3>
											</div>
											<p className="text-muted-foreground leading-relaxed">
												{feature.description}
											</p>
										</CardContent>
									</Card>
								))}
							</div>
						</AnimateOnScroll>
					</div>
				</div>
			</section>

			{/* Mobile Section */}
			<section id="mobile" className="py-20 md:py-32 bg-muted/10 border-y">
				<div className="max-w-[90rem] mx-auto px-4">
					<div className="mx-auto max-w-6xl">
						{/* Header */}
						<AnimateOnScroll>
							<div className="text-center mb-16 md:mb-24">
								<Badge variant="outline" className="mb-6 bg-background">
									<RiSmartphoneLine className="size-4 mr-1.5" />
									Mobile
								</Badge>
								<h2 className="text-3xl sm:text-4xl md:text-5xl mb-4 md:mb-6 font-semibold tracking-tight">
									No celular, sem perder o fluxo
								</h2>
								<p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
									Instale como PWA para acesso rápido no dia a dia. No Android,
									use o Companion para capturar notificações bancárias automaticamente.
								</p>
							</div>
						</AnimateOnScroll>

						{/* PWA — imagem esquerda, texto direita */}
						<AnimateOnScroll>
							<div className="grid gap-12 lg:gap-20 lg:grid-cols-2 items-center mb-24 md:mb-32">
								<div className="flex justify-center relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
									<div className="relative border-[8px] border-border/50 rounded-[40px] shadow-2xl bg-background overflow-hidden">
										<img
											src={landingImages.pwa.light}
											alt="Preview PWA"
											className="h-auto w-[250px] md:w-[280px] dark:hidden"
										/>
										<img
											src={landingImages.pwa.dark}
											alt="Preview PWA"
											className="h-auto w-[250px] md:w-[280px] hidden dark:block"
										/>
									</div>
								</div>
								<div>
									<Badge variant="outline" className="mb-5 bg-background">
										<RiSmartphoneLine className="size-4 mr-1.5" />
										PWA instalável
									</Badge>
									<h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
										Leve para a tela inicial
									</h3>
									<p className="text-lg text-muted-foreground mb-8 leading-relaxed">
										Adicione à tela inicial e abra direto, como um app nativo. Sem
										depender de uma aba perdida no navegador. Funciona perfeitamente em
										Android, iOS e desktop.
									</p>
									<ul className="space-y-5">
										{pwaHighlights.map((item) => (
											<li key={item.title} className="flex items-start gap-4">
												<div
													className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background border shadow-sm"
												>
													<item.icon
														className="size-5"
														style={{ color: item.colorVar }}
													/>
												</div>
												<div>
													<span className="block font-medium text-lg mb-1">{item.title}</span>
													<span className="text-muted-foreground">
														{item.description}
													</span>
												</div>
											</li>
										))}
									</ul>
								</div>
							</div>
						</AnimateOnScroll>

						{/* Companion — texto esquerda, imagem direita */}
						<AnimateOnScroll>
							<div className="grid gap-12 lg:gap-20 lg:grid-cols-2 items-center">
								<div className="order-last lg:order-first">
									<Badge variant="outline" className="mb-5 bg-background text-green-600 border-green-600/20">
										<RiAndroidLine className="size-4 mr-1.5" />
										Companion Android
									</Badge>
									<h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
										Capture, envie e revise
									</h3>
									<p className="text-lg text-muted-foreground mb-8 leading-relaxed">
										O Companion fica rodando no fundo. Ele captura notificações de apps bancários e cria
										pré-lançamentos automaticamente para você revisar na inbox, sem precisar digitar nada.
									</p>
									<div className="relative pl-6 mb-8 border-l-2 border-muted">
										{companionSteps.map((step, index) => (
											<div key={step.title} className="mb-6 last:mb-0 relative">
                                                <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />
												<div className="flex gap-4">
                                                    <div className="mt-0.5">
                                                        <step.icon
                                                            className="size-5"
                                                            style={{ color: "var(--foreground)" }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <span className="block font-medium mb-0.5">{step.title}</span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {step.description}
                                                        </span>
                                                    </div>
                                                </div>
											</div>
										))}
									</div>
									<div className="bg-background p-5 rounded-xl border">
										<p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
											Bancos homologados
										</p>
										<div className="flex flex-wrap gap-2.5">
											{companionBanks.map((bank) => (
												<span
													key={bank.name}
													className="inline-flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5 text-sm font-medium"
												>
													{bank.name}
												</span>
											))}
										</div>
										<a
											href="https://github.com/felipegcoutinho/openmonetis-companion"
											target="_blank"
                                            rel="noreferrer"
											className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
										>
											<RiGithubFill className="size-4" />
											Ver repositório do Companion &rarr;
										</a>
									</div>
								</div>
								<div className="flex justify-center relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/20 rounded-full blur-[80px]" />
									<div className="relative border-[8px] border-border/50 rounded-[40px] shadow-2xl bg-background overflow-hidden">
										<img
											src={landingImages.companion.light}
											alt="Preview Companion"
											className="h-auto w-[250px] md:w-[280px] dark:hidden"
										/>
										<img
											src={landingImages.companion.dark}
											alt="Preview Companion"
											className="h-auto w-[250px] md:w-[280px] hidden dark:block"
										/>
									</div>
								</div>
							</div>
						</AnimateOnScroll>
					</div>
				</div>
			</section>

			{/* How to run Section */}
			<section id="como-usar" className="py-20 md:py-32">
				<div className="max-w-[90rem] mx-auto px-4">
					<div className="mx-auto max-w-4xl">
						<AnimateOnScroll>
							<div className="text-center mb-12 md:mb-16">
								<Badge variant="outline" className="mb-6 bg-muted">
									Como usar
								</Badge>
								<h2 className="text-3xl sm:text-4xl md:text-5xl mb-4 md:mb-6 font-semibold tracking-tight">
									Rode no seu servidor
								</h2>
								<p className="text-lg md:text-xl text-muted-foreground px-4 sm:px-0">
									Não há versão hospedada online como SaaS. Você precisa rodar localmente ou na sua VPS.
								</p>
							</div>
						</AnimateOnScroll>

						<AnimateOnScroll>
                            <div className="bg-card border rounded-2xl p-2 shadow-xl shadow-primary/5">
							    <SetupTabs />
                            </div>
						</AnimateOnScroll>

						<div className="mt-8 text-center">
							<a
								href="https://github.com/felipegcoutinho/openmonetis#-início-rápido"
								target="_blank"
                                rel="noreferrer"
								className="text-primary hover:underline font-medium"
							>
								Ver documentação completa →
							</a>
						</div>
					</div>
				</div>
			</section>

			{/* Who is this for Section */}
			<section id="para-quem-e" className="py-20 md:py-32 bg-muted/10 border-t">
				<div className="max-w-[90rem] mx-auto px-4">
					<div className="mx-auto max-w-5xl">
						<AnimateOnScroll>
							<div className="text-center mb-12 md:mb-20">
								<h2 className="text-3xl sm:text-4xl md:text-5xl mb-4 md:mb-6 font-semibold tracking-tight">
									Feito para quem gosta de controle
								</h2>
								<p className="text-lg md:text-xl text-muted-foreground px-4 sm:px-0 max-w-2xl mx-auto">
									O OpenMonetis não é para todo mundo. Ele foi desenhado para um perfil muito específico de usuário.
								</p>
							</div>
						</AnimateOnScroll>

						<AnimateOnScroll>
							<div className="grid sm:grid-cols-2 gap-4 md:gap-6">
								{whoIsItForItems.map((item) => (
									<Card key={item.title} className="bg-background border-border/50">
										<CardContent className="p-6">
											<div className="flex gap-4">
												<div
													className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted"
												>
													<item.icon
														className="size-6"
														style={{ color: "var(--foreground)" }}
													/>
												</div>
												<div>
													<h3 className="font-semibold text-lg mb-1">{item.title}</h3>
													<p className="text-muted-foreground leading-relaxed">
														{item.description}
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</AnimateOnScroll>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 md:py-32">
				<div className="max-w-[90rem] mx-auto px-4">
					<AnimateOnScroll>
						<div className="mx-auto max-w-5xl rounded-[40px] border bg-gradient-to-b from-card to-muted/20 px-8 py-16 md:py-24 text-center shadow-2xl shadow-primary/5">
							<h2 className="text-3xl sm:text-4xl md:text-5xl mb-4 md:mb-6 font-semibold tracking-tight">
								Pronto para testar?
							</h2>
							<p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
								Clone o repositório, rode localmente e veja se faz sentido pra
								você. É open source, transparente e 100% gratuito.
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<a
										href="https://github.com/felipegcoutinho/openmonetis"
										target="_blank"
										rel="noreferrer"
										className={cn(buttonVariants({ size: "lg" }), "gap-2 w-full sm:w-auto h-14 px-8 text-lg")}
									>
										<RiGithubFill className="size-6" />
										Baixar Projeto
									</a>
                                    <Link href="/dashboard" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "gap-2 w-full sm:w-auto h-14 px-8 text-lg bg-background")}>
                                        Ver Demonstração
                                    </Link>
							</div>
						</div>
					</AnimateOnScroll>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t py-12 md:py-16 mt-auto bg-muted/30">
				<div className="max-w-[90rem] mx-auto px-4">
					<div className="mx-auto max-w-5xl">
						<div className="grid gap-12 sm:grid-cols-2 md:grid-cols-3">
							<div className="sm:col-span-2 md:col-span-1">
								<Logo variant="compact" colorIcon />
								<p className="text-muted-foreground mt-6 leading-relaxed">
									Projeto pessoal de gestão financeira. Open source e
									self-hosted. Sem telemetria, sem tracking.
								</p>
							</div>

							<div>
								<h3 className="font-semibold text-lg mb-6">Projeto</h3>
								<ul className="space-y-4 text-muted-foreground">
									<li>
										<a
											href="https://github.com/felipegcoutinho/openmonetis"
											target="_blank"
                                            rel="noreferrer"
											className="hover:text-foreground transition-colors flex items-center gap-2"
										>
											<RiGithubFill className="size-5" />
											GitHub
										</a>
									</li>
									<li>
										<a
											href="https://github.com/felipegcoutinho/openmonetis#readme"
											target="_blank"
                                            rel="noreferrer"
											className="hover:text-foreground transition-colors"
										>
											Documentação
										</a>
									</li>
									<li>
										<a
											href="https://github.com/felipegcoutinho/openmonetis/issues"
											target="_blank"
                                            rel="noreferrer"
											className="hover:text-foreground transition-colors"
										>
											Reportar Bug
										</a>
									</li>
								</ul>
							</div>

							<div>
								<h3 className="font-semibold text-lg mb-6">Aplicativos</h3>
								<ul className="space-y-4 text-muted-foreground">
									<li>
										<a
											href="https://github.com/felipegcoutinho/openmonetis-companion"
											target="_blank"
                                            rel="noreferrer"
											className="hover:text-foreground transition-colors flex items-center gap-2"
										>
											<RiAndroidLine className="size-5" />
											Companion Android
										</a>
									</li>
								</ul>
							</div>
						</div>

						<div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-muted-foreground">
							<p>
								© {copyrightYear} OpenMonetis. MIT License.
							</p>
							<div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-full border shadow-sm">
								<RiShieldCheckLine className="size-4 text-primary" />
								<span className="text-sm font-medium">Seus dados, seu servidor</span>
							</div>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
