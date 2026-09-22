# Flowstate — Traffic, reimagined

A completely redesigned React website for the Traffic Game Theory Simulator. Explore Nash equilibrium, Braess’s paradox, cooperative routing, and Q-learning.

## Run

Install Node.js 20.19+ or 22.12+, then run from this folder:

```sh
npm install
npm run dev
```

Open the address printed by Vite (normally http://localhost:5173).

```sh
npm test
npm run build
npm run preview
```

The website runs entirely in the browser. No Python server, Streamlit installation, API key, or backend is needed. Deploy the generated `dist/` folder to a static host. Fonts load from Google Fonts with local sans-serif fallbacks. A pnpm lockfile is included; `pnpm install --frozen-lockfile` is also supported.

## The 3D game

The original playground is replaced by **Beat the Traffic**, a Three.js miniature-city game.

1. **Nash Equilibrium:** choose a route from an initially uneven allocation, then let the other drivers adapt.
2. **Braess’s Paradox:** predict the shortcut’s effect and watch the 50-driver network change from about 70 to 90 minutes.
3. **System Optimal:** assign all 50 drivers yourself. Reach within 0.1 minutes of the optimum to earn three stars and complete the game. Adjustments preserve the total number of drivers.

Features include a gold player car, animated traffic, camera orbit/zoom buttons and gestures, pause/speed controls, replay, a locally saved personal-best score, and keyboard-accessible game decisions. Animation starts paused when reduced motion is preferred. Journey times are simulated minutes; the visual journey is accelerated. The game has no driving physics or sound. A browser with WebGL2/hardware acceleration is needed for the city; an explanatory fallback preserves the playable decision controls when 3D cannot initialise.

The **Research lab** retains the demand comparison charts, CSV export, all four scenarios, and Q-learning training. Its traffic-volume and Braess-edge controls are independent of the fixed 50-driver game.

## Structure

- `src/main.jsx`: three-round game, scoring, and progression.
- `src/City.jsx`: Three.js scene, car animation, camera controls, and graphics cleanup.
- `src/game.js`: evaluation of player route allocations and star thresholds.
- `src/game.css`: responsive game layout.
- `src/Research.jsx`: comparison charts and learning lab, loaded on demand.
- `src/styles.css`: research styles and shared typography.
- `src/engine.js`: original model port and Q-learning.
- `tests/*.test.js`: simulation and player-allocation regression tests.
- The legacy Streamlit application and Python plotting files have been removed; all runtime logic lives in the React project.

## Model

The browser engine ports the original BPR costs and 2,000 successive-average iterations. Cooperative routing uses marginal costs. AB and CD have approximately linear travel times equal to road flow; AC and BD take 45 minutes; BC costs 0.001 minutes.

At 50 drivers, the base network averages approximately 70 minutes. The shortcut increases this to approximately 90 minutes under selfish routing. Cooperation restores approximately 70 minutes. At low demand, the shortcut helps. Without the shortcut, this symmetric network has equal selfish and cooperative outcomes.

The Q-learning teaching model boosts AB or AC capacity by 20% and recomputes routing with 500 iterations. AC has constant travel time, so boosting its capacity has no effect. Training is stochastic; unvisited states remain zero and rewards need not improve monotonically. The 3D cars illustrate route flow, not physical car-following dynamics. The planner uses integer driver assignments; equilibrium computations may produce fractional flows.

