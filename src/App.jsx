import { useEffect, useState } from 'react';
import { setLogger } from './api.js';
import ImportPanel from './components/ImportPanel.jsx';
import StorePanel from './components/StorePanel.jsx';
import ActivityLog from './components/ActivityLog.jsx';

export default function App() {
  const [log, setLog] = useState([]);

  useEffect(() => {
    setLogger((entry) => setLog((prev) => [entry, ...prev].slice(0, 50)));
    return () => setLogger(() => {});
  }, []);

  return (
    <>
      <header>
        <h1>OSSL Store Pipeline Console</h1>
        <span className="muted">CSV → SQL → Kafka → MongoDB → Cache</span>
        <a href="/swagger-ui.html" target="_blank" rel="noopener noreferrer">API docs</a>
      </header>
      <main>
        <ImportPanel />
        <StorePanel />
        <ActivityLog entries={log} onClear={() => setLog([])} />
      </main>
    </>
  );
}
