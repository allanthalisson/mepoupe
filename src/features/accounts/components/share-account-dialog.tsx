"use client";

import { RiDeleteBinLine, RiGroupLine } from "@remixicon/react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	type AccountShareData,
	fetchAccountSharesAction,
	removeAccountShareAction,
	shareAccountAction,
} from "@/features/accounts/sharing-actions";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

interface ShareAccountDialogProps {
	accountId: string;
	accountName: string;
	trigger?: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function ShareAccountDialog({
	accountId,
	accountName,
	trigger,
	open: controlledOpen,
	onOpenChange,
}: ShareAccountDialogProps) {
	const [internalOpen, setInternalOpen] = useState(false);
	const open = controlledOpen ?? internalOpen;
	const setOpen = (nextOpen: boolean) => {
		setInternalOpen(nextOpen);
		onOpenChange?.(nextOpen);
	};
	const [email, setEmail] = useState("");
	const [permission, setPermission] = useState<"read" | "write">("write");
	const [shares, setShares] = useState<AccountShareData[]>([]);
	const [loading, setLoading] = useState(false);
	const [isPending, startTransition] = useTransition();

	const loadShares = useCallback(async () => {
		setLoading(true);
		const result = await fetchAccountSharesAction(accountId);
		setLoading(false);
		if (result.success) setShares(result.shares);
		else toast.error(result.error);
	}, [accountId]);

	useEffect(() => {
		if (open) void loadShares();
	}, [open, loadShares]);

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		startTransition(async () => {
			const result = await shareAccountAction({
				accountId,
				email,
				permission,
			});
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			toast.success(result.message);
			setEmail("");
			await loadShares();
		});
	};

	const handleRemove = (shareId: string) => {
		startTransition(async () => {
			const result = await removeAccountShareAction({ shareId });
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			toast.success(result.message);
			await loadShares();
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Compartilhar {accountName}</DialogTitle>
					<DialogDescription>
						Convide seu parceiro pelo e-mail usado no aplicativo. O saldo e o
						extrato passam a ser conjuntos; cada lançamento mantém seu autor.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="grid gap-2">
						<Label htmlFor={`share-email-${accountId}`}>E-mail</Label>
						<Input
							id={`share-email-${accountId}`}
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							placeholder="parceiro@exemplo.com"
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor={`share-permission-${accountId}`}>Permissão</Label>
						<select
							id={`share-permission-${accountId}`}
							value={permission}
							onChange={(event) =>
								setPermission(event.target.value === "read" ? "read" : "write")
							}
							className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<option value="write">Pode adicionar lançamentos</option>
							<option value="read">Somente visualizar</option>
						</select>
					</div>
					<DialogFooter>
						<Button type="submit" disabled={isPending || !email.trim()}>
							<RiGroupLine className="size-4" />
							{isPending ? "Salvando..." : "Compartilhar conta"}
						</Button>
					</DialogFooter>
				</form>

				<div className="border-t pt-4">
					<p className="mb-3 font-medium text-sm">Pessoas com acesso</p>
					{loading ? (
						<p className="text-muted-foreground text-sm">Carregando...</p>
					) : shares.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							Esta conta ainda não foi compartilhada.
						</p>
					) : (
						<ul className="flex flex-col gap-2">
							{shares.map((share) => (
								<li
									key={share.id}
									className="flex items-center justify-between gap-3 rounded-lg border p-3"
								>
									<div className="min-w-0">
										<p className="truncate font-medium text-sm">{share.name}</p>
										<p className="truncate text-muted-foreground text-xs">
											{share.email} ·{" "}
											{share.permission === "write" ? "editor" : "visualizador"}
										</p>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										onClick={() => handleRemove(share.id)}
										disabled={isPending}
										aria-label={`Remover acesso de ${share.name}`}
									>
										<RiDeleteBinLine className="size-4 text-destructive" />
									</Button>
								</li>
							))}
						</ul>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
