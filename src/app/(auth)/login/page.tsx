import { LoginForm } from "@/features/auth/components/login-form";
import { isSignupDisabled } from "@/shared/lib/auth/signup";

export default function LoginPage() {
	return (
		<LoginForm
			signupDisabled={isSignupDisabled()}
			googleSignInAvailable={Boolean(
				process.env.GOOGLE_CLIENT_ID?.trim() &&
					process.env.GOOGLE_CLIENT_SECRET?.trim(),
			)}
		/>
	);
}
