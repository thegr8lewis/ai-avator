# AI Avatar Widget

A modular, browser-based 3D avatar with speech, weather, chat (Gemini), and viseme-based lip sync. Built with Three.js. No bundler required.

## Features
- Modular code: avatar, voice, weather, chat (Gemini), lipsync
- 3D GLB avatar loading and idle animations (breathe, blink, gaze)
- Text-to-Speech via ElevenLabs API with cloned voice support
- Weather summary (WeatherAPI with Open‑Meteo fallback)
- Gemini chat responses (per-brand personas) and weather-triggered recommendations
- Viseme-based mouth shapes during speech (A, E, I, O, U, MBP) with jaw fallback
- Optional gesture animation GLB
- Brand UIs:
  - Circle K: in-tab redesigned recommendations + optional overlay
  - OBI: multibrand overlay with OBI product set
  - KiK: multibrand overlay with KiK product set

## Project Structure
- `avatar-widget/index.html` – App HTML, loads runtime env and modules
- `avatar-widget/main.js` – App bootstrap, scene, renderer, animation loop
- `avatar-widget/avatar.js` – Avatar loading, bones, morph targets, gestures, per-frame updates
- `avatar-widget/voice.js` – ElevenLabs TTS integration with cloned voice (ID: 4D2aKdYVV51kyAH4OGCY)
- `avatar-widget/weather.js` – Weather fetch (WeatherAPI -> Open‑Meteo fallback), speech, caching
- `avatar-widget/chat.js` – Chat UI logic, integrates with Gemini service
- `avatar-widget/gemini-*.js` – Brand-specific Gemini integration (Circle K, OBI, KiK)
- `avatar-widget/recommendations-redesign.js` – Circle K in-tab recommendations UI
- `avatar-widget/recommendations-multibrand.js` – Overlay recommendations for OBI, KiK, Circle K
- `avatar-widget/products-database.js` – Circle K recommendations data
- `avatar-widget/lipsync.js` – Text-to-viseme timeline builder
- `avatar-widget/env.js` – Runtime API keys injected to `window.ENV` (UNTRACKED)
- `avatar-widget/karstenSchwanke.glb` – Avatar model (Karsten Schwanke)
- Brand pages:
  - `circle-k-enhanced.html` – Circle K chat + avatar + recommendations
  - `obi-offers.html`, `obi-clone.html` – OBI chat + overlay
  - `kik-clone.html` – KiK chat + overlay

### Project layout (avatar-widget/)
```
avatar-widget/
├─ index.html
├─ index-hybrid.html
├─ circle-k.html
├─ circle-k-enhanced.html
├─ obi-offers.html
├─ obi-clone.html
├─ kik-clone.html
├─ main.js
├─ chat.js
├─ avatar.js
├─ voice.js
├─ voice-input.js
├─ weather.js
├─ language.js
├─ lipsync.js
├─ recommendations.js
├─ recommendations-enhanced.js
├─ recommendations-redesign.js
├─ recommendations-multibrand.js
├─ products-database.js
├─ gemini.js
├─ gemini-circlek.js
├─ gemini-obi.js
├─ gemini-kik.js
├─ env.js (local, untracked)
├─ env.example.js
├─ generate-env.js
├─ obi-env.js
├─ kik-env.js
├─ 690cb9a0de516bcc96ba28c9.glb
├─ Business_Professional_1112121706_texture.glb
├─ eric_rigged_001_-_rigged_3d_business_man.glb
├─ rigged_t-pose_human_male_w_50_face_blendshapes.glb
├─ karstenSchwanke.glb
├─ KiK_Logo.svg
├─ image.png
└─ assets (add your own images/GLBs as needed)
```

## Prerequisites
- A local HTTP server (avoid `file://`):
  - VS Code Live Server, or
  - Python 3: `python -m http.server 5173`, or
  - Node: `npx serve -l 5173`
- Browser with Web Speech API (Chrome recommended)

## Setup
1) Ensure `.gitignore` is in place (secrets are not committed)
2) Backend proxy (preferred; keeps keys server-side)
   - Put `.env` in repo root (not committed):
   ```
   GEMINI_API_KEY=...
   WEATHER_API_KEY=...
   ELEVENLABS_API_KEY=...
   ELEVENLABS_VOICE_ID=...
   PORT=3001
   ```
   - Start locally: `node proxy-server.js`
   - Frontend hits `/api/gemini`, `/api/weather`, `/api/tts` via `PROXY_BASE` (defaults to same-origin; set `window.PROXY_BASE = 'http://localhost:3001'` if static is on another port)
3) Client-side keys (not recommended): `avatar-widget/env.js` with your keys (UNTRACKED). Only use if you accept exposing keys.

## Run (local)
- Start proxy: `node proxy-server.js` (loads `.env` from root and `avatar-widget/.env`)
- Serve static: `npx serve -l 5173 .`
- If proxy is a different origin/port, set `window.PROXY_BASE = 'http://localhost:3001'` before modules.
- Open:
  - Circle K: `http://localhost:5173/avatar-widget/circle-k-enhanced.html`
  - OBI: `http://localhost:5173/avatar-widget/obi-offers.html`
  - KiK: `http://localhost:5173/avatar-widget/kik-clone.html`

