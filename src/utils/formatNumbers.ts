export const formatNumber = (number: number): string => {
  // For numbers less than 1000, just show the number
  if (number < 1000) {
    return number.toLocaleString();
  }

  // For numbers 1000 and above, use K/M/B notation
  const units = ['', 'K', 'M', 'B'];
  const unit = Math.floor((number.toString().length - 1) / 3);
  let num = (number / Math.pow(1000, unit)).toFixed(1);
  
  // Remove trailing .0
  if (num.endsWith('.0')) {
    num = num.slice(0, -2);
  }
  
  return num + units[unit];
};

export const formatScore = (score: number): string => {
  return `SCORE: ${formatNumber(score)}`;
};