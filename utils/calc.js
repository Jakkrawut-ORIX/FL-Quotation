export function calculate(form) {
  const net = form.gross - form.discount + form.optionPlus;

  const finance = net - form.downInput;

  const months = form.termVal * 12;
  const years = form.termVal;

  const flatRate = form.flatRate / 100;

  const totalInterest = finance * flatRate * years;

  const pmt = (finance + totalInterest) / months;

  const pmtRounded = Math.ceil(pmt);

  const commission = finance * (form.commPct / 100);

  return {
    net,
    finance,
    totalInterest,
    pmtRounded,
    commission
  };
}
