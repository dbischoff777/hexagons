export const formatPoints = (points: number): string => {
  if (window.innerWidth <= 600) {
    if (points >= 1000000) {
      return (points / 1000000).toFixed(1) + 'M';
    } else if (points >= 1000) {
      return (points / 1000).toFixed(1) + 'K';
    }
  }
  return points.toLocaleString();
};