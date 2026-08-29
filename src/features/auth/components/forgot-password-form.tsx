"use client";

import {
	RiArrowLeftLine,
	RiLoader4Line,
	RiMailCheckLine,
} from "@remixicon/react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { authClient } from "@/shared/lib/auth/client";
import { cn } from "@/shared/utils/ui";
import { AuthCardShell } from "./auth-card-shell";
import { AuthErrorAlert } from "./auth-error-alert";
import { AuthHeader } from "./auth-header";

type DivProps = React.ComponentProps<"div">;

export function ForgotPasswordForm({ className, ...props }: DivProps) {
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setLoading(true);

		const { error: requestError } = await authClient.requestPasswordReset({
			email: email.trim().toLowerCase(),
			redirectTo: "/reset-password",
		});

		setLoading(false);

		if (requestError) {
			setError(
				"Não foi possível enviar o link agora. Tente novamente mais tarde.",
			);
			return;
		}

		setSubmitted(true);
		toast.success("Confira seu e-mail para continuar.");
	}

	return (
		<div className={cn("flex flex-col gap-5", className)} {...props}>
			<AuthCardShell>
				<form
					className="flex w-full items-center px-6 py-7 md:px-10 md:py-9"
					onSubmit={handleSubmit}
					noValidate
				>
					<FieldGroup className="mx-auto w-full max-w-md gap-5">
						<AuthHeader
							title="Recuperar senha"
							description="Informe seu e-mail e enviaremos um link seguro para criar uma nova senha."
						/>

						{submitted ? (
							<div
								className="flex flex-col items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center"
								role="status"
								aria-live="polite"
							>
								<RiMailCheckLine className="h-8 w-8 text-primary" />
								<p className="text-sm leading-6 text-muted-foreground">
									Se existir uma conta com este e-mail, o link de recuperação
									chegará em breve. Verifique também a pasta de spam.
								</p>
							</div>
						) : (
							<>
								<AuthErrorAlert id="recovery-error" error={error} />
								<Field>
									<FieldLabel htmlFor="recovery-email">E-mail</FieldLabel>
									<Input
										id="recovery-email"
										type="email"
										placeholder="Digite seu e-mail"
										autoComplete="email"
										required
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										aria-invalid={Boolean(error)}
										aria-describedby={error ? "recovery-error" : undefined}
									/>
								</Field>
								<Field>
									<Button type="submit" className="w-full" disabled={loading}>
										{loading ? (
											<RiLoader4Line className="h-4 w-4 animate-spin" />
										) : (
											"Enviar link de recuperação"
										)}
									</Button>
								</Field>
							</>
						)}

						<FieldDescription className="flex items-center justify-center gap-1.5 text-center">
							<RiArrowLeftLine className="h-4 w-4" />
							<Link
								href="/login"
								className="font-medium text-foreground/88 underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/30 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
							>
								Voltar para o login
							</Link>
						</FieldDescription>
					</FieldGroup>
				</form>
			</AuthCardShell>
		</div>
	);
}
