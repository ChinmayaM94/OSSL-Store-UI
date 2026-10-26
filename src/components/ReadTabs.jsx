import { useState } from 'react';

const TABS = [
  { key: 'sql', label: 'SQL' },
  { key: 'mongo', label: 'MongoDB' },
  { key: 'cache', label: 'Cache' },
  { key: 'cmp', label: 'Compare' },
];

const fmt = (x) => (x === null || x === undefined ? '—' : typeof x === 'object' ? JSON.stringify(x) : String(x));

function Failure({ result }) {
  const missing = result.status === 404;
  return (
    <div className={`banner ${missing ? 'warn' : 'err'}`}>
      <b>{missing ? 'Not found' : `Error (${result.status || 'network'})`}:</b> {result.message}
    </div>
  );
}

function Record({ result }) {
  if (!result.ok) return <Failure result={result} />;
  return <pre>{JSON.stringify(result.data, null, 2)}</pre>;
}

function Compare({ result }) {
  if (!result.ok) return <Failure result={result} />;
  const c = result.data;
  const mismatched = new Set(c.mismatchedFields || []);
  const markers = [...mismatched].filter((m) => m.startsWith('__'));
  const keys = [...new Set([...Object.keys(c.sqlValues || {}), ...Object.keys(c.mongoValues || {})])];
  return (
    <>
      <div className={`banner ${c.consistent ? 'ok' : 'warn'}`}>
        {c.consistent ? 'Consistent: every compared field matches.' : `Inconsistent: ${mismatched.size} mismatch(es).`}
      </div>
      {markers.length > 0 && <div className="banner warn">{markers.join(', ')}</div>}
      {keys.length > 0 && (
        <table>
          <thead><tr><th>Field</th><th>SQL</th><th>MongoDB</th></tr></thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k} className={mismatched.has(k) ? 'diff' : ''}>
                <td className="mono">{k}</td>
                <td className="mono">{fmt(c.sqlValues[k])}</td>
                <td className="mono">{fmt(c.mongoValues[k])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export default function ReadTabs({ layers, onRead, busy }) {
  const [active, setActive] = useState('sql');
  const result = layers[active];
  return (
    <div className="tabs-wrap">
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={active === t.key}
            className={active === t.key ? 'tab active' : 'tab'} onClick={() => setActive(t.key)}>
            {t.label}
          </button>
        ))}
        <button className="refresh" disabled={busy} onClick={() => onRead(active)}>Read {TABS.find((t) => t.key === active).label}</button>
      </div>
      <div className="tab-body">
        {!result && <span className="muted">Not read yet. Click “Read” above.</span>}
        {result && (active === 'cmp' ? <Compare result={result} /> : <Record result={result} />)}
      </div>
    </div>
  );
}
