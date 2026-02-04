# Backend ping from browser console

On the **GitHub Pages live version** (or any deployed frontend), open DevTools → **Console** and paste the script below to measure backend response time (like ping with RTT).

The app exposes the backend base URL as `window.__CRM_API_BASE` (set when the API service loads), so the script can auto-detect it. You can also pass a URL manually.

## One-time ping (single RTT)

```javascript
(async function pingBackend(baseUrl) {
  const base = baseUrl || (window.__CRM_API_BASE != null ? window.__CRM_API_BASE : null);
  if (!base) {
    console.warn('Backend URL not found. Pass it: pingBackend("https://your-backend.example.com")');
    return;
  }
  const url = base.replace(/\/$/, '') + '/health';
  const start = performance.now();
  try {
    const r = await fetch(url, { method: 'GET', mode: 'cors' });
    const ms = Math.round(performance.now() - start);
    console.log(`Backend /health: ${r.status} in ${ms} ms`);
    return ms;
  } catch (e) {
    const ms = Math.round(performance.now() - start);
    console.error(`Backend /health failed after ${ms} ms:`, e.message);
    return null;
  }
})();
```

## Ping with TTL-style stats (multiple rounds, min/max/avg)

**Option A – Define once, then call with your backend URL (use when `window.__CRM_API_BASE` is missing):**

Paste this once to define `pingBackendStats`:

```javascript
window.pingBackendStats = async function(baseUrl, count = 5) {
  const base = baseUrl || (window.__CRM_API_BASE != null ? window.__CRM_API_BASE : null);
  if (!base) {
    console.warn('Pass backend URL, e.g. pingBackendStats("https://crm-mini.tail34e202.ts.net:8443", 5)');
    return;
  }
  const url = base.replace(/\/$/, '') + '/health';
  const times = [];
  for (let i = 0; i < count; i++) {
    const start = performance.now();
    try {
      await fetch(url, { method: 'GET', mode: 'cors' });
      times.push(Math.round(performance.now() - start));
    } catch (e) {
      times.push(null);
    }
  }
  const valid = times.filter(t => t != null);
  if (valid.length === 0) {
    console.error('All pings failed');
    return;
  }
  const min = Math.min(...valid), max = Math.max(...valid);
  const avg = Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  console.log(`Backend /health (${valid.length}/${count}): min ${min} ms, max ${max} ms, avg ${avg} ms`);
  console.table(times.map((t, i) => ({ ping: i + 1, 'RTT (ms)': t ?? 'fail' })));
  return { min, max, avg, times };
};
```

Then run (use the same host as in your API errors, e.g. from `crm-mini.tail34e202.ts.net:8443/api/auth/login`):

```javascript
pingBackendStats('https://crm-mini.tail34e202.ts.net:8443', 5)
```

**Option B – One-shot (auto-detect URL if app has set `window.__CRM_API_BASE`):**

```javascript
(async function() {
  const base = window.__CRM_API_BASE || 'https://crm-mini.tail34e202.ts.net:8443';
  const url = base.replace(/\/$/, '') + '/health';
  const times = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    try {
      await fetch(url, { method: 'GET', mode: 'cors' });
      times.push(Math.round(performance.now() - start));
    } catch (e) { times.push(null); }
  }
  const valid = times.filter(t => t != null);
  if (valid.length === 0) { console.error('All pings failed'); return; }
  const min = Math.min(...valid), max = Math.max(...valid);
  const avg = Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  console.log(`Backend /health (${valid.length}/5): min ${min} ms, max ${max} ms, avg ${avg} ms`);
  console.table(times.map((t, i) => ({ ping: i + 1, 'RTT (ms)': t ?? 'fail' })));
})();
```

**Usage**

- **Auto (GitHub Pages / deployed app):**  
  `pingBackend()` or `pingBackendStats()` — uses `window.__CRM_API_BASE` if set.

- **Manual URL:**  
  `pingBackend('https://crm-mini.tail34e202.ts.net:8443')`  
  `pingBackendStats('https://crm-mini.tail34e202.ts.net:8443', 10)`

The backend must expose `GET /health` (no auth). Response time is measured from the browser (includes network RTT and server time).
