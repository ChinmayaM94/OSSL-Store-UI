# OSSL Store Pipeline Console (React)

Single-page UI for the `ossl-store-pipeline` REST API: CSV import, publish to Kafka, the three read
paths (SQL / MongoDB / cache), and SQL-vs-Mongo reconciliation, with errors and projection status surfaced.

```
npm install
npm run dev            # http://localhost:5173, proxies /api -> http://localhost:8080
VITE_API_TARGET=http://other-host:8080 npm run dev   # different backend
npm run build          # static bundle in dist/
```

For a production build served from a different origin, set `VITE_API_BASE` at build time
(e.g. `https://host:8080`) and enable CORS on the backend; behind a reverse proxy that routes `/api`, no config is needed.
