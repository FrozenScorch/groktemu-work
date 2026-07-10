# Publication policy

This repository is public by design. A project may be published only when all
of the following are true:

- The coding task was requested by the configured Discord bot owner.
- Automated validation and the project's build completed successfully.
- Every path passes an allowlist and secret scan.
- The project contains no conversation transcript, raw prompt, Discord ID,
  memory, voice transcript, database, log, environment file, credential,
  private key, access token, cookie, or host configuration.
- Source code is stored below `projects/<slug>/`.
- Only static, already-built assets are stored below `docs/apps/<slug>/`.

Public metadata is deliberately small: project slug, task ID, publication time,
source URL, and preview URL. Request text and requester identity are not public
metadata.

If private material is discovered, remove it from the current tree immediately,
rotate any exposed credential, and rewrite Git history if necessary. Deleting a
file in a later commit does not remove it from earlier Git history.
