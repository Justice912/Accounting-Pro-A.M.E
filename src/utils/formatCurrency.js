export const formatZAR = (amount) => {
  return `R ${(amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const parseZAR = (str) => parseFloat((str || '0').replace(/[R\s,]/g, '')) || 0;
