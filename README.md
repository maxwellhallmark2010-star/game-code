# game-code
im gonna be creating games

Open `index.html` to pick a game, or open a game's own `index.html` directly.
Both games run in Chrome, Edge, Firefox or Safari. They need an internet connection
the first time to load the Three.js 3D library.

## Frontline (`frontline/index.html`)

A third-person war game across two trench lines, a ruined village and the sea.
The style is blocky with no blood: soldiers fall over when they're hit.

- **Win** by capturing the Ruins in the middle, then the enemy's East Trench. Lose if they take all three.
- **Your squad fights with you.** Teammates get hit and go down. A wounded soldier shows a red cross
  and calls for a medic. Carry him (E) to a medic tent and he's healed back into the fight.
  Carry a wounded *enemy* to your medic and he joins your side.
- **Surrendering enemies** raise a white flag. You can recruit them (E), but watch for the hint:
  "he looks relieved" usually means he's honest, "he keeps eyeing his rifle" usually means he'll betray you.
- **Loot** bodies and supply crates for ammo, grenades, medkits, the enemy SMG and a rocket launcher.
  Raiding the enemy's supply crate works too.
- **Vehicles:** drive tanks (cannon + machine gun), fly jets (guns + bombs, the jet flies where you look,
  E ejects with a parachute), and man anti-aircraft guns. Sneak behind enemy lines to steal their parked
  tanks and jets or take over their AA guns. Enemy tank crews bail out of badly damaged tanks, and then you can steal those too.
- **The sea:** warships from both sides shell each other and the trenches. Bomb the enemy fleet from a jet.
- **Ragdolls:** soldiers flinch and stumble when hit. When they go down, they stagger, clutch the wound and throw an
  arm out to break the fall. Explosions send bodies flying with limbs flailing, and the wounded writhe and reach up for help.
- **Aiming:** right click with the rifle looks through a zoomed scope. Guns kick up when fired, and the crosshair spreads
  when you move or keep firing. It turns red over an enemy, your aim slows a little there, and near misses get pulled onto the target.

Controls: WASD move, mouse aim, left click shoot, right click aim, E use, Shift sprint, C crouch,
Space jump, R reload, G grenade, Q medkit, 1/2/3 weapons, H pause, M sound.

## Sneak Out (`sneak-out/index.html`)

You're grounded and locked in your bedroom. Your friends are at Maple Park until the
streetlights come on at 8:15. Sneak out the window, grab your bike off the sidewalk,
and ride two blocks down to the park on the right.

- **The bedroom:** put on your sneakers, stuff pillows under your blanket so Mom thinks
  you're asleep, then open the window and climb out onto the porch roof (E).
- **Mom checks on you.** You'll hear footsteps on the stairs first. If you're gone and
  there's no pillow decoy in your bed, you're busted.
- **Get down:** drop into the bushes. Landing on the grass is loud and brings Mom sooner.
- **The ride:** the sidewalk is smooth and safe from cars, but you're not allowed to ride
  on it. Nosy neighbors who see you get suspicious, and bumping into people walking makes it
  worse. If the suspicion bar fills up, someone calls your mom. The street has cars instead.
  Ring your bell (F) so people step aside.
- **Win:** reach Maya, Theo and Jay at the picnic table before 8:15.

Controls: WASD move/ride, mouse look, E use, Shift run/pedal hard, Space jump/bunny hop,
F bell, H pause. Phones and tablets get on-screen controls.

## Symbiote Swarm (`symbiote-swarm/index.html`)

A third-person 3D game where a swarm of microbots has bonded to your body, like a symbiote.
The bots armor you, move you, and can turn into anything.

**How to play:** double-click `symbiote-swarm/index.html` to open it in Chrome, Edge, Firefox or Safari.
(It needs an internet connection the first time to load the Three.js 3D library.)

### What the swarm can do
- **Strike (left click):** your arm shoots out a 20 m tendril fist made of bots.
- **Grapple (right click):** a tendril latches onto a wall or roof and yanks you there.
- **Bot-spring (Space twice):** bots shoot out under your feet for a double jump.
- **Blast (F):** half your bots explode outward and knock nearby drones down.
- **Buggy (E):** 600 bots flow off your body and form a car around you. Drive with W/A/S/D, Shift to boost, Space to hop.
- **Build (B):** shape bots into cubes, walls, ramps, decks, pillars and launch pads (keys 1–6, R rotates, right click takes a piece apart and the bots come back).
- **Shed (G):** take the swarm off to see what you really look like. The bots slide off into a blob that follows you around and watches you, and the camera swings around to show your face. Press G again and they crawl back onto you. While unbonded you have no powers and no armor, so drone shots hurt.
- **Surge (V):** when the hunger bar fills, let the swarm take control. You get bigger and spiky, and the bots steer you toward drones and attack on their own. Wait too long and they take over anyway.

### Rules
- Every bot is counted. Bots used for the buggy or for buildings are not on your body.
- Drone shots knock bots off you. They land on the ground and crawl back to you.
- If too few bots are left on your body, shots hurt you instead.
- Smash drones and grab glowing canisters to grow your swarm (up to 3,000 bots).

Phones and tablets get on-screen touch controls.
