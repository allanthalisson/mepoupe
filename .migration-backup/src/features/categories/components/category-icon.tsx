"use client";

import type { ComponentType } from "react";
import { getIconComponent } from "@/shared/utils/icons";
import { cn } from "@/shared/utils/ui";

interface CategoryIconProps {
	name?: string | null;
	className?: string;
}

export function CategoryIcon({ name, className }: CategoryIconProps) {
	const IconComponent = (
		name ? getIconComponent(name) : getIconComponent("RiPriceTag3Line")
	) as ComponentType<{ className?: string }> | null;

	if (!IconComponent) {
		return (
			<span className={cn("text-xs text-muted-foreground", className)}>
				{name ?? "Category"}
			</span>
		);
	}

	return <IconComponent className={cn("size-5", className)} aria-hidden />;
}
