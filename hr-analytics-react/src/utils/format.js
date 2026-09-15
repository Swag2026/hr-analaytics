// Ported 1:1 from the original vanilla-JS formatting helpers.

export function fmtNum(n, decimals) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: decimals === undefined ? 0 : decimals });
}

export function fmtSAR(n) {
  return fmtNum(n) + ' ﷼';
}

export function fmtPct(n, withSign) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const s = withSign && n > 0 ? '+' : '';
  return s + Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 }) + '%';
}

export function riskLevelMap(level) {
  const map = { CRITICAL: ['critical', 'حرج'], HIGH: ['high', 'مرتفع'], MEDIUM: ['medium', 'متوسط'], LOW: ['low', 'منخفض'] };
  return map[level] || ['neutral', level];
}
