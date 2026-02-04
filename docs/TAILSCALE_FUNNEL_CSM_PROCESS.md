# Tailscale Funnel: CSM CRM (Option B) — Process & Impact

This document describes **what** we change, **how** it affects other systems on the same machine, and **how to revert** if needed. Use it to plan before enabling the CSM Funnel.

---

## 1. Current state (assumed)

| System        | Backend port (host) | Exposed via Tailscale Funnel | Public URL (example) |
|---------------|---------------------|------------------------------|----------------------|
| **Pilzno CRM**| 3002                | Yes (default HTTPS, port 443)| `https://crm-mini.tail34e202.ts.net` |
| **CSM CRM**  | 3004                | No                           | —                    |

- One Tailscale node (this machine); one Funnel target today = Pilzno on 443 → localhost:3002.
- CSM backend runs in Docker on host port **3004** but has no public Funnel URL yet.

---

## 2. Change we are making

**Add a second Funnel target** so CSM has its own public URL, without changing Pilzno:

- **Command:** `tailscale funnel --https=8443 --bg 3004`
  - **Meaning:** Expose local port **3004** (CSM backend) on Funnel’s **HTTPS port 8443** (background).
- **Result:** A new public URL, e.g. `https://crm-mini.tail34e202.ts.net:8443`, that proxies to `http://127.0.0.1:3004`.

Tailscale Funnel allows three HTTPS ports on the same node: **443**, **8443**, and **10000**. We use **443** for Pilzno (unchanged) and **8443** for CSM.

---

## 3. Impact on other systems on this machine

| System / concern | Impact |
|-----------------|--------|
| **Pilzno CRM** (port 3002, Funnel 443) | **None.** Existing Funnel on 443 → 3002 is not modified. `https://crm-mini...ts.net` (no port) continues to hit Pilzno. |
| **CSM CRM** (port 3004) | **New.** Gets `https://crm-mini...ts.net:8443` → 3004. No change to Docker or app code; only Funnel config. |
| **Other Funnel targets** | **None** if nothing else uses Funnel port **8443**. If you already use 8443 for something else, pick **10000** instead and use `--https=10000` in the command and in the GitHub secret. |
| **Tailscale VPN / MagicDNS** | **None.** Funnel only adds a public HTTPS endpoint; tailnet access and DNS are unchanged. |
| **Docker / other containers** | **None.** We do not change ports or containers; we only tell Tailscale to proxy 8443 → 3004. |

**Summary:** Pilzno and any other services keep their current behavior. Only CSM gains a new public URL on port 8443.

---

## 3a. Status after enabling (example)

After running `tailscale funnel --https=8443 --bg 3004`, `tailscale funnel status` shows:

- `https://crm-mini.tail34e202.ts.net` → Pilzno (3002), unchanged.
- `https://crm-mini.tail34e202.ts.net:8443` → CSM (3004), new.

---

## 4. Process (what runs where)

1. **On this machine (where Tailscale is installed)**  
   - Run: `tailscale funnel --https=8443 --bg 3004`  
   - Optional: `tailscale funnel status` to confirm and copy the CSM URL (e.g. `https://crm-mini.tail34e202.ts.net:8443`).  
   - **Privilege:** On Windows, Tailscale Funnel often needs an elevated shell (Run as Administrator). If the command fails with a permission error, run it from an Admin PowerShell or Command Prompt.

2. **In GitHub (bennyg83/csmcrm)**  
   - You: Set the Actions secret **BACKEND_API_URL** to the CSM Funnel URL **with no trailing slash** (e.g. `https://crm-mini.tail34e202.ts.net:8443`).

3. **Redeploy frontend**  
   - Push to `main` or run the workflow “Deploy frontend to GitHub Pages” so the built app uses the new backend URL.

No changes to Pilzno repo, Pilzno Funnel, or Pilzno secrets.

---

## 5. Revert (if you need to remove CSM Funnel)

To stop exposing CSM and free Funnel port 8443:

```bash
tailscale funnel --https=8443 3004 off
```

Or (equivalent):

```bash
tailscale funnel --https=8443 off
```

Pilzno (443 → 3002) is unaffected. After reverting, set **BACKEND_API_URL** back to an alternative (e.g. path-based URL or empty) and redeploy the frontend if needed.

---

## 6. Optional: use port 10000 instead of 8443

If 8443 is already in use or you prefer it reserved:

- Run: `tailscale funnel --https=10000 --bg 3004`
- Set **BACKEND_API_URL** to `https://crm-mini.tail34e202.ts.net:10000` (or your node name + `:10000`).

Impact on other systems is the same; only the port number changes.
