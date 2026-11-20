# Project instructions

## Game project
- The playable game is `zelda.html`, a self-contained single-file Canvas/JavaScript game. Keep it dependency-free and playable by opening it directly in a browser unless the user asks to change that constraint.
- Before changing the game, read `GAMEPLAN.md` and inspect the relevant parts of `zelda.html`. Avoid replacing the whole file for small changes; preserve existing features and test for regressions.
- Make focused changes. After JavaScript edits, extract the `<script>` contents and run `node --check` on them. For gameplay changes, also describe a brief browser test checklist and be honest if no browser test was run.
- Keep controls and objectives discoverable in-game. Avoid external assets, build steps, or libraries unless explicitly approved.
- At the end of a meaningful feature, update `GAMEPLAN.md` with what changed, known issues, and the next small task. Do not commit unless asked.

## Repo & check-in (gitea2 → GitHub mirror → Pages)
- Primary remote for check-ins is **`ai-games`** → `http://gitea2:3000/wireddude/ai-games.git` (Gitea on the LAN; also reachable at `192.168.4.153:3000`). `origin` still points at the old `solar-system` repo — leave it alone.
- The `ai-games` master is mirrored to GitHub (`wireddude/ai-games`) and GitHub Pages publishes `master`. So a check-in here propagates: gitea2 → GitHub → Pages.
- **Auth:** the token is stored in git's credential store (`~/.git-credentials`, host stored URL-encoded as `gitea2%3a3000`). Never write the token into any tracked file (it would leak via the GitHub mirror / Pages).
- **Commit (no GPG):** the global config signs commits via 1Password (`op-ssh-sign`), which fails headless. Always commit with `-c commit.gpgsign=false`.
- **Push (clean):** the homebrew system config adds an `osxkeychain` helper that spits harmless `-25308` noise headlessly. Silence it with `GIT_CONFIG_NOSYSTEM=1` and force the `store` helper.
- Ready-to-use check-in commands:
  ```bash
  git add -A
  git -c commit.gpgsign=false commit -m "<message>"
  GIT_TERMINAL_PROMPT=0 GIT_CONFIG_NOSYSTEM=1 git -c credential.helper=store push ai-games master
  ```
- Nested repos `cow_abduction/` and `road-rage/` each have their own `.git` (GitHub). Their *files* are tracked here as regular files; don't let git turn them into gitlinks (if `git add` warns about an embedded repo, move its `.git` aside first, add, then restore it).
