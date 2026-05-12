# FLN Tool

NIPUN Bharat–aligned lesson generator for India's Foundational Literacy & Numeracy (FLN) goals. Pick a grade and subject, choose a Learning Outcome from the official NIPUN curriculum (or type your own), and the tool produces a complete lesson — title, illustrated 3-slide picture story with audio narration, and a multiple-choice quiz — using Google Gemini.

- **Grades:** Balvatika · Class 1 · Class 2 · Class 3
- **Subjects:** English · हिन्दी · Mathematics
- **Curriculum:** ~138 Learning Outcomes pulled directly from the NIPUN Bharat Annexure I (codes ECL1 / IL / ILM preserved for trackability)
- **Output formats:** live preview in the browser · single-file `*_Lesson.html` · offline `*_Offline.zip` with separate `audio/` and `images/` folders

## Features

- **Searchable NIPUN topic picker** — filter by code (`ILM 4.14`), keyword (`addition`, `rhyme`, `half`), sub-skill, or outcome text. Manual topic entry is supported as a fallback for content outside NIPUN.
- **AI-generated lessons** — Gemini composes a child-friendly story, illustrations, and quiz aligned to the selected Learning Outcome. Image model: `gemini-3-pro-image-preview` with `gemini-2.5-flash-image` as fallback.
- **Voice-first** — title and slide audio narration in an Indian English / Hindi voice via Gemini TTS.
- **Animated mascot** — friendly learning buddy on the intro screen; tap to replay the title narration.
- **Inline editing** — title, subtitle, slide text, quiz question and options are all editable in the preview; edits are carried into the HTML/ZIP exports.
- **Progress strip** — pill-shaped step indicator across story slides and quiz questions.
- **NIPUN Lakshyas panel** — grade-level targets sit next to the picker so the teacher always sees what mastery looks like.

## Tech stack

- React 19 + TypeScript + Vite + Tailwind v4
- `@google/genai` SDK for Gemini
- `jszip` + `file-saver` for the offline-ZIP export
- `motion` (Framer Motion) for animations

## Run locally

**Prerequisites:** Node.js 18+ and a Gemini API key (free at https://aistudio.google.com/apikey).

```bash
git clone https://github.com/aamir-droid/fln-tool.git
cd fln-tool
npm install
cp .env.example .env.local
# open .env.local and paste your key:  GEMINI_API_KEY=AIza...
npm run dev
```

The dev server starts on http://localhost:3000 (or the next free port).

## Standalone picker demo

`demo/nipun-picker-demo.html` is a single self-contained HTML file showing the NIPUN topic picker on its own — no build, no install, no API key needed. Double-click it to open in any browser.

## NIPUN Bharat alignment

All Learning Outcomes are sourced from the *NIPUN Bharat Aligned Curriculum Framework — Balvatika to Class 3* document (Ministry of Education, 2021). The codes preserved:

| Code | Meaning |
|---|---|
| `ECL1 3.x` | Balvatika — First Language Literacy |
| `IL 3.x`   | Balvatika — Numeracy / Involved Learners |
| `ECL1 4.x` `ECL1 5.x` `ECL1 6.x` | Class 1–3 First Language Literacy |
| `ILM 4.x` `ILM 5.x` `ILM 6.x`    | Class 1–3 Mathematics |

The first digit after the prefix is the stage (`3` = Balvatika, `4` = Class 1, `5` = Class 2, `6` = Class 3); the second is the LO number.

## Project layout

```
src/
├── App.tsx                  Main UI, picker, lesson preview, HTML + ZIP exports
├── main.tsx
├── index.css
└── lib/
    ├── gemini.ts            Gemini SDK wrappers — lesson, narration, image
    └── nipun_curriculum.ts  ~138 NIPUN LOs as typed data + search helpers
public/
└── mascot.png               Intro-screen mascot
demo/
└── nipun-picker-demo.html   Self-contained picker demo
```

## License

MIT — see [LICENSE](./LICENSE).

## Acknowledgements

- **NIPUN Bharat** — Ministry of Education, Government of India — for the FLN goals and Learning Outcomes framework.
- **NCF-FS 2022 / NEP 2020** — pedagogy principles informing the lesson prompts.
- **Google Gemini** — generative model behind the lessons, narration, and illustrations.
