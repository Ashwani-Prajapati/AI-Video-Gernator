# 🎬 VividFlow AI Studio — Autonomous Multi-Scene Cinematic Video Generator

> Inspired by the vision of Google Flow, **VividFlow Studio** is a complete, production-grade AI filmmaking platform that autonomously plans, directs, generates, and renders cohesive **45–60 second cinematic films** from natural-language text prompts, character references, and keyframe images.

---

## 🌟 Key Highlights & Architectural Features

- **Autonomous 45–60s Multi-Scene Storyboarding**: Automatically decomposes concepts into 6–8 model-compatible scene clips (e.g. 7.5s each), establishing three-act cinematic structure (Exposition, Rising Tension, Climax, Resolution).
- **Character & Visual Continuity Engine**: Maintains persistent character appearances, wardrobe, facial hallmarks, lighting, and camera styles across every individual scene.
- **Provider-Independent Model Adapter Layer**:
  - **Pollinations AI Video** (100% Free & Unlimited, zero API keys required)
  - **Google Veo 2 / Gemini Video API** (Google DeepMind)
  - **OpenAI Sora Turbo & GPT-4o Scriptwriter**
  - **Runway ML Gen-3 Alpha**
  - **Luma Dream Machine Ray 2**
  - **Replicate (Wan 2.1 14B & CogVideoX)**
  - **Self-Hosted Local ComfyUI** (NVIDIA RTX 3080/4090 AnimateDiff/Wan2.1)
  - **VividFlow Built-in Procedural Engine** (FFmpeg high-definition synthesis for instant offline testing)
- **Zero Artificial Application Credit Limit**: No fictional credits or paywalls in the core app. Honest display of third-party API rates and self-hosted GPU modes.
- **Full NLE Timeline & Video Editor**: In-browser video player, multi-track timeline (Video Scenes, Transitions, Voiceover, Subtitles), scene reordering, trimming, and single-scene regeneration.
- **FFmpeg Server Rendering Pipeline**: Concatenates clips, normalizes framerates and resolutions (1080p, 720p, 4k), applies crossfade transitions, mixes narration and background music, and burns subtitles into final MP4 exports.
- **Persistent Database & Job Queue**: Relational schema (PostgreSQL / Supabase + embedded persistent store), with background workers, retries, and job recovery on server restart.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v20 or higher (v24 recommended)
- **NPM**: v10 or higher
- **FFmpeg**: Bundled automatically via `@ffmpeg-installer/ffmpeg` (zero manual installation required on Windows/macOS/Linux!)

### 1. Installation
Clone or navigate to the project directory:
```bash
# Install root orchestration dependencies
npm install

# Install client packages
cd client && npm install && cd ..

# Install server packages
cd server && npm install && cd ..
```

### 2. Run Local Development Server
Start both backend API (`http://localhost:5000`) and frontend Vite Studio (`http://localhost:3000`) concurrently:
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 📁 Repository Structure

```
├── client/                     # Vite + React 19 + TypeScript + Tailwind CSS Frontend
│   ├── src/
│   │   ├── api/client.ts       # Typed API client
│   │   ├── components/         # Navbar, Sidebar, JobProgressModal
│   │   ├── pages/              # 8 Complete Studio Pages:
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── TextToVideoPage.tsx
│   │   │   ├── ImageToVideoPage.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   ├── VideoEditorPage.tsx
│   │   │   ├── AssetsPage.tsx
│   │   │   ├── ModelSettingsPage.tsx
│   │   │   └── AccountSettingsPage.tsx
│   │   ├── types.ts            # TypeScript interfaces
│   │   └── index.css           # Cinematic dark theme styling
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── db/                 # Database persistence & PostgreSQL schema.sql
│   │   ├── routes/             # API routes (projects, scenes, generate, jobs, render, models, settings, assets)
│   │   ├── services/
│   │   │   ├── ai/             # Provider-independent AI model adapter layer
│   │   │   │   ├── adapters/   # Google Veo, Runway, Luma, Replicate, ComfyUI, Procedural
│   │   │   │   └── registry.ts # Central Model Registry
│   │   │   ├── llm/            # Storyboard Generator & Continuity Manager
│   │   │   ├── video/          # FFmpegService (assembly, transitions, procedural engine)
│   │   │   └── jobs/           # Persistent background Job Queue & worker
│   │   └── index.ts            # Express server entry point
│   ├── test/                   # Automated backend & FFmpeg integration tests
│   └── public/                 # Static storage for /outputs (MP4) and /uploads
├── .env.example                # Environment variable configuration template
└── package.json                # Unified workspace scripts
```

---

## ⚙️ AI Video Provider Configuration

VividFlow features a **Model Hub** tab (`/models`) where administrators can configure API keys and choose operating modes without touching source code.

| Provider | Model | Input Types | Pricing / Limits |
| :--- | :--- | :--- | :--- |
| **Pollinations AI** | `pollinations-video` | Text, Image, Continuity | **$0.00 Free** (No API Key Required) |
| **Google Video AI** | `veo-2` | Text, Image, Continuity | Vertex AI Cloud Quota ($0.08–$0.20/clip) |
| **OpenAI** | `sora-turbo` | Text, Image | OpenAI API Token / Compute Rate |
| **Runway ML** | `runway-gen3` | Text, Image | Runway API (5–10 credits/sec) |
| **Luma AI** | `luma-ray` | Text, Keyframes | Luma Dream Machine API |
| **Replicate** | `wan-2.1` | Text, Image | ~$0.05 per clip GPU compute |
| **ComfyUI Local** | `comfyui-local` | Text, Keyframes | **$0.00 Free** (Uses your RTX 3080/4090 GPU) |
| **VividFlow Built-in**| `procedural-cinematic`| Text, Camera, Audio | **$0.00 Free** (Runs immediately with local FFmpeg) |

---

## 🧪 Automated Testing

To run the automated verification test suite:
```bash
npm run test
```
This tests:
1. Database persistence and seed project integrity
2. 60-second multi-scene storyboard planner (verifying 8 scenes totaling 60s)
3. Model adapter registry and capability matrix
4. Real FFmpeg video synthesis and actual MP4 duration measurement.

---

## 🚢 Production Deployment

### Docker or Containerized Host
1. Set environment variables from `.env.example`.
2. Build client bundle:
   ```bash
   cd client && npm run build
   ```
3. Run backend server:
   ```bash
   cd server && npm start
   ```
4. For PostgreSQL / Supabase, run the migration script located in `server/src/db/schema.sql`.
