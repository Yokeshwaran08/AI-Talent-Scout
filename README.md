# ⚡ AI Talent Scout

> AI-powered recruiter agent — finds, engages, and ranks candidates from a Job Description.

Built for the **Deccan AI Catalyst Hackathon 🚀**

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm
- An OpenAI API key (`sk-...`)

### 1. Install dependencies
```bash
cd ai-talent-scout
npm install

# Install proxy dependencies
npm install express http-proxy-middleware cors dotenv
```

### 2. Set your API key
```bash
cp .env.example .env
# Open .env and set your OpenAI key:
# OPENAI_API_KEY=sk-your-key-here
```

### 3. Run the proxy server (Terminal 1)
```bash
node proxy-server.js
# ✅  OpenAI proxy running → http://localhost:3001
```

### 4. Run the React app (Terminal 2)
```bash
npm start
# Opens at http://localhost:3000
```

---

## 📁 Project Structure

```
ai-talent-scout/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.jsx / .css         # App header with animated badge
│   │   ├── JDInput.jsx / .css        # Job description textarea + submit
│   │   ├── LoadingState.jsx / .css   # Step-by-step animated progress
│   │   ├── ResultsSection.jsx / .css # Sort/filter bar + candidate list
│   │   ├── CandidateCard.jsx / .css  # Individual candidate card
│   │   ├── EmptyState.jsx / .css     # Before first search
│   │   ├── ErrorBanner.jsx / .css    # Error display
│   │   └── Footer.jsx / .css
│   ├── data/
│   │   └── candidates.js             # 70 diverse mock candidates
│   ├── utils/
│   │   ├── api.js                    # OpenAI API calls (JD parse + outreach sim)
│   │   └── scoring.js                # Pure JS scoring (match, interest, rank)
│   ├── App.jsx                       # Main pipeline orchestrator
│   └── App.css                       # Global styles + CSS variables
├── proxy-server.js                   # CORS proxy → OpenAI API
├── .env.example                      # Environment variable template
└── package.json
```

---

## 🧠 How It Works

1. **Parse JD** — OpenAI (`gpt-4o-mini`) extracts skills, experience range, and location from the pasted job description.
2. **Score candidates** — Pure JS logic scores all 70 candidates:
   - Skill match, experience fit, location proximity
3. **Simulate outreach** — Top 15 candidates go through OpenAI-powered outreach simulation: a recruiter message + realistic candidate reply + interest score.
4. **Rank & display** — Final rank = `0.7 × Match + 0.3 × Interest`. Cards are sorted, filterable, and expandable.

---

## 🧮 Scoring Formula

| Score | Formula |
|---|---|
| Match Score | `0.6 × skill + 0.3 × experience + 0.1 × location` |
| Interest Score | AI-generated (10–95) via outreach simulation |
| Rank Score | `0.7 × Match + 0.3 × Interest` |

---

## 🎨 Tech Stack
- **React 18** (Create React App)
- **OpenAI `gpt-4o-mini`** — JD parsing + outreach simulation
- **Express.js** — Lightweight CORS proxy (no real backend needed)
- **Vanilla CSS** with CSS variables — zero UI framework dependency
