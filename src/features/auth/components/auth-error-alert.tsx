import { RiTerminalLine } from "@remixicon/react";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";

interface AuthErrorAlertProps {
	error: string;
	id?: string;
}

export function AuthErrorAlert({
	error,
	id = "auth-error",
}: AuthErrorAlertProps) {
	if (!error) return null;

	return (
		<Alert
			id={id}
			className="mt-2 border border-destructive"
			variant="destructive"
			role="alert"
		>
			<RiTerminalLine className="h-4 w-4" />
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	);
}
