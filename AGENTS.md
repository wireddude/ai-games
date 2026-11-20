# Project instructions

## Game project
- The playable game is `zelda.html`, a self-contained single-file Canvas/JavaScript game. Keep it dependency-free and playable by opening it directly in a browser unless the user asks to change that constraint.
- Before changing the game, read `GAMEPLAN.md` and inspect the relevant parts of `zelda.html`. Avoid replacing the whole file for small changes; preserve existing features and test for regressions.
- Make focused changes. After JavaScript edits, extract the `<script>` contents and run `node --check` on them. For gameplay changes, also describe a brief browser test checklist and be honest if no browser test was run.
- Keep controls and objectives discoverable in-game. Avoid external assets, build steps, or libraries unless explicitly approved.
- At the end of a meaningful feature, update `GAMEPLAN.md` with what changed, known issues, and the next small task. Do not commit unless asked.
