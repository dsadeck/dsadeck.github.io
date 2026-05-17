# 0004 — No Export / Import or cross-device sync

Grindspace is a single-device tool. We considered three Import semantics:

1. Replace + auto-backup of prior state to a separate localStorage key
2. Merge by problem id, latest-attempt-wins
3. Interactive per-Problem diff and pick

All three carry real complexity (merge semantics, schema-version negotiation, restore-from-backup UX) and introduce a class of "I imported the wrong file and lost my progress" failure modes. For a personal tool, the value to a single user is small.

Users who clear browser data or switch devices lose their progress. That is an accepted trade-off for the simplicity of the app. If the project ever grows toward genuine multi-device use, server-backed sync (not Export/Import) is the right next step.