## Usage
- Open a brand page and open the chat (floating button).
- Weather question examples: “What is the weather in Berlin?”
- Follow-up: “What do you recommend?”
- Circle K: gets in-tab redesigned recommendations; overlay also available.
- OBI & KiK: overlay pops with weather-tagged products.
- Console helpers (dev):
  - `say("Hello!")` – speak arbitrary text
  - `sayWeather()` – fetch and speak the weather
  - `setAvatarScale(1.2)` – scale avatar

## Viseme Lip Sync ("True-ish" version)
- `lipsync.js` builds a viseme timeline from the speech text
- `main.js` generates the timeline on speech start and advances it per-frame
- `avatar.js` detects common viseme morph targets (A, E, I, O, U, MBP) and applies the current viseme
- Falls back to jaw open morph if visemes are not present on the model
- Notes:
  - This is text-driven, not audio phoneme recognition
  - Timing is heuristic; can be refined using `onboundary` events

## Optional Gesture Animation
- Provide a gesture GLB and pass `gestureUrl` to `initAvatar` in `main.js`:
```js
avatarController = initAvatar({
  scene, camera, url: AVATAR_URL, lipSync,
  enableProceduralGestures: true,
  gestureUrl: "./gestures.glb"
});
```
- Place `gestures.glb` in `avatar-widget/`

## Environment and Security
- Do not commit secrets
- `.gitignore` includes `.env`, `.env.*`, `avatar-widget/.env`, `avatar-widget/env.js`
- Preferred: proxy/serverless; frontends call `/api/gemini`, `/api/weather`, `/api/tts` via `PROXY_BASE`.
- Static-only dev with `env.js` exposes keys—avoid for prod.

## Brand Behavior & Chat/Avatar Gating
- Language defaults to German; toggle button switches to English.
- Welcome message is spoken once per session on first chat open.
- Circle K: Chat/avatar only when on the “Angebote – passend zum Wetter” tab AND after clicking “Avatar anzeigen”.
- OBI: Chat opens on user click (floating button or avatar toggle) and then speaks the welcome.
- KiK: Chat opens on user click; no auto-open (avoids browser autoplay blocks).

## Proxy Endpoints (server-side)
- `POST /api/gemini` – Gemini content (uses server GEMINI_API_KEY)
- `GET /api/weather` – WeatherAPI forecast (uses server WEATHER_API_KEY)
- `POST /api/tts` – ElevenLabs TTS (uses server ELEVENLABS_API_KEY/VOICE_ID)

## Deploying to Vercel (clean, serverless)
1) Add a Vercel project and point it to this repo.
2) Set Environment Variables in Vercel dashboard:
   - `GEMINI_API_KEY`, `WEATHER_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` (and optional `PORT`)
3) Deploy `proxy-server.js` as a serverless function:
   - Simplest: wrap it as an API route (e.g., `api/proxy.js`) or adapt to Vercel’s `export default` handler that routes `/api/gemini` and `/api/weather`.
   - Ensure CORS if serving static site from a different domain; otherwise rely on same-origin and skip setting `PROXY_BASE`.
4) Host static files from `avatar-widget/` (Vercel static or any CDN). If proxy is same domain, no extra config. If different domain, set `window.PROXY_BASE` to the proxy origin before loading modules.
5) Test production URLs:
   - `https://your-domain/avatar-widget/circle-k-enhanced.html`
   - `https://your-domain/avatar-widget/obi-offers.html`
   - `https://your-domain/avatar-widget/kik-clone.html`

## Logging and Debugging
- API key status prints on load (Gemini/Weather)
- Speech synthesis logs start/boundary/end
- LipSync logs start/peak/stop; viseme timeline count
- Weather falls back to Open‑Meteo when WeatherAPI key missing or failing

## Troubleshooting
- 404 `env.js`: Create `avatar-widget/env.js` and ensure it's loaded before modules
- ElevenLabs errors: Ensure `ELEVENLABS_API_KEY` is set correctly in `env.js`. Check console for API errors.
- No voice/audio: Verify your ElevenLabs API key is valid and has credits. Check browser console for errors.
- Gemini 403: Key missing/invalid, set `GEMINI_API_KEY` in `env.js`
- Weather CORS/errors: Set `WEATHER_API_KEY` or rely on Open‑Meteo fallback
- Mouth not moving: Ensure speech hooks fire and check console logs. Verify your model has visemes; otherwise jaw fallback is used.
- CORS errors with ElevenLabs: Ensure you're running on a proper HTTP server (not file://)

## Customization Tips
- Replace the GLB file with your own model (ensure compatible morph targets)
- Tweak idle motions in `avatar.js` (breathing, nod, gaze, blink timings)
- Adjust viseme mapping rules in `avatar.js` if your morph target names differ
- Voice settings (stability, similarity_boost) can be adjusted in `voice.js`
- To change the voice, update the `VOICE_ID` constant in `voice.js` with a different ElevenLabs voice ID

