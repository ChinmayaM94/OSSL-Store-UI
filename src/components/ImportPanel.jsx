import { useRef, useState } from 'react';
import { importCsv } from '../api.js';

export default function ImportPanel() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const pick = (f) => { setFile(f || null); setResult(null); setError(null); };

  const upload = async () => {
    setBusy(true); setResult(null); setError(null);
    try {
      setResult(await importCsv(file));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  const errors = result?.errors ?? [];
  const level = !result ? null : result.failureCount === 0 ? 'ok' : result.processedCount === 0 ? 'err' : 'warn';

  return (
    <section className="card">
      <h2>1. Import stores (CSV)</h2>
      <div
        className={`drop ${over ? 'over' : ''}`}
        tabIndex={0}
        role="button"
        onClick={() => inputRef.current.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}
      >
        Drop a CSV here or click to choose a file
      </div>
      <input ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => pick(e.target.files[0])} />
      <div className="row">
        <span className="muted">{file ? `${file.name} (${(file.size / 1024).toFixed(1)} KB)` : 'No file selected'}</span>
        <button className="primary" disabled={!file || busy} onClick={upload}>
          {busy ? 'Importing…' : 'Upload & import'}
        </button>
      </div>

      {error && (
        <div className="banner err"><b>Import failed ({error.status || 'network'}):</b> {error.message}</div>
      )}
      {result && (
        <>
          <div className={`banner ${level}`}>
            {result.failureCount === 0
              ? 'Import completed with no row errors.'
              : `Import completed with ${result.failureCount} failed row(s).`}
          </div>
          <div className="stats">
            <Stat label="Total rows" value={result.totalRows} />
            <Stat label="Processed" value={result.processedCount} />
            <Stat label="Failed" value={result.failureCount} />
          </div>
          {errors.length > 0 && (
            <table>
              <thead><tr><th>CSV row</th><th>Field</th><th>Reason</th></tr></thead>
              <tbody>
                {errors.map((x, i) => (
                  <tr key={i}><td>{x.rowNumber}</td><td className="mono">{x.field}</td><td>{x.reason}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  );
}

const Stat = ({ label, value }) => (
  <div className="stat"><b>{value}</b><span>{label}</span></div>
);
