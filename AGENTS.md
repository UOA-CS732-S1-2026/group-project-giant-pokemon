<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:amyas-worktree-workflow -->
# Git worktree workflow for this project

Before any commit, push, pull, merge, branch creation, test branch creation,
teammate branch review, or dev-server launch, remind Amyas to confirm the
intended worktree and branch.

Use this default workflow:

- Feature implementation happens in the current feature worktree.
- Team integration testing happens in `/Users/amyas/Dev/taskflow`.
- Risky reviews and experiments happen in a temporary worktree.
- Do not pull latest `dev` directly into a feature worktree unless the task is
  explicitly to resolve integration conflicts there.
- Stage only files that belong to the current change; avoid broad staging when
  unrelated files are present.

The full personal workflow note is kept locally at
`.personal/git_worktree_workflow.md`; that directory is intentionally ignored by
Git.
<!-- END:amyas-worktree-workflow -->
