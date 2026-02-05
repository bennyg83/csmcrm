# Release Plan: Versioning & Release Process

This plan turns the recommendations in [VERSIONING.md](./VERSIONING.md) into ordered, actionable work. Each phase can be done in a single session; later phases assume earlier ones are done.

---

## Phase 1: Align current state (one-time)

**Goal:** Current `main` is clearly v2.4.1 in Git and on GitHub so future releases are “after v2.4.1”.

| # | Task | Details | Done |
|---|------|---------|------|
| 1.1 | Tag current commit as v2.4.1 | `git tag -a v2.4.1 -m "Release 2.4.1"` | ☐ |
| 1.2 | Push tag to remote | `git push csmcrm v2.4.1` (or your main remote) | ☐ |
| 1.3 | Optional: create GitHub Release | GitHub → Releases → New release → choose tag `v2.4.1`, add notes from CHANGELOG | ☐ |

**Acceptance:** `git describe` shows `v2.4.1` (or `v2.4.1-n-g...` after new commits). Tag exists on GitHub.

---

## Phase 2: Single source of truth for version

**Goal:** Edit version in one place (root `VERSION`); package.json files stay in sync.

| # | Task | Details | Done |
|---|------|---------|------|
| 2.1 | Add sync script | Script reads `VERSION`, writes `version` into root, `frontend/package.json`, `backend/package.json` | ☐ |
| 2.2 | Add npm script | In root `package.json`: e.g. `"version:sync": "node scripts/sync-version.js"` | ☐ |
| 2.3 | Document usage | In VERSIONING.md: “After editing VERSION, run `npm run version:sync`” | ☐ |

**Acceptance:** Changing `VERSION` and running the script updates all three `package.json` versions. No manual edits to package.json for version bumps.

**Optional:** Run `version:sync` in CI before build so VERSION is always the source of truth.

---

## Phase 3: Release process (manual, repeatable)

**Goal:** Clear, repeatable steps for every release (e.g. 2.4.2, 2.5.0).

| # | Task | Details | Done |
|---|------|---------|------|
| 3.1 | Bump version | Edit `VERSION` (e.g. 2.4.1 → 2.4.2). Run `npm run version:sync` (if Phase 2 done). | ☐ |
| 3.2 | Update CHANGELOG | Add `## [2.4.2] - YYYY-MM-DD` and list changes (or “Patch release”). | ☐ |
| 3.3 | Commit release | `git add VERSION package.json frontend/package.json backend/package.json CHANGELOG.md && git commit -m "chore: release 2.4.2"` | ☐ |
| 3.4 | Push branch | `git push csmcrm main` | ☐ |
| 3.5 | Tag and push tag | `git tag -a v2.4.2 -m "Release 2.4.2"` then `git push csmcrm v2.4.2` | ☐ |
| 3.6 | Optional: GitHub Release | Create release from tag, paste CHANGELOG section. | ☐ |

**Acceptance:** Each release has one commit that updates VERSION + CHANGELOG (+ package.json if synced), and one tag pushed to remote. CHANGELOG format matches [Keep a Changelog](https://keepachangelog.com/).

**Optional:** Add a root script `release` that prompts for new version and prints the exact git commands (no automatic tagging/pushing).

---

## Phase 4: Show version in the app

**Goal:** Deployed app shows “CSM CRM 2.4.1” (or current version) so “what’s deployed” is visible without Git.

| # | Task | Details | Done |
|---|------|---------|------|
| 4.1 | Inject version at build time | e.g. Vite `define: { __APP_VERSION__: JSON.stringify(version) }` where version is read from root `VERSION` or `package.json` | ☐ |
| 4.2 | Display in UI | Show version in footer, Settings page, or login footer (e.g. “CSM CRM 2.4.1”) | ☐ |
| 4.3 | Document | In VERSIONING.md or README: version in UI comes from VERSION at build time | ☐ |

**Acceptance:** After building frontend, the UI shows the version that matches `VERSION` (or root package.json) at build time.

---

## Phase 5: Rollback and DB safety (documentation)

**Goal:** Everyone knows how to roll back code/deploy and what to do about the database.

| # | Task | Details | Done |
|---|------|---------|------|
| 5.1 | Document code/deploy rollback | In VERSIONING.md: “To roll back: checkout tag (e.g. `git checkout v2.4.1`), build, redeploy. Deploy by version/tag so rollback = redeploy previous tag.” | ☐ |
| 5.2 | Document DB rollback | In VERSIONING.md: “Versioning does not roll back DB. Options: (1) Reversible migrations (TypeORM down), (2) DB backups/point-in-time restore before major releases.” | ☐ |
| 5.3 | Optional: add rollback to RELEASE_PLAN | Short “Rollback” section in this doc: when to roll back, steps for app rollback, when to restore DB | ☐ |

**Acceptance:** VERSIONING.md (and optionally this plan) describe app rollback and DB considerations. Team knows not to rely on “version number” alone for DB rollback.

---

## Summary

| Phase | Scope | Outcome |
|-------|--------|---------|
| 1 | One-time | Current main = v2.4.1 in Git/GitHub |
| 2 | One-time + ongoing | VERSION is source of truth; optional sync script |
| 3 | Every release | Repeatable release steps (bump, CHANGELOG, commit, tag, push) |
| 4 | One-time + build | Version visible in app UI |
| 5 | One-time | Rollback (code + DB) documented |

**Suggested order:** Do Phase 1 first (tag v2.4.1). Then Phase 2 (sync script) so future releases only touch VERSION. Then Phase 3 is your standard process. Phase 4 and 5 can be done in parallel or after Phase 3.

---

## Quick reference: semantic versioning

- **MAJOR** (3.0.0): Breaking API or product changes.
- **MINOR** (2.5.0): New features, backward compatible.
- **PATCH** (2.4.2): Bug fixes, no new features.

Keep this in `VERSION` and in CHANGELOG section titles (e.g. `## [2.4.2] - YYYY-MM-DD`).
