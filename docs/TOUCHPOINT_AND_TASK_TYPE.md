# Touchpoint mapping and task type

## Last touchpoint

- **Source:** Derived from the **last logged call** or **last logged email** on the account.
- **Behavior:** When a note is created with type `call` or `email`, the account’s `lastTouchpoint` is set to that note’s timestamp (so the CSM dashboard and account detail show the most recent touch).
- **Implementation:** Backend updates `account.lastTouchpoint` in the note controller when creating a note with type `call` or `email`. Manual edits to Last touchpoint on the account edit form still work and can override.

## Next touchpoint

- **Primary source (future):** **Calendar** – when calendar integration is remapped, next touchpoint can be driven by the next scheduled calendar event for the account (e.g. “Next meeting”).
- **Secondary source:** **Tasks** – tasks that represent touchpoints (e.g. type `call` or `meeting`) can contribute to “next touch”:
  - For example: earliest due date among tasks with type `call` or `meeting` that are not completed.
- **Fallback:** Account’s `nextScheduled` field remains editable manually on the account edit form until calendar/task-based logic is fully in place.

## Task type (optional, extensible)

- **Purpose:** Classify tasks so we can use them for touchpoint cadence (e.g. “next call”, “next meeting”) and reporting.
- **Field:** Optional on the Task entity (`taskType`). Not required when creating or editing a task.
- **Initial values:** `call`, `meeting`. More values (e.g. `qbr`, `onboarding`, `renewal`) can be added over time.
- **Storage:** Single optional field (e.g. string/varchar or enum extended as needed). Non-mandatory so existing tasks and simple task creation stay unchanged.

## Summary

| Field           | Source / notes |
|----------------|----------------|
| **Last touch** | Last note with type `call` or `email` (backend updates account on create). |
| **Next touch** | Calendar (when remapped) + tasks with task type call/meeting; manual `nextScheduled` until then. |
| **Task type**  | Optional task field: `call`, `meeting`, and others later; non-mandatory. |
