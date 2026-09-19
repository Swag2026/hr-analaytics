import React from 'react';
import { Link } from 'react-router-dom';
import { fmtPct, riskLevelMap } from '../utils/format.js';
import { Icon } from '../utils/icons.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

// Ported from scoreRing(score, size)
export function ScoreRing({ score, size = 84 }) {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--critical)';
  const off = c - (score / 100) * c;
  return (
    <div className="score-ring" style={{ width: size, height: size, flex: `0 0 ${size}px` }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="7" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        />
      </svg>
      <div className="num">{score}</div>
    </div>
  );
}

// Ported from deltaBadge(pct, invert)
export function DeltaBadge({ pct, invert }) {
  if (pct === null || pct === undefined) return <span className="delta flat">—</span>;
  let cls = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
  if (invert) cls = pct > 0 ? 'down' : pct < 0 ? 'up' : 'flat';
  const arrow = pct > 0 ? '▲' : pct < 0 ? '▼' : '—';
  return <span className={`delta ${cls}`}>{arrow} {fmtPct(Math.abs(pct))}</span>;
}

// Ported from riskBadge(level)
export function RiskBadge({ level }) {
  const { tt } = useLanguage();
  const [cls, label] = riskLevelMap(level);
  return <span className={`badge ${cls}`}>{tt(label)}</span>;
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Chip({ children }) {
  return <span className="chip">{children}</span>;
}

export function EmptyState({ icon = 'search', children }) {
  return (
    <div className="empty-state">
      <Icon name={icon} size={36} />
      <div>{children}</div>
    </div>
  );
}

// Ported from the dashboard kpi-card anchor markup
export function KpiCard({ label, value, unit, delta, invert, to, tone, caveat }) {
  const { tt } = useLanguage();
  const inner = (
    <>
      <div className="label">
        {tt(label)}
        {caveat ? <span title={tt('رقم تقديري من ملاحظات الشهر - يحتاج تأكيد يدوي')}><Icon name="info" size={13} /></span> : null}
      </div>
      <div className="value" style={tone === 'critical' ? { color: 'var(--critical)' } : undefined}>
        {value}{unit ? <span className="unit"> {tt(unit)}</span> : null}
      </div>
      {delta !== undefined ? <DeltaBadge pct={Math.round(delta * 10) / 10} invert={invert} /> : null}
    </>
  );
  if (to) {
    return <Link className="kpi-card" to={to} style={{ display: 'block' }}>{inner}</Link>;
  }
  return <div className="kpi-card">{inner}</div>;
}

export function SimpleKpi({ label, value, unit, style }) {
  const { tt } = useLanguage();
  return (
    <div className="kpi-card">
      <div className="label">{tt(label)}</div>
      <div className="value" style={style}>{value}{unit ? <span className="unit"> {tt(unit)}</span> : null}</div>
    </div>
  );
}
