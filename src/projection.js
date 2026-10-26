// Settle a request into {ok, data} / {ok:false, status, message} so one failing layer doesn't hide the rest.
export const settle = (p) =>
  p.then((data) => ({ ok: true, data }), (e) => ({ ok: false, status: e.status, message: e.message }));

// Overall projection verdict from layer versions and the server's own consistency check.
export function verdict({ sql, mongo, cache, cmp }) {
  if (!sql || !mongo) return { level: 'info', text: 'Reading status…' }; // first read still in flight
  const broken = [sql, mongo, cache].find((r) => r && !r.ok && r.status !== 404);
  if (broken) return { level: 'err', text: `Error reading a layer: ${broken.message}` };
  if (!sql.ok) return { level: 'err', text: 'Store not found in SQL — nothing to project. Import it first.' };
  if (!mongo.ok) return { level: 'warn', text: 'Not yet projected to MongoDB (consumer pending, or the event failed — check the DLQ).' };
  const sv = sql.data.version, mv = mongo.data.version;
  if (mv < sv) return { level: 'warn', text: `MongoDB is behind SQL (v${mv} < v${sv}). Projection is lagging or failed.` };
  if (cmp?.ok && !cmp.data.consistent) return { level: 'warn', text: 'Versions match but field values differ between SQL and MongoDB.' };
  if (cache?.ok && cache.data.version !== mv) return { level: 'warn', text: `Cache is stale (v${cache.data.version} vs MongoDB v${mv}).` };
  if (cmp?.ok && cmp.data.consistent) return { level: 'ok', text: 'In sync: SQL and MongoDB match' + (cache?.ok ? ', cache is current.' : '.') };
  return { level: 'info', text: 'Status undetermined.' };
}
