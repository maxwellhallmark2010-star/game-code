# game-code

Browser games written from scratch. No installs or build step: open the `index.html` file in a browser.

## Blockhaven (`blockhaven/`)

A small Minecraft-style block world, written in plain JavaScript and raw WebGL with no libraries.

- 128 × 128 world with hills, beaches, lakes, trees, coal ore and snowy peaks
- Break and place 10 block types, with procedurally drawn pixel textures
- Walking, jumping, swimming and flying, with block collision
- Soft corner shading, distance fog and see-through water
- Your world and position save to the browser automatically
- Keyboard and mouse controls, plus touch controls on phones

Controls: WASD to move, mouse to look, left click to break, right click to place,
1–9 or the scroll wheel to pick a block, Space to jump, F to fly, Shift to descend, Ctrl to sprint.

## Greywater Hollow (`rpg/`)

A top-down medieval RPG: hunger and stamina, a day/night cycle with torches and campfires,
melee combat with blocking, a village with traders, an inn and a three-part quest line.

## Rio Bravo Run (`rio-bravo/`)

A 3D western chase in raw WebGL. You just robbed the Dry Gulch bank: ride your horse
1,000 metres north to the Rio Bravo while the sheriff and his deputies chase you and shoot.

- Gallop (Shift) to outrun them, but it tires the horse
- Six-shot revolver: click to fire, R to reload; headshots drop a lawman in one hit
- Shoot a lawman's horse to slow him down
- Q for Dead Eye, which slows time; it refills when you take down lawmen
- Mesas block bullets, cacti slow you down, and the posse grows the farther you ride

## Level 0 (`backrooms/`)

A found-footage Backrooms game in raw WebGL. Every pixel is lit by the nearby fluorescent
panels, and walls cast shadows from them. Wallpaper, carpet and ceiling tiles are drawn
procedurally with surface bumps, damp stains and rising damp. The image goes through a camcorder
pipeline: bloom, lens distortion, chromatic aberration, film grain, scanlines and tape tearing.

- An endless procedural maze: open halls with pillars, tight corridors and dark zones
- Find the exit door; the SIGNAL bars rise as you get closer
- The battery icon is your sanity. Darkness drains it; almond water restores it
- When the lights around you start to flicker, something is hunting you. Run (Shift)
- Synthesised audio: fluorescent hum, footsteps on carpet, distant knocking
