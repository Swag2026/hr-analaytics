import React, { useMemo, useState } from 'react';
import { Icon } from '../utils/icons.jsx';
import { EmptyState } from './Atoms.jsx';
import { exportObjectsToExcel } from '../utils/excelExport.js';

/**
 * Ported from buildTable(containerId, columns, rows, opts).
 * columns: [{ key, label, render?(row) -> node, raw?(row) -> value-for-excel }]
 * opts: { search=true, searchPlaceholder, searchFields, onRowClick, exportFilename, exportSheetName }
 */
export default function DataTable({ columns, rows, opts = {} }) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (opts.search === false || !q.trim()) return rows;
    const needle = q.trim().toLowerCase();
    const fields = opts.searchFields || columns.map((c) => c.key);
    return rows.filter((r) => fields.some((k) => String(r[k] || '').toLowerCase().includes(needle)));
  }, [rows, q, opts.search, opts.searchFields, columns]);

  return (
    <div>
      <div className="table-toolbar">
        {opts.search !== false ? (
          <div className="search-box">
            <Icon name="search" size={15} />
            <input
              type="text"
              placeholder={opts.searchPlaceholder || 'بحث...'}
              style={{ paddingRight: 34 }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        ) : <div />}
        <div className="flex items-center gap-12">
          <div className="small text-muted">{rows.length} سجل</div>
          {opts.exportFilename ? (
            <button
              className="btn sm"
              onClick={() => exportObjectsToExcel(opts.exportFilename, opts.exportSheetName || 'Data', columns, filtered)}
            >
              <Icon name="download" size={13} /> تحميل Excel
            </button>
          ) : null}
        </div>
      </div>
      <div className="table-wrap">
        <div className="table-scroll">
          {filtered.length === 0 ? (
            <EmptyState icon="search">لا توجد نتائج مطابقة</EmptyState>
          ) : (
            <table className="data-table">
              <thead>
                <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => (
                  <tr key={idx} onClick={() => opts.onRowClick && opts.onRowClick(row)}>
                    {columns.map((c) => (
                      <td key={c.key}>{c.render ? c.render(row) : row[c.key] ?? '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
