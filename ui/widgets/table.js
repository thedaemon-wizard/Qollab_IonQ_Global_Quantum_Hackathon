// Accessible data table. columns: [{key, label, align?: 'text', format?: fn}]
import { h, scrollableWhenNeeded } from '../core/dom.js';

export function dataTable({ caption, columns, rows, rowHeader = true }) {
  const head = h('tr', null, columns.map((c) => h('th', { scope: 'col', class: c.align === 'text' ? 'text' : null }, c.label)));
  const body = rows.map((row) =>
    h('tr', null, columns.map((c, i) => {
      const value = c.format ? c.format(row[c.key], row) : row[c.key];
      const attrs = { class: c.align === 'text' ? 'text' : null };
      return i === 0 && rowHeader ? h('th', { ...attrs, scope: 'row' }, value) : h('td', attrs, value);
    })),
  );
  const wrap = h('div', { class: 'table-wrap' },
    h('table', null, caption ? h('caption', null, caption) : null, h('thead', null, head), h('tbody', null, body)));
  return scrollableWhenNeeded(wrap, caption ? `Table: ${caption.slice(0, 80)}` : 'Table');
}

/** A table hidden in <details>, used under every chart so the data is readable as text. */
export function detailsTable(summary, tableSpec) {
  return h('details', null, h('summary', null, summary), dataTable(tableSpec));
}
