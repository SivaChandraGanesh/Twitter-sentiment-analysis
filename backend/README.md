# Data Driven Emotion — Backend API (Real-Time)

This is the production-ready modular backend for the **Data Driven Emotion** analytics dashboard. It features real-time data ingestion, async NLP processing, and WebSocket streaming.

## 🏗️ Tech Stack
- **FastAPI**: Main web framework with async support.
- **SQLModel / SQLite**: Database abstraction and persistent storage.
- **NLP Pipeline**: Lemmatization, VADER Sentiment, and TextBlob for emotion/sentiment analysis.
- **WebSockets**: Bi-directional streaming for live UI updates.
- **SlowAPI**: Rate limiting for endpoint protection.

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.9+
- pip (Python package manager)

### 2. Installation
Navigate to this directory and install the required dependencies:
```bash
pip install -r requirements.txt
```

### 3. Run the Server
Start the FastAPI server using the Python module runner (use `main:app`, NOT `main.py:app`):
```bash
python -m uvicorn main:app --reload --port 8000
```
- The API will be available at: `http://127.0.0.1:8000`
- Interactive API Docs: `http://127.0.0.1:8000/docs`

## 🔌 API Summary

### Real-Time Stream (WebSockets & Control)
- **WS** `/api/ws/live`: Subscribe here for live analysis pushes.
- **POST** `/api/stream/start`: Start the live analysis background task.
- **POST** `/api/stream/stop`: Stop the live analysis loop.
- **GET** `/api/stream/status`: Check current stream activity and session stats.

### Core Analytics
- **POST** `/api/upload`: Upload CSV/XLSX datasets for batch analysis.
- **POST** `/api/preprocess`: Run the NLP cleaning pipeline.
- **GET** `/api/visualizations/data`: Fetch aggregated data for charts.
- **GET** `/api/reports/download?format=pdf`: Generate and download a PDF report.

## 📁 Directory Structure
- `routes/`: API endpoint definitions (Upload, Sentiment, Stream, etc.)
- `services/`: Core business logic and background loops.
- `models/`: Database schemas and Pydantic models.
- `utils/`: NLP cleaning and helper utilities.
- `database/`: DB connection and session management.

## 🤝 How to Explain (Interview Tips)
*"The backend is built on a 3-layer modular architecture (API -> Service -> DB). It uses a background task to simulate or ingest live data streams, processes them through a custom NLP pipeline, and broadcasts the results instantly via WebSockets to ensure the frontend remains zero-refresh and fully real-time."*
