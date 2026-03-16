# Upstream Sync

This fork is the source of truth for UI changes, including Lovable edits.

## Behavior

On every push to `main` in `caseyjkey/Neon-Goals-UI`, GitHub Actions force-pushes the same commit to `keycasey/Neon-Goals-UI` `main`.

Both repositories keep the workflow files in git, but each workflow is guarded by repository name:

- `Sync Upstream` only runs in `caseyjkey/Neon-Goals-UI`
- `Deploy to EC2` only runs in `keycasey/Neon-Goals-UI`

That keeps direct main-to-main sync simple while preventing the fork from trying to deploy.

## Required Secret

Configure this repository secret in the fork:

- `UPSTREAM_SYNC_TOKEN`

The token must have write access to `keycasey/Neon-Goals-UI`.

If you use a personal access token, it also needs permission to update workflow files in the upstream repo.

## Workflow

The sync automation lives in:

- `.github/workflows/sync-upstream.yml`

This document is intentionally kept in the fork so sync behavior is easy to verify and update.

Latest verification was done after updating the upstream sync token permissions.
