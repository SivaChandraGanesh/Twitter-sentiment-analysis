# Twitter Sentiment Analysis on Elections – Data Driven Emotion

Full-stack web app for analyzing public emotions during elections using Twitter (tweet) data. Built with **React (TypeScript) + Tailwind CSS** on the frontend and **Python (FastAPI) + NLP** on the backend.

## Features

- **Home** – Landing page with hero, platform capabilities, and CTA
- **Data Input** – Upload CSV/XLSX with tweet data; preview table and row count
- **Preprocessing** – NLP pipeline: clean text, tokenize, remove stopwords; before/after comparison
- **Sentiment Analysis** – Classify tweets as Positive / Negative / Neutral with confidence
- **Emotion Detection** – Detect Happy, Angry, Sad, Fear, Neutral
- **Visualization Dashboard** – Pie chart, bar chart, line chart, word cloud; filter by sentiment
- **Insights & Reports** – Summary text, download PDF and CSV

## Tech Stack

| Layer   | Tech                    |
|--------|-------------------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Recharts |
| Backend  | Python 3.10+, FastAPI, pandas, NLTK, TextBlob, VADER, ReportLab |
| API      | REST (JSON)             |

## Setup

### Backend (Python)

1. Create a virtual environment and install dependencies:

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

2. (Optional) Download NLTK data once:

```bash
python -c "import nltk; nltk.download('stopwords'); nltk.download('punkt')"
```

3. Start the API server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API will be at **http://127.0.0.1:8000**. Docs: http://127.0.0.1:8000/docs

### Frontend (Next.js)

1. Install dependencies and run dev server:

```bash
cd frontend
npm install
npm run dev
```

2. Open **http://localhost:3000**

3. (Optional) To point to another API URL, set in `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Usage

1. **Upload data** – Go to **Upload Data**, drag & drop or browse for a CSV with columns such as `content` (or `text`), and optionally `tweet_id`, `timestamp`, `handle`. Use `sample_tweets.csv` in the project root to test.
2. **Preprocess** – Open **Preprocessing**, click **Run Preprocessing**, then **Run Sentiment Analysis** (or go to Sentiment page and run).
3. **Sentiment** – On **Sentiment** page, click **Run Sentiment Analysis** if not done from Preprocessing.
4. **Emotion** – On **Emotion** page, click **Run Emotion Detection**.
5. **Dashboard** – View **Visualizations** for charts and word cloud; use sentiment filter.
6. **Reports** – On **Reports**, see summary and use **Download PDF Report** / **Download CSV Data**.

## Project Structure

```
twitter-sentiment-analyis/
├── backend/
│   ├── main.py           # FastAPI app, routes
│   ├── nlp_pipeline.py   # clean_text, sentiment, emotion, etc.
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/          # Next.js App Router pages
│       │   ├── page.tsx           # Home
│       │   ├── data-input/
│       │   ├── preprocessing/
│       │   ├── sentiment/
│       │   ├── emotion/
│       │   ├── dashboard/
│       │   └── reports/
│       ├── components/   # Sidebar, Header, StatCard, SentimentBadge
│       └── lib/          # api.ts, types.ts
├── sample_tweets.csv
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/upload` | Upload CSV/XLSX |
| GET    | `/api/dataset/preview` | Get dataset preview |
| POST   | `/api/preprocess` | Run preprocessing |
| POST   | `/api/analyze/sentiment` | Run sentiment analysis |
| POST   | `/api/analyze/emotion` | Run emotion detection |
| GET    | `/api/dashboard` | Get visualization data |
| GET    | `/api/insights/summary` | Get report summary |
| GET    | `/api/export/csv` | Download CSV |
| GET    | `/api/export/pdf` | Download PDF report |
| POST   | `/api/analyze/single` | Analyze single tweet `{ "tweet": "..." }` |

## License

MIT.
