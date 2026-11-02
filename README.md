<div align="center">
  <img src="docs/banner.svg" alt="MaxWell — the next safest care step, in minutes" width="100%" />
  <br />
  <br />
  <p><strong>Triage-first care navigation for rural and low-resource settings.</strong><br />
  Clear urgency, nearby care, and a doctor-ready handoff — in one flow.</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/React-19-087EA4?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
    <img src="https://img.shields.io/badge/Clerk-6-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" alt="Clerk" />
    <img src="https://img.shields.io/badge/PostgreSQL-Vercel-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="Vercel Postgres" />
    <img src="https://img.shields.io/badge/OpenAI-compatible-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI-compatible LLM" />
    <img src="https://img.shields.io/badge/Vercel-deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Deployed on Vercel" />
  </p>

  <p>
    <img src="https://img.shields.io/badge/build-passing-6EE7B7?style=flat-square&logo=github&logoColor=white" alt="Build passing" />
    <img src="https://img.shields.io/badge/lint-biome-60A5FA?style=flat-square&logo=biome&logoColor=white" alt="Lint with Biome" />
    <img src="https://img.shields.io/badge/status-demo--ready-58DDC8?style=flat-square" alt="Demo ready" />
    <img src="https://img.shields.io/badge/triage--first-not%20diagnosis--first-FFB8CE?style=flat-square" alt="Triage first" />
    <img src="https://img.shields.io/badge/emergency-call%20112-F87171?style=flat-square" alt="Call 112 in an emergency" />
  </p>

  <p>
    <a href="https://github.com/Abhinav-Prabhakar/MaxWell/stargazers"><img src="https://img.shields.io/github/stars/Abhinav-Prabhakar/MaxWell?style=flat-square&color=58DDC8" alt="GitHub stars" /></a>
    <a href="https://github.com/Abhinav-Prabhakar/MaxWell/commits/main"><img src="https://img.shields.io/github/last-commit/Abhinav-Prabhakar/MaxWell?style=flat-square&color=6DCFFB" alt="Last commit" /></a>
    <a href="https://github.com/Abhinav-Prabhakar/MaxWell"><img src="https://img.shields.io/github/repo-size/Abhinav-Prabhakar/MaxWell?style=flat-square&color=FFB8CE" alt="Repository size" /></a>
  </p>
</div>

---

## Product tour

<img src="docs/screenshots/landing.webp" alt="MaxWell landing page" width="100%" />

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/screenshots/intake.webp" alt="Structured symptom intake" width="100%" />
      <sub><strong>Structured intake</strong> — symptoms, red flags, history, vitals</sub>
    </td>
    <td width="50%" valign="top">
      <img src="docs/screenshots/hospitals.webp" alt="Nearby hospitals map and facility list" width="100%" />
      <sub><strong>Nearby care</strong> — map, distance, contact, and directions</sub>
    </td>
  </tr>
</table>

<img src="docs/screenshots/triage.webp" alt="Triage result" width="100%" />
<sub><strong>Triage result</strong> — urgency, immediate actions, escalation</sub>

## The flow

<img src="docs/flow.svg" alt="MaxWell flow: intake, triage, act" width="100%" />

## Triage levels

| | Level | Response |
|:--:|:--|:--|
| 🔴 | **Emergency now** | Call local emergency services immediately |
| 🟠 | **Doctor within 24 hours** | Arrange same-day or next-day clinical review |
| 🟡 | **Home care + monitor** | Watch closely and seek care if symptoms worsen |
| 🟢 | **Low risk, observe** | Self-care and routine follow-up are appropriate |

## Capabilities

| | Capability | In practice |
|:--:|:--|:--|
| 🧾 | **Structured intake** | Age, symptoms, red flags, conditions, medications, allergies, optional vitals |
| 💬 | **Triage-aware chat** | Persistent urgency and intake context, plus image and PDF attachments |
| 🏥 | **Hospital discovery** | Nominatim + Overpass search, Leaflet map, contact and directions |
| 📄 | **Referral notes** | One-page clinician handoff generated from the intake and chat record, exported as PDF |
| 🧠 | **Editable memory** | Review and correct the facts MaxWell carries into the next conversation |

## Architecture

<img src="docs/architecture.svg" alt="MaxWell architecture" width="100%" />

> Next.js App Router → route handlers → services with Zod contracts → OpenAI-compatible LLM, Vercel Postgres, OpenStreetMap, and Clerk.

## Quick start

```bash
git clone https://github.com/Abhinav-Prabhakar/MaxWell.git
cd MaxWell
npm install

# optional: pull development env vars from the linked Vercel project
vercel env pull .env.local

npm run dev
```

Open **http://localhost:3000**, then use **Load demo patient** on the intake page to explore a complete case without entering data.

### Environment

| Variable | Purpose |
|:--|:--|
| `OPENAI_BASE_URL` | API root for the OpenAI-compatible provider |
| `OPENAI_API_KEY` | LLM access key |
| `OPENAI_MODEL` | Model id used for triage, chat, and referrals |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client key |
| `CLERK_SECRET_KEY` | Clerk server key |
| `POSTGRES_URL` | Vercel Postgres connection string |

Run the schema once before the first demo:

```bash
psql "$POSTGRES_URL" -f db/migrations/0001_init.sql
```

### Scripts

| Command | What it does |
|:--|:--|
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run Biome checks |

## Safety

> [!WARNING]
> MaxWell is **not a doctor** and not a medical device. It provides informational, escalation-first triage guidance only. In an emergency, call local emergency services immediately.

<div align="center">
  <sub><strong>No diagnosis · Escalation first · Memory you can edit</strong></sub>
</div>
