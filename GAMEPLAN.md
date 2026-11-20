# Zelda-style game: project handoff

## Flight Simulator v2 — plane and environment color pass
- Replaced the teal/cream aircraft in `flight-simulatorv2.html` with the red-and-white low-poly prop plane from `flight-simulator.html`, scaled to match v2's world; retained v2's camera and prop-animation hooks.
- Restored a vivid blue sky gradient and richer green terrain/trees, plus clearer blue ocean colors based on the original simulator palette.
- Validation: inline module JavaScript syntax check; no browser visual test run.
- Next: browser-check the aircraft scale, colors, and chase/cockpit views.

## Goal and constraints
Build a fun, simple NES-inspired top-down adventure. It should remain one standalone HTML file, work by opening it in a modern browser, and avoid external libraries/assets. Keep changes incremental and preserve existing playability.

## New games
- `zaxxon.html`: original isometric 3D-style scrolling fortress-runner ("ZAXXON — AEGIS DRIFT"). Single self-contained HTML file (inline CSS/JS, no external assets/libraries). Web Audio synthesized SFX + engine hum (unlocked on first tap/keypress, mute button + M key). Object-pooled bullets/particles, parallax floor grid, screen shake, DPR-aware crisp scaling.
  - Controls: Arrows/WASD strafe + climb-dive, Space/FIRE hold-to-autofire, P pause, M mute. Touch: left virtual joystick + right FIRE button (multi-touch, no scroll/zoom, safe-area aware, portrait rotate hint).
  - Gameplay: isometric diagonal scroll (upper-left); altitude matters (altimeter bar + ground shadow; bullets only hit overlapping altitude); fuel drains (shoot/touch green FUEL tanks to refill, empty = lose life); fortress walls with altitude gaps, electric barriers, gun turrets, radar beams, parked planes; open-space enemy fighters that shoot back and can be shot down; end-of-fortress boss robot requiring multiple hits on its weak point; 3 lives, extra life every 10,000, 3 loops with rising speed then game over; high score in localStorage.
  - Verified: `node --check` passes; headless smoke test (stubbed DOM/canvas, /tmp/test_zaxxon.js) exercises title→play, fuel drain, forward scroll, wall/fuel/boss/hostile logic, pause, death path — all pass.
  - Known limitations: no automated *visual*/browser test (projection + per-obstacle render-vs-collision verified numerically); hostiles drawn after obstacles (minor depth-sort artifact); boss approach is a fixed forward speed (no brake).
  - Bug fixes (round 2, after "crash into invisible things" report):
    - **Barrier render/collision were inverted** — wavy lines drew in the *safe gap* but the lethal field was the *invisible* surrounding space. Now the energy field fills the lethal bands and the safe gap is clearly empty with a green edge. Verified: in-gap survives, out-of-gap dies (4/4 tests).
    - **Fuel ran out before crossing a fortress** (16s tank vs 17s fortress). Now ~40s at loop 1.
    - **Mysterious deaths** — every death now shows a reason toast (CRASHED / OUT OF FUEL! / SHOT DOWN / RADAR HIT / HIT BOSS).
    - **Gap-finding aid** — altimeter now shows a green GAP marker + bracket at the next wall/barrier's safe altitude.
    - Walls brightened; `v2-fixed` tag bottom-right confirms the build.
  - Next small task: playtest in a real browser (desktop + iPhone); confirm barriers/walls read clearly; tune gap width (currently 0.30) and hostile bullet visibility if still hard to dodge.

