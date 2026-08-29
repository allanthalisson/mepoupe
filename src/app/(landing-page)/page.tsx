import { RiShieldCheckLine, RiSmartphoneLine } from "@remixicon/react";
import Image from "next/image";
import { Suspense } from "react";
import { AnimateOnScroll } from "@/features/landing/components/animate-on-scroll";
import {
	LandingAuthCta,
	LandingAuthCtaFallback,
} from "@/features/landing/components/landing-auth-cta";
import { LandingNavbar } from "@/features/landing/components/landing-navbar";
import {
	extraFeatures,
	mainFeatures,
	pwaHighlights,
	whoIsItForItems,
} from "@/features/landing/constants";
import { landingImages } from "@/features/landing/images";
import { getLandingCopyrightYear } from "@/features/landing/queries";
import { Logo } from "@/shared/components/brand/logo";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";

export default async function Page() {
	const copyrightYear = await getLandingCopyrightYear();

	return (
		<div className="flex min-h-screen flex-col">
			{/* Navigation */}
			<LandingNavbar />

			{/* Hero Section */}
			<section className="relative overflow-hidden pt-14 md:pt-20 lg:pt-24 pb-0">
				<div className="max-w-8xl mx-auto px-4 relative">
					<div className="mx-auto flex max-w-4xl flex-col items-center text-center gap-5 md:gap-6 pb-10 md:pb-14">
						<Badge variant="outline">Gestão financeira pessoal</Badge>

						<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold">
							Suas finanças,
							<span className="text-gradient-brand"> do seu jeito</span>
						</h1>

						<p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl px-4 sm:px-0">
							Lance suas contas, cartões e gastos em um só lugar. Simples de
							usar, direto do navegador, com seus dados sempre sob seu controle.
						</p>

						<Suspense
							fallback={
								<LandingAuthCtaFallback className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4 sm:px-0" />
							}
						>
							<LandingAuthCta className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4 sm:px-0" />
						</Suspense>
					</div>

					<div className="mx-auto max-w-6xl">
						<div className="rounded-t-xl overflow-hidden border-x border-t bg-card">
							<div className="flex items-center gap-1.5 px-3 h-8 border-b bg-muted/50">
								<div className="size-2.5 rounded-full bg-muted-foreground/20" />
								<div className="size-2.5 rounded-full bg-muted-foreground/20" />
								<div className="size-2.5 rounded-full bg-muted-foreground/20" />
								<div className="ml-2 flex-1 max-w-52 h-4 rounded bg-muted-foreground/10" />
							</div>
							<Image
								src={landingImages.hero.light}
								alt="me.poupe Dashboard Preview"
								width={1920}
								height={1080}
								className="w-full h-auto dark:hidden"
								priority
							/>
							<Image
								src={landingImages.hero.dark}
								alt="me.poupe Dashboard Preview"
								width={1920}
								height={1080}
								className="w-full h-auto hidden dark:block"
								priority
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="funcionalidades" className="py-12 md:py-24">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-6xl">
						<AnimateOnScroll>
							<div className="text-center mb-8 md:mb-12">
								<Badge variant="outline" className="mb-4">
									O que tem aqui
								</Badge>
								<h2 className="text-2xl sm:text-3xl md:text-4xl mb-3 md:mb-4 font-semibold">
									Funcionalidades que importam
								</h2>
								<p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
									Ferramentas simples para organizar suas contas, cartões,
									gastos e receitas
								</p>
							</div>
						</AnimateOnScroll>

						<AnimateOnScroll>
							<div className="grid gap-4 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{[...mainFeatures, ...extraFeatures].map((feature) => (
									<Card key={feature.title} className="hover-lift">
										<CardContent>
											<div className="flex items-center gap-3 mb-3">
												<div
													className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
													style={{
														backgroundColor: `color-mix(in oklch, ${feature.colorVar} 20%, transparent)`,
													}}
												>
													<feature.icon
														className="size-5"
														style={{ color: "var(--foreground)" }}
													/>
												</div>
												<h3 className="font-semibold text-base leading-tight">
													{feature.title}
												</h3>
											</div>
											<p className="text-sm text-muted-foreground leading-relaxed">
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
			<section id="mobile" className="py-12 md:py-24">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-6xl">
						{/* Header */}
						<AnimateOnScroll>
							<div className="text-center mb-12 md:mb-20">
								<Badge variant="outline" className="mb-4">
									<RiSmartphoneLine className="size-3.5 mr-1" />
									Mobile
								</Badge>
								<h2 className="text-2xl sm:text-3xl md:text-4xl mb-3 md:mb-4 font-semibold">
									Use o me.poupe no celular sem perder o fluxo
								</h2>
								<p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
									Instale como PWA para acesso rápido no dia a dia, direto da
									tela inicial do seu celular.
								</p>
							</div>
						</AnimateOnScroll>

						{/* PWA — imagem esquerda, texto direita */}
						<AnimateOnScroll>
							<div className="grid gap-10 lg:gap-16 lg:grid-cols-2 items-center mb-16 md:mb-24">
								<div className="flex justify-center">
									<div className="relative">
										<div className="absolute inset-0 bg-primary/8 rounded-3xl blur-3xl scale-90" />
										<Image
											src={landingImages.pwa.light}
											alt="Preview PWA"
											width={390}
											height={844}
											className="relative h-auto w-56 md:w-64 rounded-3xl shadow-lg dark:hidden"
										/>
										<Image
											src={landingImages.pwa.dark}
											alt="Preview PWA"
											width={390}
											height={844}
											className="relative h-auto w-56 md:w-64 rounded-3xl shadow-lg hidden dark:block"
										/>
									</div>
								</div>
								<div>
									<Badge variant="outline" className="mb-4">
										<RiSmartphoneLine className="size-3.5 mr-1" />
										PWA instalável
									</Badge>
									<h3 className="text-2xl md:text-3xl font-medium tracking-tight mb-3">
										Leve o me.poupe para a tela inicial
									</h3>
									<p className="text-muted-foreground mb-6 leading-relaxed">
										Adicione à tela inicial e abra direto, como um app. Sem
										depender de uma aba perdida no navegador. Funciona em
										Android, iOS e desktop.
									</p>
									<ul className="space-y-3">
										{pwaHighlights.map((item) => (
											<li key={item.title} className="flex items-start gap-3">
												<div
													className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
													style={{
														backgroundColor: `color-mix(in oklch, ${item.colorVar} 20%, transparent)`,
													}}
												>
													<item.icon
														className="size-[15px]"
														style={{ color: "var(--foreground)" }}
													/>
												</div>
												<p className="text-sm">
													<span className="font-medium">{item.title}</span>
													<span className="text-muted-foreground">
														{" "}
														— {item.description}
													</span>
												</p>
											</li>
										))}
									</ul>
								</div>
							</div>
						</AnimateOnScroll>
					</div>
				</div>
			</section>

			{/* Who is this for Section */}
			<section id="para-quem-e" className="py-12 md:py-24">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-4xl">
						<AnimateOnScroll>
							<div className="text-center mb-8 md:mb-12">
								<Badge variant="outline" className="mb-4">
									Para quem é?
								</Badge>
								<h2 className="text-2xl sm:text-3xl md:text-4xl mb-3 md:mb-4 font-semibold">
									Feito para quem gosta de controle
								</h2>
								<p className="text-base md:text-lg text-muted-foreground px-4 sm:px-0">
									O me.poupe não é para todo mundo.
								</p>
							</div>
						</AnimateOnScroll>

						<AnimateOnScroll>
							<div className="space-y-3 md:space-y-4">
								{whoIsItForItems.map((item) => (
									<Card key={item.title}>
										<CardContent>
											<div className="flex gap-3 md:gap-4">
												<div
													className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full"
													style={{
														backgroundColor: `color-mix(in oklch, ${item.colorVar} 20%, transparent)`,
													}}
												>
													<item.icon
														className="size-[18px] md:size-5"
														style={{ color: "var(--foreground)" }}
													/>
												</div>
												<div>
													<h3 className="font-semibold mb-1">{item.title}</h3>
													<p className="text-xs sm:text-sm text-muted-foreground">
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
			<section className="py-12 md:py-24">
				<div className="max-w-8xl mx-auto px-4">
					<AnimateOnScroll>
						<div className="mx-auto max-w-4xl rounded-2xl border bg-card px-8 py-12 md:py-16 text-center">
							<h2 className="text-2xl sm:text-3xl md:text-4xl mb-3 md:mb-4 font-semibold">
								Pronto para testar?
							</h2>
							<p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8">
								Crie sua conta e comece a organizar suas finanças hoje mesmo.
							</p>
							<Suspense
								fallback={
									<LandingAuthCtaFallback className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center" />
								}
							>
								<LandingAuthCta className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center" />
							</Suspense>
						</div>
					</AnimateOnScroll>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t py-8 md:py-12 mt-auto">
				<div className="max-w-8xl mx-auto px-4">
					<div className="mx-auto max-w-5xl">
						<div className="grid gap-8 sm:grid-cols-2">
							<div>
								<Logo />
								<p className="text-sm text-muted-foreground mt-3 md:mt-4">
									Gestão financeira pessoal, simples e no seu controle.
								</p>
							</div>

							<div>
								<h3 className="font-semibold mb-3 md:mb-4">Navegação</h3>
								<ul className="space-y-2.5 md:space-y-3 text-sm text-muted-foreground">
									<li>
										<a
											href="#funcionalidades"
											className="hover:text-foreground transition-colors"
										>
											Funcionalidades
										</a>
									</li>
									<li>
										<a
											href="#mobile"
											className="hover:text-foreground transition-colors"
										>
											Mobile
										</a>
									</li>
									<li>
										<a
											href="#para-quem-e"
											className="hover:text-foreground transition-colors"
										>
											Para quem é
										</a>
									</li>
								</ul>
							</div>
						</div>

						<div className="border-t mt-8 md:mt-12 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-sm text-muted-foreground">
							<p>
								© {copyrightYear} me.poupe. Baseado no projeto original de
								Felipe Coutinho.
							</p>
							<div className="flex items-center gap-2">
								<RiShieldCheckLine className="size-4 text-primary" />
								<span>Seus dados, sempre protegidos</span>
							</div>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
