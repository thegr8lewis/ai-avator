# AI Avatar Widget

A modular, browser-based 3D avatar with speech, weather, chat (Gemini), and viseme-based lip sync. Built with Three.js. No bundler required.

## Features
- Modular code: avatar, voice, weather, chat (Gemini), lipsync
- 3D GLB avatar loading and idle animations (breathe, blink, gaze)
- Text-to-Speech via ElevenLabs API with cloned voice support
- Weather summary (WeatherAPI with Open‑Meteo fallback)
- Gemini chat responses and clothing recommendations
- Viseme-based mouth shapes during speech (A, E, I, O, U, MBP) with jaw fallback
- Optional gesture animation GLB

## Project Structure
- `avatar-widget/index.html` – App HTML, loads runtime env and modules
- `avatar-widget/main.js` – App bootstrap, scene, renderer, animation loop
- `avatar-widget/avatar.js` – Avatar loading, bones, morph targets, gestures, per-frame updates
- `avatar-widget/voice.js` – ElevenLabs TTS integration with cloned voice (ID: 4D2aKdYVV51kyAH4OGCY)
- `avatar-widget/weather.js` – Weather fetch (WeatherAPI -> Open‑Meteo fallback), speech, caching
- `avatar-widget/chat.js` – Chat UI logic, integrates with Gemini service
- `avatar-widget/gemini.js` – Gemini API integration, robust model discovery & retries
- `avatar-widget/lipsync.js` – Text-to-viseme timeline builder
- `avatar-widget/env.js` – Runtime API keys injected to `window.ENV` (UNTRACKED)
- `avatar-widget/karstenSchwanke.glb` – Avatar model (Karsten Schwanke)

## Prerequisites
- A local HTTP server (avoid `file://`):
  - VS Code Live Server, or
  - Python 3: `python -m http.server 5173`, or
  - Node: `npx serve -l 5173`
- Browser with Web Speech API (Chrome recommended)

## Setup
1) Ensure `.gitignore` is in place (secrets are not committed)
2) Create `avatar-widget/env.js` with your keys (UNTRACKED):
```javascript
// ElevenLabs API Configuration (REQUIRED for voice)
window.ELEVENLABS_API_KEY = 'your_elevenlabs_api_key_here';

// Optional: Other API keys
window.GEMINI_API_KEY = 'your_gemini_api_key_here';
window.WEATHER_API_KEY = 'your_weather_api_key_here'; // optional (Open‑Meteo fallback)
```
   - Get your ElevenLabs API key from: https://elevenlabs.io/app/settings/api-keys
   - The voice ID `4D2aKdYVV51kyAH4OGCY` is already configured for your cloned voice
3) In `avatar-widget/index.html`, keep this line before module scripts:
```html
<script src="./env.js"></script>
```

## Run
- Serve the folder and open http://localhost:5173/avatar-widget/
- The app canvas is inside `#avatar-container`

## Usage
- Click the weather button (if present) or run from console:
  - `say("Hello!")` – speak arbitrary text
  - `sayWeather()` – fetch and speak the weather
- Scale avatar:
  - `setAvatarScale(1.2)`

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
- `.gitignore` includes:
  - `avatar-widget/.env`
  - `avatar-widget/env.js`
- For purely browser-based setup, use `env.js` (runtime injection)
- If you later adopt a bundler/server, move keys to `.env` and server-side calls

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

