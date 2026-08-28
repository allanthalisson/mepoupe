import type { ComponentProps } from "react";
import { cn } from "@/shared/utils/ui";

type DotPatternProps = ComponentProps<"svg"> & {
	width?: number;
	height?: number;
	x?: number;
	y?: number;
	cx?: number;
	cy?: number;
	cr?: number;
};

export function DotPattern({
	className,
	width = 18,
	height = 18,
	x = 0,
	y = 0,
	cx = 1.5,
	cy = 1.5,
	cr = 1.5,
	...props
}: DotPatternProps) {
	const patternId = `dot-pattern-${width}-${height}-${x}-${y}-${cx}-${cy}-${cr}`;

	return (
		<svg
			aria-hidden
			className={cn("absolute inset-0 h-full w-full", className)}
			{...props}
		>
			<title>Dot pattern background</title>
			<defs>
				<pattern
					id={patternId}
					width={width}
					height={height}
					patternUnits="userSpaceOnUse"
					x={x}
					y={y}
				>
					<circle cx={cx} cy={cy} r={cr} fill="currentColor" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill={`url(#${patternId})`} />
		</svg>
	);
}
