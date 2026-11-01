# Ghuddi — A Rooftop Kite-Flying Adventure

A responsive kite-flying mini-game inspired by Dhaka rooftops and Shakrain.
Steer your colorful ghuddi through a festival sky, dodge crows and rival kites,
and see how long you can keep flying.

## Play

1. Select **Start flying**.
2. Hold **↑ / ↓** or **W / S** to move your kite up and down. Release a key to
   stop moving.
3. On touchscreens, press and hold the on-screen direction buttons.
4. Avoid crows and rival kites. A collision ends the flight; choose **Fly
   again** to start a new run.

Flight time and wind points are shown above the game. Wind points increase
while you are in the air. Your best score is saved in local browser storage on
the current device and browser. **Pause flight** or press **Space** to pause
and resume.

## Requirements

- Node.js and npm
- Dependencies installed from `package-lock.json`

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) or
[http://127.0.0.1:3000](http://127.0.0.1:3000).

Next.js restricts cross-origin development asset requests by default. The
`allowedDevOrigins` setting in `next.config.ts` permits the loopback hostname
`127.0.0.1` as well as the default `localhost` host. If you change this
configuration, restart the development server. For access through a LAN
address or another hostname, add that specific hostname to `allowedDevOrigins`;
do not use a permissive wildcard for public or untrusted hosts.

## Project commands

```bash
npm run dev    # Start the development server
npm run lint   # Run ESLint
npm run build  # Create a production build
npm run start  # Serve the production build (run build first)
```

## Tech

Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, and the Canvas
API. The game scene and obstacles are drawn locally; no external image assets
or additional packages are required.
