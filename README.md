# LABYRINTHUS
A concrete ascent. Brutalist mega-city movement game (run, bunnyhop, slide, dash, slam, wall jump, 3 air jumps, mantle, shallow water).
Goal: climb to the orange beacon on top of the central tower (it is visible from the spawn plaza).

## Play locally
Just open `index.html` (all scripts are classic `<script>` files, so it works from `file://` and from Electron).

## Host on GitHub Pages
1. Put the contents of this folder in the repo root (keep `.nojekyll`).
2. Repo **Settings > Pages > Deploy from a branch > `main` / root**.
3. Open `https://<user>.github.io/<repo>/`.

## Three.js
`index.html` loads `lib/three.min.js` first and falls back to the cdnjs CDN (r128) if the file is missing.
For the offline Electron build, download https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js into `lib/three.min.js`.
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
