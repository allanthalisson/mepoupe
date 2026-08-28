import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

type ResetPasswordPageProps = {
	searchParams?: Promise<{ token?: string | string[] }>;
};

export default async function ResetPasswordPage({
	searchParams,
}: ResetPasswordPageProps) {
	const params = searchParams ? await searchParams : undefined;
	const token = Array.isArray(params?.token) ? params.token[0] : params?.token;

	return <ResetPasswordForm token={token} />;
}
