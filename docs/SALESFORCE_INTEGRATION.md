# Salesforce Integration (pre–Phase 1)

This doc outlines what to set up in Salesforce first, and what we can do from the CRM once your developer account is ready. Phase 1 of the CSM features is planned to start after this integration is in place (or at least OAuth is working).

---

## What you’ll set up in Salesforce

1. **Developer account**  
   - Sign up at [developer.salesforce.com](https://developer.salesforce.com) if you don’t have one.  
   - Gives you a sandbox/org to build and test against.

2. **Connected App (for OAuth)**  
   - In Setup → App Manager → New Connected App (or Create → Apps → Connected Apps).  
   - Enable **OAuth Settings**:  
     - Callback URL: your CRM’s callback (e.g. `https://your-crm-domain/crm/api/integrations/salesforce/callback` or localhost for dev).  
     - Selected OAuth Scopes: at least `api` (or `full` for sandbox), and `refresh_token` if you want long-lived access.  
   - After saving, note the **Consumer Key (Client ID)** and **Consumer Secret (Client Secret)**.  
   - Optionally enable “Allow refresh token” and set refresh token validity.

3. **Decide initial use case**  
   - **Read-only:** Sync Accounts (and optionally Contacts) from Salesforce into the CRM for viewing or matching.  
   - **Write-back:** Push CRM account/contact changes back to Salesforce.  
   - **Both:** Two-way sync or manual “push to Salesforce” from CRM.  

   This drives which scopes and which APIs we use (REST API, Composite, etc.).

---

## What we can do from the CRM once that’s ready

- **OAuth flow**  
  - Backend: redirect to Salesforce auth URL, handle callback, exchange code for access + refresh token, store tokens (per org or per user, depending on your model).  
  - Frontend: “Connect to Salesforce” button and optional “Disconnect” / “Reconnect”.

- **API client**  
  - Use access token to call Salesforce REST API (e.g. `GET /services/data/v59.0/sobjects/Account`, query via SOQL).  
  - Use refresh token to get a new access token when it expires.

- **Initial object support**  
  - **Accounts:** Map Salesforce Account to CRM Account (name, industry, etc.). Either one-way import or two-way field mapping.  
  - **Contacts:** Map Salesforce Contact to CRM Contact and link to CRM Account (by external ID or name matching).  
  - **Optional later:** Opportunities, Cases (support), or custom objects depending on your CSM use cases.

- **Sync direction and frequency**  
  - One-time “Import from Salesforce” or scheduled sync (e.g. nightly).  
  - Optional “Push to Salesforce” from account/contact detail when you add write-back.

- **Where it fits the CSM plan**  
  - Salesforce can become a source for account/contact data, support (Cases), or opportunities so that Phase 1+ features (renewal pipeline, CSM workload, activity timeline) can eventually consider Salesforce data too.

---

## When you’re ready

Once you have:

- Developer account created  
- Connected App with Client ID and Secret  
- Callback URL you’ll use (e.g. backend route for OAuth callback)  

we can add the backend OAuth flow, token storage, and a minimal REST client, then wire up a “Connect to Salesforce” step in the CRM and decide the first object (e.g. Account) and sync direction.

No code changes are required in the repo until you’ve completed the developer account and Connected App setup; this doc is the checklist and handoff for that.
