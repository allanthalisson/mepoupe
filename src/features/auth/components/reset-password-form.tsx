"use client";

import { RiCheckLine, RiCloseLine, RiLoader4Line } from "@remixicon/react";
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

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
	return (
		<div
			className={cn(
				"flex items-center gap-1.5 text-xs transition-colors",
				met ? "text-success" : "text-muted-foreground",
			)}
		>
			{met ? (
				<RiCheckLine className="h-3.5 w-3.5" />
			) : (
				<RiCloseLine className="h-3.5 w-3.5" />
			)}
			<span>{label}</span>
		</div>
	);
}

export function ResetPasswordForm({
	token,
	className,
	...props
}: DivProps & { token?: string }) {
	const [password, setPassword] = useState("");
	const [confirmation, setConfirmation] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [completed, setCompleted] = useState(false);

	const hasMinLength = password.length >= 7;
	const hasMaxLength = password.length <= 23;
	const passwordsMatch = password.length > 0 && password === confirmation;
	const isValid = hasMinLength && hasMaxLength && passwordsMatch;

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");

		if (!token) {
			setError(
				"Este link de recuperação é inválido ou está incompleto. Solicite um novo link.",
			);
			return;
		}

		if (!isValid) {
			setError("Confira os requisitos da nova senha.");
			return;
		}

		setLoading(true);
		const { error: resetError } = await authClient.resetPassword({
			newPassword: password,
			token,
		});
		setLoading(false);

		if (resetError) {
			setError(
				"Este link é inválido ou expirou. Solicite um novo link de recuperação.",
			);
			return;
		}

		setCompleted(true);
		toast.success("Senha redefinida com sucesso!");
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
							title="Criar nova senha"
							description="Escolha uma senha forte para voltar a acessar sua conta."
						/>

						{completed ? (
							<div
								className="flex flex-col items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center"
								role="status"
								aria-live="polite"
							>
								<RiCheckLine className="h-8 w-8 text-success" />
								<p className="text-sm leading-6 text-muted-foreground">
									Sua senha foi atualizada. Agora você já pode entrar na sua
									conta.
								</p>
								<Link
									href="/login"
									className="font-medium text-foreground underline underline-offset-4"
								>
									Ir para o login
								</Link>
							</div>
						) : (
							<>
								<AuthErrorAlert id="reset-password-error" error={error} />
								<Field>
									<FieldLabel htmlFor="new-password">Nova senha</FieldLabel>
									<Input
										id="new-password"
										type="password"
										placeholder="Crie uma senha forte"
										autoComplete="new-password"
										required
										maxLength={23}
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										aria-invalid={Boolean(error)}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="password-confirmation">
										Confirmar nova senha
									</FieldLabel>
									<Input
										id="password-confirmation"
										type="password"
										placeholder="Repita a nova senha"
										autoComplete="new-password"
										required
										maxLength={23}
										value={confirmation}
										onChange={(event) => setConfirmation(event.target.value)}
										aria-invalid={Boolean(error)}
									/>
								</Field>
								<div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl bg-muted/35 p-3">
									<PasswordRequirement
										met={hasMinLength}
										label="Mínimo 7 caracteres"
									/>
									<PasswordRequirement
										met={hasMaxLength}
										label="Máximo 23 caracteres"
									/>
									<PasswordRequirement
										met={passwordsMatch}
										label="Senhas iguais"
									/>
								</div>
								<Field>
									<Button
										type="submit"
										className="w-full"
										disabled={loading || !isValid}
									>
										{loading ? (
											<RiLoader4Line className="h-4 w-4 animate-spin" />
										) : (
											"Salvar nova senha"
										)}
									</Button>
								</Field>
							</>
						)}

						<FieldDescription className="text-center">
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
