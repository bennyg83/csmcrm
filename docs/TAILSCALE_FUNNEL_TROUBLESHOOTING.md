# Tailscale Funnel – troubleshooting (from Tailscale docs)

When Funnel works **inside** your network but **not from outside** (timeouts, "can't be reached"), work through these in order.

---

## 1. Funnel node attribute (ACL)

Funnel needs a **`funnel` node attribute** in your tailnet policy.

1. Open [Access controls](https://login.tailscale.com/admin/acls) in the Tailscale admin console.
2. Expand **Funnel** and choose **Add Funnel to policy** (if not already there).

Example policy snippet:

```json
"nodeAttrs": [
  { "target": ["autogroup:member"], "attr": ["funnel"] }
]
```

Without this, Funnel may not work for external traffic.

---

## 2. HTTPS certificates

Funnel requires **HTTPS** and valid certs for your tailnet. If you enabled Funnel via the CLI, this is usually set up. In the admin console, check **DNS** / **HTTPS** and ensure your tailnet domain has HTTPS enabled.

---

## 3. DNS propagation (from Tailscale docs)

> Public DNS records can take **up to 10 minutes** to show up for your tailnet domain. This delay might prevent someone from using a Funnel URL until the public DNS records are updated.

- After enabling or changing Funnel, wait **at least 10 minutes** before testing from an external network.
- External clients resolve the Funnel hostname (e.g. `crm-mini.tail34e202.ts.net`) to a **Funnel relay IP** (e.g. 185.40.234.37), not your machine. That’s expected.

---

## 4. Device and Tailscale must be reachable by the relay

From outside, traffic goes: **Client → Funnel relay → your device**. If the relay can’t reach your device, you get timeouts.

- **Keep the machine running** and avoid sleep/hibernate while you need Funnel.
- **Keep Tailscale connected**: on the machine that runs Funnel, run `tailscale status` and confirm the device is online.
- **Trigger activity** if Funnel was idle: some reports say Funnel can stop responding after long idle; try pinging the device from another Tailscale device or running `tailscale status` on the Funnel machine, then test again from outside.

---

## 5. Restart Funnel

On the machine that runs the backend and Tailscale:

```bash
tailscale funnel off
tailscale funnel --https=8443 --bg 3004    # CSM backend
tailscale funnel --https=443 --bg 3002      # Pilzno (if needed)
tailscale funnel status
```

Confirm both URLs show "Funnel on" and the correct local ports.

---

## 6. Test from a different external network

Try from **another network** (e.g. phone on cellular, or a different Wi‑Fi). If it works there but not from one network, that network may be blocking or throttling the Funnel relay (firewall, ISP, or corporate policy).

---

## 7. Content Security Policy (CSP) when testing in the browser

If you open the app from **GitHub Pages** (or any site with a strict CSP) and run a `fetch()` to the Funnel URL in the console, the page’s CSP can block it:

- **"Refused to connect ... violates the document's Content-Security-Policy"** → The **page** (e.g. bennyg83.github.io) is blocking the request, not the network.
- The app’s `index.html` includes a CSP meta tag that allows `connect-src` to `https://crm-mini.tail34e202.ts.net` and `:8443`. If the **server** (e.g. GitHub Pages) sends a stricter `Content-Security-Policy` header, that header wins and can still block the Tailscale origin.
- To test **network** reachability without CSP: open a tab to `about:blank`, open the console, and run the same `fetch(...)` there (no CSP from a page). Or test from another device/network using the Funnel URL directly in the address bar (e.g. `https://crm-mini.tail34e202.ts.net:8443/health`).

---

## Summary

| Check | Action |
|--------|--------|
| ACL | Funnel node attribute in [Access controls](https://login.tailscale.com/admin/acls). |
| HTTPS | Enabled for tailnet in admin console. |
| DNS | Wait up to 10 minutes after enabling/changing Funnel. |
| Device | Machine on, Tailscale connected, not sleeping. |
| Idle | Run `tailscale status` or ping the device, then retry from outside. |
| Funnel | Restart with `tailscale funnel off` then `tailscale funnel ...` again. |
| Network | Test from a different external network (e.g. cellular). |
| CSP | Use `about:blank` or direct URL for fetch tests if the app’s CSP blocks the backend. |

If Funnel still doesn’t work from outside after these steps, the limitation is likely relay availability or network path (ISP/firewall). For production, consider hosting the backend on a cloud provider (e.g. Railway, Render) and pointing the GitHub Pages app at that URL.
