import { useEffect, useRef, useState } from 'react';
import { compareStore, getCache, getMongo, getSql, publishStore } from '../api.js';
import { settle } from '../projection.js';
import ProjectionStatus from './ProjectionStatus.jsx';
import ReadTabs from './ReadTabs.jsx';

const POLL_MS = 2000;
const POLL_MAX = 3;

const READERS = { sql: getSql, mongo: getMongo, cache: getCache, cmp: compareStore };

export default function StorePanel() {
  const [input, setInput] = useState('');
  const [storeId, setStoreId] = useState(null); // the id the displayed results belong to
  const [layers, setLayers] = useState({});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [alert, setAlert] = useState(null); // { level, text }
  const [autoRefresh, setAutoRefresh] = useState(true);
  const pollRef = useRef(null);

  const stopPoll = () => { clearTimeout(pollRef.current); pollRef.current = null; };
  useEffect(() => stopPoll, []);

  // SQL, Mongo and compare are cheap, side-effect free reads. The cache read is cache-aside (it
  // loads from Mongo on a miss), so it only happens when the user asks for it.
  const readCore = async (id) => {
    const [sql, mongo, cmp] = await Promise.all([
      settle(getSql(id)), settle(getMongo(id)), settle(compareStore(id)),
    ]);
    return { sql, mongo, cmp };
  };

  const begin = () => {
    const id = input.trim();
    if (!id) { setAlert({ level: 'warn', text: 'Enter a storeId first.' }); return null; }
    stopPoll();
    setAlert(null);
    if (id !== storeId) setLayers({});
    setStoreId(id);
    return id;
  };

  const check = async () => {
    const id = begin();
    if (!id) return;
    setBusy(true); setNote('');
    try {
      const core = await readCore(id);
      setLayers((prev) => ({ ...prev, ...core }));
    } finally {
      setBusy(false);
    }
  };

  const readOne = async (key) => {
    if (!storeId) { setAlert({ level: 'warn', text: 'Check a store first.' }); return; }
    setBusy(true);
    try {
      const r = await settle(READERS[key](storeId));
      setLayers((prev) => ({ ...prev, [key]: r }));
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    const id = begin();
    if (!id) return;
    setBusy(true); setNote('');
    try {
      const rec = await publishStore(id);
      setAlert({ level: 'info', text: `Published store ${id} as v${rec.version}. Waiting for MongoDB projection…` });
      let attempt = 0;
      const tick = async () => {
        attempt += 1;
        const core = await readCore(id);
        setLayers((prev) => ({ ...prev, ...core }));
        const caughtUp = core.mongo.ok && core.mongo.data.version >= rec.version;
        if (caughtUp) {
          setAlert(null); setNote(`published v${rec.version}`); setBusy(false);
        } else if (!autoRefresh) {
          setNote(`published v${rec.version}`); setBusy(false);
          setAlert({ level: 'info', text: `Published v${rec.version}. Auto-refresh is off — click “Check status” to re-read.` });
        } else if (attempt < POLL_MAX) {
          setNote(`polling… ${attempt}/${POLL_MAX}`);
          pollRef.current = setTimeout(tick, POLL_MS);
        } else {
          setNote(''); setBusy(false);
          setAlert({ level: 'err', text: `MongoDB did not reach v${rec.version} within ${(POLL_MS * POLL_MAX) / 1000}s — the consumer may be down or the event went to the DLQ.` });
        }
      };
      await tick();
    } catch (e) {
      setAlert({ level: 'err', text: `Publish failed (${e.status || 'network'}): ${e.message}` });
      setBusy(false);
    }
  };

  return (
    <section className="card">
      <h2>2. Publish, read &amp; reconcile a store</h2>
      <div className="row">
        <input type="text" placeholder="storeId (e.g. 1794)" value={input} autoComplete="off"
          onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && check()} />
        <button className="primary" disabled={busy} onClick={check}>Check status</button>
        <button disabled={busy} onClick={publish}>Publish to Kafka</button>
        <label className="muted">
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} /> auto-refresh after publish
        </label>
      </div>

      {alert && <div className={`banner ${alert.level}`}>{alert.text}</div>}
      {storeId && (
        <>
          <ProjectionStatus storeId={storeId} layers={layers} note={note} />
          <ReadTabs layers={layers} onRead={readOne} busy={busy} />
        </>
      )}
    </section>
  );
}