## Geometry Dash — snappier jump + harder level (final)
- User feedback: jump was "a bit too floaty" and the level "way too easy". Retuned jump to `JUMP_FORCE -15 / GRAVITY 0.75` (150px high, 40-frame airtime) — clearly snappier than the original 270px/60.
- Chose 15/0.75 over the snappier 15/0.8 because a jump-window analysis showed 15/0.8 makes ground triples nearly impossible (5px safe window), while 15/0.75 keeps them hard but fair (23px window ≈ 4 frames). Singles stay easy (144px), doubles are challenging (83px).
- Rebuilt the level with a real difficulty curve: easy warmup (singles + 1 double, 0-6000) → 5 doubles (6000-11000) → tight doubles + first 2 triples (11000-16000) → 3 more triples + a platform section with a spike (16000-21200). 5 triples total. Every ground cluster has ≥700px recovery spacing, so difficulty comes from the tight triple timing, not unfair spacing.
- Validation: `node --check` passes; headless physics sim (exact game code) — bot clears 100%, no-jump runner dies at first spike, platform geometry correct, cube renders; forgiveness sweep shows 24% of timing combos clear (vs 38% for the previous easier level); audio suite re-run, no regressions. No real-browser playtest run.
- Regenerated manifest + index fallback and uploaded to the permanent here.now site.

## Geometry Dash — lower, faster jump + fairer level
- Jump retuned from `JUMP_FORCE -18 / GRAVITY 0.6` (270px high, 60-frame airtime) to `JUMP_FORCE -16 / GRAVITY 0.7` (183px high, 46-frame airtime) — clearly lower and snappier, per user request.
- The snappier jump made tight spike clusters physically impossible to clear (a ground triple needs ~31 frames above 40px; the old jump gave 55, the new one only ~25). Relaxed the level to match: four ground triple/quadruple clusters converted to doubles, one platform double to a single, and two platform spikes shifted to give landing room.
- Chose 16/0.7 over the snappier 16/0.75 because a forgiveness sweep (counting how many jump-timing combos clear the level) showed 16/0.7 is actually *more* playable: 38% of timing combos clear vs 15% for the original physics and 28% for 16/0.75. So the new jump is both snappier and fairer.
- Validation: `node --check` passes; headless physics sim (exact game code) — a bot clears 100% of the level, no-jump runner still dies at the first spike, platform geometry correct, cube renders cleanly; audio test suite re-run, no regressions. No real-browser playtest run.
- Regenerated manifest + index fallback and uploaded to the permanent here.now site.

