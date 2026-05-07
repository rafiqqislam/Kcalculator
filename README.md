# Nourish 🌿

Track what you eat by uploading grocery receipts. No food diary, no manual logging — just a photo.

Nourish reads your receipt, categorises every item by food group, shows where your grocery money goes, and tells you which parts of your body aren't getting the nutrients they need.

---

## How it works

1. **Upload** a photo of your grocery receipt
2. **Review** the items Claude extracted — fix anything that looks off
3. **Save** and your dashboard updates automatically

---

## Features

- **Receipt scanning** — Claude Vision reads any receipt, any store, any format
- **Smart review** — see every extracted item before saving, change categories or remove items
- **Spending breakdown** — donut chart + itemised list showing $ and % per food group
- **Health body map** — 9 body systems (Brain, Heart, Bones, Muscles, Eyes, Immune System, Energy, Gut, Skin & Hair) colour-coded by coverage
- **Nutrient gap report** — every missing nutrient explained in plain English, with the body part it affects and what to buy next shop
- **Weekly trend** — bar chart of spending across the last 8 weeks
- **Smart caching** — once an item is classified it's cached, so Claude API costs drop over time

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Python · FastAPI |
| AI | Claude Sonnet (Vision) via Anthropic API |
| Database + Storage | Supabase (Postgres + file storage) |
| Frontend | Vanilla HTML/CSS/JS |
| Charts | Chart.js |

---

## Setup

### 1. Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Storage**, create a bucket named `receipts`, and set it to **Public**
4. Copy your **Project URL** and **anon public key** from Project Settings → API

### 2. Anthropic API key

Get one at [console.anthropic.com](https://console.anthropic.com)

### 3. Environment

```bash
cp .env.example .env
```

Fill in `.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### 4. Install & run

```bash
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

Open [http://localhost:8000](http://localhost:8000)

---

## Project structure

```
├── backend/
│   ├── main.py                   # FastAPI app entry point
│   ├── config.py                 # Settings from .env
│   ├── models/schemas.py         # Pydantic data models
│   ├── services/
│   │   ├── claude_service.py     # Receipt OCR + classification prompt
│   │   ├── supabase_service.py   # Database and image storage
│   │   └── nutrition_service.py  # Body system + nutrient gap analysis
│   └── routes/
│       ├── receipts.py           # Upload, confirm, list endpoints
│       └── dashboard.py          # Summary, spending, health endpoints
├── frontend/
│   ├── index.html                # Upload page
│   ├── review.html               # Review extracted items
│   ├── dashboard.html            # Reports and health insights
│   └── static/
│       ├── css/app.css           # Design system
│       └── js/                   # upload.js · review.js · dashboard.js
├── supabase/schema.sql           # Database schema — run this first
├── requirements.txt
└── .env.example
```

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/receipts/upload` | Parse receipt image with Claude Vision |
| `POST` | `/api/receipts/confirm` | Save confirmed receipt to database |
| `GET` | `/api/receipts` | List all receipts |
| `GET` | `/api/receipts/{id}` | Get receipt with all items |
| `GET` | `/api/dashboard/summary?days=30` | Full dashboard data |

---

## Cost

Each receipt scan costs roughly **$0.02–0.05** using Claude Sonnet. At one or two shops a week that's about **$1–4/month**.

Costs drop over time as the item cache fills up — once an item has been classified once, it's stored and doesn't need to be classified again.
