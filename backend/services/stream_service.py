"""
stream_service.py — Background real-time ingestion and analysis loop.

Simulates a live social media feed by streaming one record every 2 seconds
from a built-in data pool. Each record is:
  1. Cleaned (NLP preprocessing)
  2. Sentiment classified
  3. Emotion detected
  4. Stored in SQLite
  5. Broadcast to all WebSocket clients

The stream can be started, paused, and stopped from the frontend via API.
"""
import asyncio
import json
import logging
import random
import time
from datetime import datetime
from typing import Optional

from sqlmodel import Session

from database.db import engine
from models.data_models import Record
from nlp_pipeline import clean_text, sentiment_classifier, emotion_detector
from ws_manager import manager

logger = logging.getLogger(__name__)

# -------------------------------------------------------------------
# LARGE SIMULATED DATA POOL (covers many real-world topics)
# -------------------------------------------------------------------
TWEET_POOL = [
    # Positive — general
    "This is absolutely incredible! I'm so happy with how things turned out 🎉",
    "Just got the best news ever. Life is good! 😊",
    "Feeling grateful for all the amazing people in my life. So blessed!",
    "The new iPhone update is smooth as butter. Love it!",
    "Brilliant customer support today - quick, helpful, and kind. 10/10!",
    "Absolutely stunning performance by the whole team. Proud of everyone!",
    "The sunrise this morning was magical. Nature is incredible 🌅",
    "Best coffee I've ever had. This place is outstanding ☕",
    "Just finished a great book. Highly recommend it to everyone!",
    "My new laptop is so fast. Productivity through the roof 🚀",
    "The event was perfectly organized. Had such a wonderful time!",
    "This movie was a masterpiece from start to finish 🎬",
    "Finally got a promotion! Hard work always pays off 💪",
    "The food here is unbelievable. Five stars without question!",
    "New feature update is exactly what users needed. Well done team!",
    "Incredible comeback by the team. That last-minute goal was legendary ⚽",
    "The new album is fire from track one to the last. Pure art 🎵",
    "Exceeded every expectation. This brand never lets me down.",
    "Hired a new developer today who is absolutely brilliant 👨‍💻",
    "This product literally changed my life. Cannot recommend it enough!",
    # Negative — general
    "Terrible experience at the store today. Won't be going back.",
    "I'm so frustrated with this app. It keeps crashing every hour 😤",
    "Awful service. Waited 45 minutes and no one came to help.",
    "The new update completely broke everything. This is a disaster.",
    "Deeply disappointed with the decision made by management today.",
    "Total waste of money. Product stopped working after two days.",
    "The internet is unbearably slow right now. Can't get any work done.",
    "The whole flight experience was a nightmare. Never again.",
    "Customer support took 3 days to reply and still no solution.",
    "This is unacceptable. The error message gave zero useful information.",
    "Very poor quality for the price. I expected much better.",
    "App keeps logging me out. Losing all my data is infuriating!",
    "The traffic today was absolutely horrendous. Took 2 hours to get home.",
    "So disappointed in this team. They played terribly in the final.",
    "Worst meal I've ever had. Cold, bland, and overpriced.",
    "The rollout of this feature was handled horribly.",
    "Absolutely broken. Nothing works right after the latest patch.",
    "No apology, no refund, no explanation. Shocking customer service.",
    "The event was disorganized and uncomfortable. Such a letdown.",
    "Lost all my saved data after the latest update. Furious!",
    # Neutral — informational
    "The meeting has been rescheduled to next Tuesday at 10 AM.",
    "The new policy will take effect starting next month.",
    "There are now 500 reviews on the product page.",
    "The team is currently reviewing the submitted documents.",
    "New dataset was uploaded to the server at 11:00 AM.",
    "The report covers the Q3 performance metrics.",
    "Three new candidates were shortlisted for the role.",
    "The system has been updated to version 3.4.1.",
    "The weather forecast shows rain for the remainder of the week.",
    "Users can now access the new dashboard from the sidebar.",
    "The project delivery date has been confirmed for March 15.",
    "A maintenance window is scheduled for Sunday 2–4 AM.",
    "Total usage hit 1 million requests this week.",
    "The backend API is returning a 200 status for all endpoints.",
    "Branch deployment completed at 14:32 UTC.",
    "The analytics pipeline processed 50,000 records overnight.",
    "Three pull requests are currently under code review.",
    "Today's standup highlighted the progress on the new feature.",
    "The release notes have been published on the internal wiki.",
    "Data migration from the old schema completed successfully.",
    # Joy
    "Just got engaged! The happiest moment of my life 💍",
    "We won the championship! Tears of joy everywhere 🏆",
    "Baby's first steps today. I'm overwhelmed with happiness.",
    "Finally on vacation! Sun, beach, and no emails 🌊",
    "Surprise party was perfect. I had no idea! Love my friends.",
    # Anger
    "I am absolutely DONE with this company. Enough is enough!",
    "How dare they charge me extra without notice. UNACCEPTABLE.",
    "Hours on hold and hung up on. This is outrageous behavior.",
    "The negligence here is criminal. People could have been hurt!",
    "Why is nobody being held accountable?? This is infuriating.",
    # Sadness
    "Just found out my grandfather passed away. I'm heartbroken 💔",
    "Our dog is gone. The house feels so empty right now.",
    "Didn't get the job. Really thought this was the one.",
    "It's been a tough week. Feeling really low and drained.",
    "Miss my old friends so much. Wish we were still close.",
    # Fear
    "The earthquake alert went off. I'm really scared right now.",
    "Doctor found something on the scan. Anxiety through the roof.",
    "Driving in this storm is terrifying. Please stay safe!",
    "News headlines are getting more frightening every single day.",
    "Not sure if we'll make it through. Everything feels uncertain.",
    # Surprise
    "I had NO idea this was happening. Absolutely blown away!",
    "Wait — they announced a sequel?! This changes everything!",
    "The results shocked everyone in the room. Nobody saw that coming.",
    "Plot twist nobody expected. My jaw literally dropped.",
    "She walked in and the reaction was priceless. Total shock!",
]

