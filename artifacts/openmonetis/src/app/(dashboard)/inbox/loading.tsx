import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function Loading() {
	return (
		<main className="flex flex-col items-start gap-6">
			<div className="w-full space-y-4">
				{/* Tabs */}
				<Skeleton className="h-9 w-72 rounded-md bg-foreground/10" />

				{/* Grid de cards */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<Card key={i} className="flex h-54 flex-col gap-0 py-0">
							<div className="px-4 pt-4 pb-2">
								<div className="flex items-center justify-between gap-2">
									<Skeleton className="h-4 w-32 bg-foreground/10" />
									<Skeleton className="h-4 w-16 bg-foreground/10" />
								</div>
							</div>
							<div className="flex-1 space-y-2 px-4 py-2">
								<Skeleton className="h-3 w-full bg-foreground/10" />
								<Skeleton className="h-3 w-full bg-foreground/10" />
								<Skeleton className="h-3 w-3/4 bg-foreground/10" />
							</div>
							<div className="flex gap-2 px-4 pb-4 pt-3">
								<Skeleton className="h-8 flex-1 bg-foreground/10" />
								<Skeleton className="h-8 w-8 bg-foreground/10" />
								<Skeleton className="h-8 w-8 bg-foreground/10" />
							</div>
						</Card>
					))}
				</div>
			</div>
		</main>
	);
}
