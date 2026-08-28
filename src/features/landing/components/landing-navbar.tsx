import Link from "next/link";
import { Suspense } from "react";
import { getLandingAccessState } from "@/features/landing/queries";
import { AnimatedThemeToggler } from "@/shared/components/animated-theme-toggler";
import { NavbarShell } from "@/shared/components/navigation/navbar/navbar-shell";
import { Button } from "@/shared/components/ui/button";
import { navLinks } from "../constants";
import { MobileNav } from "./mobile-nav";

async function LandingNavbarControls() {
	const { isPublicDomain, isLoggedIn, signupDisabled } =
		await getLandingAccessState();

	return (
		<>
			{!isPublicDomain &&
				(isLoggedIn ? (
					<Link prefetch href="/dashboard" className="hidden md:block">
						<Button
							variant="navbar"
							size="sm"
							className="h-9 text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground shadow-none dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
						>
							Dashboard
						</Button>
					</Link>
				) : (
					<div className="hidden md:flex items-center gap-1">
						<Link href="/login">
							<Button
								variant="ghost"
								size="sm"
								className="h-9 text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground shadow-none dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
							>
								Entrar
							</Button>
						</Link>
						{!signupDisabled && (
							<Link href="/signup">
								<Button
									variant="ghost"
									size="sm"
									className="h-9 text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground shadow-none dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
								>
									Começar
								</Button>
							</Link>
						)}
					</div>
				))}
			<MobileNav
				isPublicDomain={isPublicDomain}
				isLoggedIn={isLoggedIn}
				signupDisabled={signupDisabled}
			/>
		</>
	);
}

function LandingNavbarControlsFallback() {
	return (
		<>
			<div className="hidden h-9 w-36 md:block" aria-hidden="true" />
			<MobileNav isPublicDomain isLoggedIn={false} signupDisabled />
		</>
	);
}

export function LandingNavbar() {
	return (
		<NavbarShell>
			<nav className="hidden md:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
				{navLinks.map(({ href, label }) => (
					<Link
						key={href}
						href={href}
						className="inline-flex h-9 items-center justify-center rounded-md px-2 text-sm font-medium leading-none text-primary-foreground/75 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
					>
						{label}
					</Link>
				))}
			</nav>

			<nav className="ml-auto flex items-center gap-1">
				<AnimatedThemeToggler variant="navbar" />
				<Suspense fallback={<LandingNavbarControlsFallback />}>
					<LandingNavbarControls />
				</Suspense>
			</nav>
		</NavbarShell>
	);
}
