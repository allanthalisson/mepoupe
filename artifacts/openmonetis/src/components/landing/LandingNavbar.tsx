import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link } from "wouter";
import { RiMoonClearLine, RiSunLine, RiMenuLine } from "@remixicon/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { navLinks } from "@/features/landing/constants";
import { Logo } from "@/components/brand/Logo";

export function AnimatedThemeToggler({ className, variant = "ghost" }: { className?: string, variant?: any }) {
	const [isDark, setIsDark] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		const updateTheme = () => setIsDark(document.documentElement.classList.contains("dark"));
		updateTheme();
		const observer = new MutationObserver(updateTheme);
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
		return () => observer.disconnect();
	}, []);

	const toggleTheme = async () => {
		if (!buttonRef.current) return;
		
        // Simple fallback if view transition is not supported
        if (!document.startViewTransition) {
            const newTheme = !isDark;
            setIsDark(newTheme);
            document.documentElement.classList.toggle("dark");
            localStorage.setItem("theme", newTheme ? "dark" : "light");
            return;
        }

		await document.startViewTransition(() => {
			flushSync(() => {
				const newTheme = !isDark;
				setIsDark(newTheme);
				document.documentElement.classList.toggle("dark");
				localStorage.setItem("theme", newTheme ? "dark" : "light");
			});
		}).ready;

		const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
		const x = left + width / 2;
		const y = top + height / 2;
		const maxRadius = Math.hypot(
			Math.max(left, window.innerWidth - left),
			Math.max(top, window.innerHeight - top),
		);

		document.documentElement.animate(
			{
				clipPath: [
					`circle(0px at ${x}px ${y}px)`,
					`circle(${maxRadius}px at ${x}px ${y}px)`,
				],
			},
			{
				duration: 400,
				easing: "ease-in-out",
				pseudoElement: "::view-transition-new(root)",
			},
		);
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					ref={buttonRef}
					type="button"
					onClick={toggleTheme}
					data-state={isDark ? "dark" : "light"}
					className={cn(
						buttonVariants({ variant, size: "icon" }),
						"group relative transition-all duration-200 h-9 w-9",
						variant === "ghost" &&
							"text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=open]:bg-accent/60 data-[state=open]:text-foreground",
						className,
					)}
				>
					<span
						aria-hidden
						className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-200 data-[state=dark]:opacity-100"
					>
						<span className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/15 dark:from-amber-500/10 dark:to-amber-500/30" />
					</span>
					{isDark ? (
						<RiSunLine className="size-4 transition-transform duration-200" aria-hidden />
					) : (
						<RiMoonClearLine className="size-4 transition-transform duration-200" aria-hidden />
					)}
					<span className="sr-only">{isDark ? "Ativar tema claro" : "Ativar tema escuro"}</span>
				</button>
			</TooltipTrigger>
			<TooltipContent side="bottom" sideOffset={8}>
				{isDark ? "Tema claro" : "Tema escuro"}
			</TooltipContent>
		</Tooltip>
	);
}

export function LandingNavbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

	return (
		<header className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b",
            scrolled ? "bg-background/80 backdrop-blur-md border-border" : "bg-transparent border-transparent"
        )}>
            <div className="max-w-[90rem] mx-auto px-4 h-14 flex items-center">
                <Link href="/">
                    <Logo variant="compact" className="cursor-pointer" />
                </Link>

                <nav className="hidden md:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    {navLinks.map(({ href, label }) => (
                        <a
                            key={href}
                            href={href}
                            className="inline-flex h-9 items-center justify-center rounded-md px-2 text-sm font-medium leading-none text-foreground/75 transition-colors hover:bg-foreground/10 hover:text-foreground"
                        >
                            {label}
                        </a>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-1">
                    <AnimatedThemeToggler />
                    
                    <div className="hidden md:flex items-center gap-1 ml-2">
                        <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-9")}>
                            Entrar
                        </Link>
                        <Link href="/dashboard" className={cn(buttonVariants({ variant: "default", size: "sm" }), "h-9")}>
                            Dashboard
                        </Link>
                    </div>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden ml-1">
                                <RiMenuLine className="size-5" />
                                <span className="sr-only">Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
                            <nav className="flex flex-col gap-4 mt-8">
                                {navLinks.map(({ href, label }) => (
                                    <a
                                        key={href}
                                        href={href}
                                        className="text-lg font-medium text-foreground/80 hover:text-foreground"
                                    >
                                        {label}
                                    </a>
                                ))}
                                <div className="h-px bg-border my-4" />
                                <Link href="/login" className="text-lg font-medium text-foreground/80 hover:text-foreground">
                                    Entrar
                                </Link>
                                <Link href="/dashboard" className="text-lg font-medium text-primary hover:text-primary/80">
                                    Dashboard
                                </Link>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
		</header>
	);
}
