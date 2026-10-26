import { verdict } from '../projection.js';

function LayerCard({ title, result, hint }) {
  if (!result) {
    return (
      <div className="layer">
        <h3>{title}</h3><div className="ver">—</div>
        <span className="pill idle">not read</span>
        {hint && <div className="meta">{hint}</div>}
      </div>
    );
  }
  if (result.ok) {
    return (
      <div className="layer">
        <h3>{title}</h3><div className="ver">v{result.data.version}</div>
        <span className="pill ok">present</span>
        <div className="meta">locationId {result.data.locationId}</div>
      </div>
    );
  }
  const missing = result.status === 404;
  return (
    <div className="layer">
      <h3>{title}</h3><div className="ver">—</div>
      <span className={`pill ${missing ? 'idle' : 'err'}`}>{missing ? 'not found' : 'error'}</span>
      <div className="meta">{result.message}</div>
    </div>
  );
}

export default function ProjectionStatus({ storeId, layers, note }) {
  const v = verdict(layers);
  return (
    <div>
      <div className={`banner ${v.level}`}>
        <b>Store {storeId}:</b> {v.text}
        {note && <span className="note">{note}</span>}
      </div>
      <div className="cards">
        <LayerCard title="SQL (source)" result={layers.sql} />
        <LayerCard title="MongoDB (projection)" result={layers.mongo} />
        <LayerCard title="Cache" result={layers.cache} hint="Open the Cache tab to read it (cache-aside read populates the cache)." />
      </div>
    </div>
  );
}
