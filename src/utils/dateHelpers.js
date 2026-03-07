import { format } from 'date-fns';

export const formatSADate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return format(d, 'dd/MM/yyyy');
};

export const formatISODate = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

export const getCurrentTaxYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // SA tax year: 1 March to 28/29 Feb
  return month >= 2 ? `${year}/${year + 1 - 2000}` : `${year - 1}/${year - 2000}`;
};
