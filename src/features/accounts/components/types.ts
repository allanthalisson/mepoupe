export type Account = {
	id: string;
	name: string;
	accountType: string;
	status: string;
	note: string | null;
	logo: string | null;
	initialBalance: number;
	balance?: number | null;
	excludeFromBalance?: boolean;
	excludeInitialBalanceFromIncome?: boolean;
	ownerUserId?: string;
	accessLevel?: "owner" | "read" | "write";
	canEdit?: boolean;
	canWrite?: boolean;
};

export type AccountFormValues = {
	name: string;
	accountType: string;
	status: string;
	note: string;
	logo: string;
	initialBalance: string;
	excludeFromBalance: boolean;
	excludeInitialBalanceFromIncome: boolean;
};
