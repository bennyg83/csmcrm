# Versioning for CSM CRM

## Current state

- **VERSION** (root): `2.4.1`
- **package.json** (root, frontend, backend): `"version": "2.4.1"`
- **CHANGELOG.md**: Exists; latest entries are `[2.4.1-buggy]` and `[2.4.0]`
- **Git tags**: `v2.1.0`, `v2.2.0`, `v2.3.0`, `v2.3.2`, `v2.4.1-buggy` — **no `v2.4.1`** on current branch

So: the repo **does** have versioning (VERSION file, package.json, CHANGELOG, tags), but the **current main branch is not tagged** as v2.4.1. `git describe` shows something like `v2.2.0-30-g...`, meaning “30 commits after v2.2.0”.

---

## Recommendations

### 1. Single source of truth

- **Use the root `VERSION` file** as the one place you edit the version (e.g. `2.4.1` → `2.5.0`).
- Optionally: a small script or npm script that reads `VERSION` and syncs it into root + frontend + backend `package.json` so you don’t have to edit three files by hand.

### 2. Align Git with the current release

- Tag the **current** commit as the release that matches `VERSION`:
  - If you consider current state to be **2.4.1**:
    - `git tag -a v2.4.1 -m "Release 2.4.1"`
    - `git push csmcrm v2.4.1`
  - That gives you a clear “v2.4.1” in GitHub and locally (e.g. `git describe` → `v2.4.1`).

### 3. Keep using semantic versioning

- **MAJOR** (e.g. 3.0.0): Breaking API or product changes.
- **MINOR** (e.g. 2.5.0): New features, backward compatible.
- **PATCH** (e.g. 2.4.2): Bug fixes, small fixes, no new features.

Stick with this in **VERSION** and in **CHANGELOG.md** (e.g. `## [2.4.2] - YYYY-MM-DD`).

### 4. Simple release process (no automation yet)

1. **Bump version**
   - Edit **VERSION** (e.g. `2.4.1` → `2.4.2` or `2.5.0`).
   - Optionally sync to root + frontend + backend `package.json` (or do it manually for now).

2. **Update CHANGELOG.md**
   - Add a new section, e.g. `## [2.4.2] - YYYY-MM-DD`, and list changes (or “Patch release”).

3. **Commit and push**
   - e.g. `git add VERSION package.json frontend/package.json backend/package.json CHANGELOG.md && git commit -m "chore: release 2.4.2" && git push csmcrm main`

4. **Tag and push tag**
   - `git tag -a v2.4.2 -m "Release 2.4.2"`
   - `git push csmcrm v2.4.2`

5. **GitHub**
   - Tags are in the repo; you can create “Releases” from them in GitHub (Releases → “Draft a new release” → choose the tag).

### 5. Optional: show version in the app

- In the frontend, read version at build time (e.g. from `import.meta.env` or a generated file from `VERSION`) and show it in the UI (e.g. Settings or footer): “CSM CRM 2.4.1”. That way “what’s deployed” is visible without checking Git.

---

## Summary

- You **already have** version state (VERSION, package.json, CHANGELOG, tags); the main gap is that **current main is not tagged** as v2.4.1.
- **Introduce clearer versioning** by: (1) using **VERSION** as source of truth, (2) **tagging the current commit** as v2.4.1 (or the next version you choose), (3) following the small **release process** above for future releases, and (4) optionally showing the version in the app.

If you want, the next step can be: “tag current commit as v2.4.1 and push the tag to csmcrm,” plus a one-line note in README or LAUNCH.md that version is in **VERSION** and releases are tagged in Git.
