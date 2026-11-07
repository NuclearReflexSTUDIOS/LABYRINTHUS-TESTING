# LABYRINTHUS
Brutalist skyscraper platformer (with a little frutiger-aero water and grass) with an ULTRAKILL-style style meter (run, sprint, bunnyhop, slide, wall jump, 3 air jumps, mantle, vault, shallow water).
Goal: hop skyscraper to skyscraper above the clouds and climb the spiral balconies of the central megatower to the glowing beacon on its roof (the beam is visible from spawn). Chain tricks to raise your style rank D > C > B > A > S > SS > SSS.

## Play locally
Just open `index.html` (all scripts are classic `<script>` files, so it works from `file://` and from Electron).

## Host on GitHub Pages
1. Put the contents of this folder in the repo root (keep `.nojekyll`).
2. Repo **Settings > Pages > Deploy from a branch > `main` / root**.
3. Open `https://<user>.github.io/<repo>/`.

## Mobile
On phones/tablets (coarse pointer) the game switches to touch controls automatically: left thumb = floating stick, right thumb = look, buttons for jump / sprint / slide / punch / light, hold CHECKPOINT to respawn, II to pause. Landscape only. Add `?touch` to the URL to force them on a desktop for testing.

## Three.js
`lib/three.min.js` (r128) is included, so the game runs fully offline. `index.html` falls back to the cdnjs CDN if the file is ever missing.
(Use r128 - the shaders in `js/level.js` / `js/main.js` target it.)

## Audio
Put your files in `assets/audio/` and make the names match `MANIFEST` at the top of `js/audio.js`
(music: `music_menu`, `music_game`; sfx: jump, air_jump, wall_jump, dash, slide, land, punch, splash, mantle, slam, checkpoint, win, click, vault, step, flashlight, rank_up; optional, a layered synth plays if missing).
Any `.mp3/.ogg/.wav` works - just edit the extension in the manifest. Missing files fall back to small synthesized sounds.

## Files
- `index.html`, `style.css` - menu / level picker / pause / settings UI
- `js/settings.js` - saved settings and keybinds (localStorage)
- `js/audio.js` - music + sfx loader, synthesized rain/wind/thunder
- `js/level.js` - renderer, sky, materials, water, level-building helpers
- `js/env.js` - random time of day (dawn/day/dusk/night) + 50% weather (rain, thunder, snow, fog, pour) each level load
- `js/detail.js` - prop library (AC units, tanks, crates, cubicles, server racks...), roof/office/building dressing, painted wall + floor text
- `js/levels.js` - level 1 (TUTORIAL, 650 m, instructions painted on the roofs) and level 2 (HOLLOW GRID, 1350 m: offices, scaffolding, gondolas, crane girder, atrium, tram, tube bridges)
- `js/player.js` - movement, mantling, moving-platform carry, water, particles
- `js/menu.js` - the static abandoned-50th-floor city scene with birds and clouds
- `js/main.js` - dither/posterize post shader, UI, input, HUD, 2D hands, game loop

## Electron later
Load `index.html` in a `BrowserWindow`; the QUIT button calls `window.close()`.


## Pacing, colours and the item wheel
- The whole simulation runs at 70% speed (`GAME_SPEED` in `js/cine.js`). Jumps, gaps and moving platforms scale together, so every level stays beatable.
- Level colours show how long a level takes, not how hard it is: green 20s-1min, blue 1-3, orange 3-5, red 5-7, black 7-12, white 12-20, chrome about 1 hour. Set `tier:'green'` etc. on a LEVELS entry.
- Each level starts with a fly-over (press any key to skip); checkpoints show letterbox bars.
- Hold Q for the 8-slot revolver item wheel (rebindable). Only the flashlight does anything yet; the other slots are placeholders for food, water and so on.
- Settings has a "typing click noises" option.

## Levels, hands, camera (v3)
- Level 1 (Tutorial) keeps its straight lesson route but gains a megastructure backdrop and a spiral finale around THE SPINE.
- Level 2 (Hollow Grid) was rebuilt around megastructures: gates, a 140 m cable bridge, an atrium spiral, a lit office, a facade climb, a ring station, a wall-jump shaft, skybridge sprints and a crown spire. Helpers are in `js/mega.js` (`hop`, `helix`, `gate`, `cableBridge`, `megaTower`...).
- Hands are a single square each. Replace the body of `handModel()` in `js/main.js` with `drawImage` to use real hand art; the animation already supplies position, rotation and scale.
- Camera: step-synced bob, strafe/wall/slide roll, landing dip, vault/mantle pitch.
- Menu has mouse parallax (DOM layers + the 3D camera). HUD has a progress bar with checkpoint ticks.
