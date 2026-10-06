// Dates written the same way for every visitor. The browser's own formats
// vary by country (18/11/2024 in the UK is 11/18/2024 in the US, and
// 04/04/2026 can't be read either way), and UK English shortens September
// to "Sept" while every other month gets three letters.

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Apr 2026"; month is 1–12
export function formatMonth(year, month) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

// "18 Nov 2024"
export function formatDate(date) {
  const d = new Date(date);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}