# -------------------------------------------------------------------
# Stream State
# -------------------------------------------------------------------
_stream_running = False
_stream_task: Optional[asyncio.Task] = None
_session_stats = {
    "total": 0,
    "sentiment": {"Positive": 0, "Negative": 0, "Neutral": 0},
    "emotion": {},
    "started_at": None,
}


def get_session_stats() -> dict:
    return dict(_session_stats)


def reset_session_stats():
    global _session_stats
    _session_stats = {
        "total": 0,
        "sentiment": {"Positive": 0, "Negative": 0, "Neutral": 0},
        "emotion": {},
        "started_at": None,
    }


def is_running() -> bool:
    return _stream_running


async def _process_and_broadcast(text: str):
    """Run the full NLP pipeline on one text and broadcast the result."""
    # 1. Clean
    clean = clean_text(text)
    # 2. Sentiment
    sentiment, confidence = sentiment_classifier(clean or text)
    # 3. Emotion
    emotion = emotion_detector(clean or text)
    # 4. Persist
    record = Record(
        raw_text=text,
        clean_text=clean,
        sentiment=sentiment,
        emotion=emotion,
        confidence=confidence,
        created_at=datetime.utcnow(),
    )
    with Session(engine) as session:
        session.add(record)
        session.commit()
        session.refresh(record)
        record_id = record.id

    # 5. Update session stats
    _session_stats["total"] += 1
    _session_stats["sentiment"][sentiment] = _session_stats["sentiment"].get(sentiment, 0) + 1
    _session_stats["emotion"][emotion] = _session_stats["emotion"].get(emotion, 0) + 1

    # 6. Broadcast
    payload = {
        "type": "new_record",
        "id": record_id,
        "text": text[:120],
        "clean_text": clean[:120] if clean else "",
        "sentiment": sentiment,
        "confidence": round(confidence, 3),
        "emotion": emotion,
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {
            "total": _session_stats["total"],
            "sentiment": _session_stats["sentiment"],
            "emotion": _session_stats["emotion"],
        },
    }
    await manager.broadcast(payload)
    logger.info(f"[STREAM] #{_session_stats['total']} | {sentiment} ({confidence:.2f}) | {emotion}")


async def _stream_loop(interval: float = 2.0):
    """Core loop: pick a random tweet, process it, sleep, repeat."""
    global _stream_running
    pool = list(TWEET_POOL)
    random.shuffle(pool)
    idx = 0
    while _stream_running:
        text = pool[idx % len(pool)]
        idx += 1
        # Re-shuffle when we've gone through the whole pool
        if idx % len(pool) == 0:
            random.shuffle(pool)
        try:
            await _process_and_broadcast(text)
        except Exception as e:
            logger.error(f"[STREAM] Error processing record: {e}")
        await asyncio.sleep(interval)
    logger.info("[STREAM] Loop exited cleanly.")


async def start_stream(interval: float = 2.0):
    global _stream_running, _stream_task
    if _stream_running:
        return {"status": "already_running"}
    _stream_running = True
    _session_stats["started_at"] = datetime.utcnow().isoformat()
    _stream_task = asyncio.create_task(_stream_loop(interval))
    logger.info(f"[STREAM] Started (interval={interval}s).")
    await manager.broadcast({"type": "stream_started", "interval": interval})
    return {"status": "started"}


async def stop_stream():
    global _stream_running, _stream_task
    if not _stream_running:
        return {"status": "not_running"}
    _stream_running = False
    if _stream_task:
        _stream_task.cancel()
        _stream_task = None
    logger.info("[STREAM] Stopped.")
    await manager.broadcast({"type": "stream_stopped"})
    return {"status": "stopped"}


async def pause_stream():
    """Alias of stop for now — start/stop is idempotent."""
    return await stop_stream()
