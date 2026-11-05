# LABYRINTHUS
Brutalist skyscraper platformer (with a little frutiger-aero water and grass) with an ULTRAKILL-style style meter (run, sprint, bunnyhop, slide, wall jump, 3 air jumps, mantle, shallow water).
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
(music: `music_menu`, `music_game`; sfx: jump, air_jump, wall_jump, dash, slide, land, punch, splash, mantle, slam, checkpoint, win, click).
Any `.mp3/.ogg/.wav` works - just edit the extension in the manifest. Missing files fall back to small synthesized sounds.

## Files
- `index.html`, `style.css` - menu / level picker / pause / settings UI
- `js/settings.js` - saved settings and keybinds (localStorage)
- `js/audio.js` - music + sfx loader, synthesized rain/wind/thunder
- `js/level.js` - renderer, sky, materials, water, level-building helpers
- `js/env.js` - random time of day (dawn/day/dusk/night) + 50% weather (rain, thunder, snow, fog, pour) each level load
- `js/levels.js` - level 1 (ASCENT) and level 2 (HOLLOW GRID, 3x longer, with offices, scaffolding, gondolas)
- `js/player.js` - movement, mantling, moving-platform carry, water, particles
- `js/menu.js` - the static abandoned-50th-floor city scene with birds and clouds
- `js/main.js` - dither/posterize post shader, UI, input, HUD, 2D hands, game loop

## Electron later
Load `index.html` in a `BrowserWindow`; the QUIT button calls `window.close()`.
