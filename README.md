# LABYRINTHUS
A concrete ascent. Brutalist frutiger-aero skyscraper platformer with an ULTRAKILL-style style meter (run, bunnyhop, slide, dash, slam, wall jump, 3 air jumps, mantle, shallow water). Old description: brutalist mega-city movement game (run, bunnyhop, slide, dash, slam, wall jump, 3 air jumps, mantle, shallow water).
Goal: hop skyscraper to skyscraper above the clouds and climb the spiral balconies of the central megatower to the glowing beacon on its roof (the beam is visible from spawn). Chain tricks to raise your style rank D > C > B > A > S > SS > SSS.

## Play locally
Just open `index.html` (all scripts are classic `<script>` files, so it works from `file://` and from Electron).

## Host on GitHub Pages
1. Put the contents of this folder in the repo root (keep `.nojekyll`).
2. Repo **Settings > Pages > Deploy from a branch > `main` / root**.
3. Open `https://<user>.github.io/<repo>/`.

## Three.js
`lib/three.min.js` (r128) is included, so the game runs fully offline. `index.html` falls back to the cdnjs CDN if the file is ever missing.
(Use r128 - the shaders in `js/level.js` / `js/main.js` target it.)

## Audio
Put your files in `assets/audio/` and make the names match `MANIFEST` at the top of `js/audio.js`
(music: `music_menu`, `music_game`; sfx: jump, air_jump, wall_jump, dash, slide, land, punch, splash, mantle, slam, checkpoint, win, click).
Any `.mp3/.ogg/.wav` works - just edit the extension in the manifest. Missing files fall back to small synthesized sounds.

## Files
- `index.html`, `style.css` - menu / pause / settings UI
- `js/settings.js` - saved settings and keybinds (localStorage)
- `js/audio.js` - music + sfx loader
- `js/level.js` - renderer, sky, concrete texture + shaders, water, the level and checkpoints
- `js/player.js` - movement, mantling, water physics, fists, particles
- `js/main.js` - post-process shader, menu cinematic, UI, input, HUD, game loop

## Electron later
Load `index.html` in a `BrowserWindow`; the QUIT button calls `window.close()`.
