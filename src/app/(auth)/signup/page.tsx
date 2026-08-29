import { redirect } from "next/navigation";
import { SignupForm } from "@/features/auth/components/signup-form";
import { isSignupDisabled } from "@/shared/lib/auth/signup";

export default function SignupPage() {
	if (isSignupDisabled()) {
		redirect("/login");
	}

	return (
		<SignupForm
			googleSignInAvailable={Boolean(
				process.env.GOOGLE_CLIENT_ID?.trim() &&
					process.env.GOOGLE_CLIENT_SECRET?.trim(),
			)}
		/>
	);
}
