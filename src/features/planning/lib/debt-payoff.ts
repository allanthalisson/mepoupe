export type DebtPayoffEstimate = {
	months: number | null;
	totalInterest: number | null;
	paymentCoversInterest: boolean;
};

export function estimateDebtPayoff(
	balance: number,
	annualInterestRate: number,
	monthlyPayment: number,
): DebtPayoffEstimate {
	if (balance <= 0) {
		return { months: 0, totalInterest: 0, paymentCoversInterest: true };
	}
	if (monthlyPayment <= 0) {
		return { months: null, totalInterest: null, paymentCoversInterest: false };
	}

	const monthlyRate =
		annualInterestRate > 0 ? (1 + annualInterestRate / 100) ** (1 / 12) - 1 : 0;
	if (monthlyPayment <= balance * monthlyRate) {
		return { months: null, totalInterest: null, paymentCoversInterest: false };
	}

	const months =
		monthlyRate === 0
			? Math.ceil(balance / monthlyPayment)
			: Math.ceil(
					-Math.log(1 - (monthlyRate * balance) / monthlyPayment) /
						Math.log(1 + monthlyRate),
				);
	const totalPaid = monthlyPayment * Math.max(months - 1, 0);
	const balanceBeforeLastPayment =
		monthlyRate === 0
			? Math.max(balance - totalPaid, 0)
			: balance * (1 + monthlyRate) ** Math.max(months - 1, 0) -
				monthlyPayment *
					(((1 + monthlyRate) ** Math.max(months - 1, 0) - 1) / monthlyRate);
	const lastPayment = balanceBeforeLastPayment * (1 + monthlyRate);
	const totalInterest = Math.max(totalPaid + lastPayment - balance, 0);

	return {
		months,
		totalInterest: Math.round(totalInterest * 100) / 100,
		paymentCoversInterest: true,
	};
}