## Geometry Dash — sound effects + background soundtrack
- Added a fully synthesized Web Audio module (no external files, matches the project's established pattern): jump blip (upward square-wave chirp), crash (filtered noise burst + descending saw), win fanfare (5-note rising arpeggio).
- Added a looping chiptune soundtrack (132 BPM, two-bar A-minor loop): driving 8th-note bass (A–F–G), catchy 16th-note lead melody, kick on downbeats, offbeat hi-hats. Starts on PLAY, stops on crash/win, restarts on retry.
- Audio unlocks on first user gesture (PLAY button / M key) per browser autoplay policy; all sounds route through a master gain.
- Added a persistent mute toggle: "♫ ON/OFF" button top-right (also `M` key), styled to match the neon theme, sits above the canvas with pointer-events isolated so it never triggers a jump.
- Validation: `node --check` passes; headless Web Audio stub test verified jump=1 oscillator, crash=noise+saw, win=5 notes, BGM schedules ~6 notes/700ms and stops cleanly, mute silences everything, bgmStart is idempotent; re-ran the full gameplay test (cube render, level clear, platform geometry) — no regressions. No real-browser audio test run.
- Regenerated manifest + index fallback and uploaded to the permanent here.now site.

## Geometry Dash — cube player + easy level 1 + platform bug fix
- Replaced the butt-shaped player with a classic Geometry Dash cube: cyan rounded square with glow, darker inner panel, two white eyes and a smile; title changed from "GEOMETRY BUTT" to "GEOMETRY DASH".
- Fixed a pre-existing sign bug in all obstacle math: `canvas.height - GROUND_HEIGHT - this.y` should have been `+ this.y`. Platforms with negative `y` rendered *buried in the ground* (y:-180 was off-screen entirely) and spikes-on-platforms had their kill-boxes sitting invisibly at ground level — a major source of "dies for no reason" frustration. Now `y:-80` correctly means 80px above the ground for drawing and collision alike.
- Rebuilt the level's first ~6000px as an easy warmup (level 1): 5-second run-up before the first spike, then 5 hazard groups 750-950px apart (singles, one gentle block, one gentle double). Density ramps up after that. Total level length unchanged (21200).
- Validation: inline script passes `node --check`; headless physics simulation (replicating the exact game code) verified: no-jump runner dies at the first spike, a simple jump-when-near bot clears the entire level (100% win), intro gaps all ≥750px, platform/spike-on-platform geometry now above ground, and the new cube render executes without errors. No visual browser test run.
- Regenerated manifest + index fallback and uploaded to the permanent here.now site.

## Tetris responsive canvas + touch controls
- Fixed the board canvas to scale responsively on iPhone/iPad/desktop: intrinsic 300×600 with `max-width: min(92vw, 300px)` and `max-height: 70vh`, so it always fits the viewport without distortion.
- Tightened the viewport meta (`maximum-scale=1, user-scalable=no, viewport-fit=cover`) and disabled tap highlights/zoom so the board loads cleanly on iOS.
- Touch controls now show on all coarse-pointer devices and use pointer events with hold-to-repeat for left/right (170ms) and soft-drop (90ms); hard drop, rotate, hold, and pause are tap buttons.
- iPhone portrait layout (≤700px): board fills the screen — width-driven `max-width: calc(100vw - 96px)` with `max-height: calc(100svh - 120px)` (board 297×594 on iPhone 15, ~94% width / 80% height of the viewport); slim 56px text stats column (score/lines/level + 48px next preview) on its right; Level Preview canvas, keyboard help, and footer quote hidden; touch button row sits directly under the board at full width. Layout math verified for iPhone SE / 15 / 15 Pro Max.
- Pass 1 of the mobile layout capped the board at 52vh (~50% of the screen) — user reported it wasted space; pass 2 sizes it to fill the viewport.
- Validation: inline script passes `node --check`; headless smoke test passed for startup, keyboard move/rotate/drop/hold, touch drop/rotate/pause, hold-to-repeat for left and down, and line-clear scoring. No visual browser/device test run — user reported first pass had too much content under the board on iPhone 15, fixed in the second pass.
- Regenerated manifest + index fallback and uploaded to the permanent here.now site.

## Breakout responsive controls and audio
- Increased the displayed canvas responsively up to 760px for desktop/tablet and fit it to phone width/height; added touch left/right paddle buttons and a launch button.
- Added procedural Web Audio cues for brick hits (row-dependent pitches) and paddle bounces, unlocked on user interaction.
- Validation: inline script passes `node --check`; headless smoke test passed for startup, keyboard movement, touch movement/release, and touch launch. No visual browser/device test run.
- Regenerated 23-game manifest and index fallback, uploaded to the permanent here.now site, and verified live Breakout contains the controls and audio functions.

## Cat Simulator — litter box update
- Added an automatic litter-box visit when the cat walks nearby. A short scratching sequence plays procedurally, then the cat leaves scattered litter behind while walking its first 165 canvas pixels after exiting.
- Updated `cat-simulator.html`, `manifest.json`, and the `index.html` offline fallback. Inline game and landing-page JavaScript pass `node --check`.
- Uploaded the revision to the permanent Solar System Lab here.now site and verified the live Cat Simulator contains the litter-box interaction.

## Global Warming (new standalone game)
- Added `global-warming.html`, a single-file, no-dependency pixel arcade satire playable directly in a browser. Includes California coast/park/suburb map, selectable litter (can, battery, e-waste, computer, refrigerator), litter cleanup and temperature reduction, Hummer idling, chasing Tree Huggers, zap/knockback, eco-risk game over, and 212°F cooked-planet victory with stats.
- HUD temperature/heat bar and ice coverage react to warming; touch controls support movement, litter, Hummer, zap, and item cycling. Procedural Web Audio effects are optional and unlock on interaction.
- Validation: extracted inline JavaScript passes `node --check`. Fixed startup render crash by initializing player/car before the first animation frame; title now previews the scene, and two Tree Huggers appear immediately. No browser/device playtest run.
- Landing/publishing: regenerated `manifest.json` and `index.html` fallback with all 23 root games. Updated the permanent here.now Solar System Lab site; verified the live listing contains the landing page, manifest, Global Warming, and Road Rage audio assets.
- Known limitation: touch layout and gameplay balance still need real-device testing; Hummer emissions accrue while near the vehicle, so stay by it with the engine on.
- Next task: browser-playtest desktop and iPhone/iPad, tune eco-risk and temperature pacing, and check responsive layout.

## Current state
- Main game: `zelda.html` (Canvas renderer at 320×240; all HTML, CSS, game logic, and synthesized sound in this file).
- Top-down exploration across a 3×3 room map with grass, trees, and water.
- WASD/arrow movement; Space/Z sword attack; E/Enter talk/interact; M pauses.
- Elder dialogue, enemies (slimes, bats, shrine boss), hearts, rupees, eastern key quest, and victory dialogue.
- Embedded JavaScript passes `node --check` (last checked after adding the chiptune soundtrack).
- NES-style chiptune soundtrack: original 8-bar loop in E minor (126 BPM) synthesized with Web Audio — square-wave lead + triangle bass, sequenced via a 16th-note timer. Starts muted on first load (browser autoplay policy); press N to enable/toggle. Music state shown in the HUD and help bar.
- No automated gameplay/browser test suite is set up. Test in a browser after changes.

## Recent fixes
- Fixed player getting stuck after crossing a room gate (the reported "walk into a wall and get stuck" bug): the down/left gate spawn positions placed the player's feet 1px inside the next room's wall row, so `blocked()` clamped them with no escape unless they were exactly on the gate column. All four gate spawn offsets now use `-4` so the feet land on the last grass row of the new room (verified against tile math for left/right/up/down).
- Fixed player getting stuck when walking into walls: `blocked()` only checked the two bottom (feet) corners, so the head could clip into a tree/water row and get clamped with no escape. Now checks top and bottom corners.
- Fixed chiptune sequencer: it wrapped at 16 steps (first bar only) instead of 128 (full 8-bar loop), so the music never progressed. Also `SE.start()` no longer blocks on `muted`, and `tick()` reads `this.muted` consistently, so toggling with N actually starts/stops playback.
- Added touch controls for phones/tablets (shown automatically on coarse-pointer/touch devices): on-screen D-pad (left) for movement, and action buttons (right) for SWORD, TALK, and music toggle. Reuses the same `keys`/`attack`/`interact`/music code paths as the keyboard.

## Known limitations / good next improvements
- Key is currently awarded automatically after clearing the eastern room; improve this into a visible pickup/clear quest feedback.
- No touch controls; keyboard is the supported control scheme.
- Room/enemy state resets when re-entering rooms; consider persistence if desired.
- Add a start/title screen, sound toggle, and more varied dialogue only as focused additions.

## Next task queue
Choose one task at a time; agree on scope before implementation:
1. Smoke-test all exits, sword combat, key pickup, boss fight, and win state in a browser (including the new music toggle); fix any bugs found.
2. Improve quest clarity and show a physical key pickup.
3. Add a title/start screen and a restart path after victory.
4. Add optional touch controls for phones.

## GTA 7 — 8-Bit Demake (new standalone game)
- Added `gta7.html`, a self-contained Canvas/JavaScript top-down city action game with procedural pixel visuals, scrolling city, roads/blocks/parks, pedestrians, traffic, selectable vehicle flavors, enter/exit, driving collisions, shooting, wanted stars, pursuing police, cash/score/health/armor HUD, minimap, Pay 'n' Spray, synthesized Web Audio effects, mute, title screen, and touch controls.
- Desktop controls: WASD/arrows, E enter/exit, F or click shoot, Space brake, M mute. Mobile includes D-pad, shoot, brake, and steal/exit.
- Validation: inline script passes `node --check`. No browser/device playtest run.
- Known limitations: simplified AI/pathing and combat; police behavior and soundscape are intentionally lightweight versus the full spec.
- Next task: browser-playtest on desktop and iPhone/iPad; tune touch layout, traffic/police behavior, and add persistent health/game-over restart.

## Handoff/update rule
At the end of each substantial work session, update this file: mark completed work, record bugs/decisions, and leave one concrete next task. Keep this document short enough to be useful to a fresh model.

<!-- check-in test 2026-11-20 08:17:31 -->
