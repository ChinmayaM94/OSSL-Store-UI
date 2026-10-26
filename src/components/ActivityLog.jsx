export default function ActivityLog({ entries, onClear }) {
  return (
    <section className="card">
      <h2>
        Activity &amp; errors
        <button className="small" onClick={onClear} disabled={!entries.length}>Clear</button>
      </h2>
      {!entries.length ? (
        <span className="muted">No requests yet.</span>
      ) : (
        <table>
          <thead><tr><th>Time</th><th>Request</th><th>Status</th><th>ms</th><th>Message</th></tr></thead>
          <tbody>
            {entries.map((e, i) => {
              const level = e.status >= 200 && e.status < 300 ? 'ok' : e.status === 404 ? 'warn' : 'err';
              return (
                <tr key={i}>
                  <td>{e.time.toLocaleTimeString()}</td>
                  <td className="mono">{e.method} {e.path}</td>
                  <td><span className={`pill ${level}`}>{e.status || 'ERR'}</span></td>
                  <td>{e.ms}</td>
                  <td>{e.message || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
