export const formatBDT = (amount) => {
  const num = Number(amount) || 0;
  return `৳${num.toLocaleString('en-IN')}`;
};

export const formatNumber = (num) => {
  return Number(num || 0).toLocaleString('en-IN');
};
