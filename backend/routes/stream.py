"""
routes/stream.py — REST endpoints to control the real-time stream + WebSocket endpoint.

Endpoints:
  POST /api/stream/start   – Begin the live analysis loop
  POST /api/stream/pause   – Pause the stream (same as stop for now)
  POST /api/stream/stop    – Stop the live analysis loop
  GET  /api/stream/status  – Current stream status + session stats
  WS   /ws/live            – WebSocket channel clients subscribe to
"""
import logging

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from services.stream_service import (
    get_session_stats,
    is_running,
    pause_stream,
    reset_session_stats,
    start_stream,
    stop_stream,
)
from ws_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter()


# ── REST Controls ──────────────────────────────────────────────────

@router.post("/stream/start")
async def api_start_stream(
    interval: float = Query(default=2.0, ge=0.5, le=10.0, description="Seconds between records"),
):
    result = await start_stream(interval=interval)
    return result


@router.post("/stream/pause")
async def api_pause_stream():
    result = await pause_stream()
    return result


@router.post("/stream/stop")
async def api_stop_stream():
    result = await stop_stream()
    return result


@router.post("/stream/reset")
async def api_reset_stream():
    await stop_stream()
    reset_session_stats()
    return {"status": "reset"}


@router.get("/stream/status")
def api_stream_status():
    return {
        "running": is_running(),
        "clients": manager.client_count,
        "stats": get_session_stats(),
    }


# ── WebSocket Endpoint ─────────────────────────────────────────────

@router.websocket("/ws/live")
async def websocket_live(websocket: WebSocket):
    """
    Frontend connects here to receive real-time analysis events.
    Each event is a JSON object:
    {
      "type":       "new_record" | "stream_started" | "stream_stopped",
      "id":         int,
      "text":       str,
      "sentiment":  str,
      "confidence": float,
      "emotion":    str,
      "timestamp":  str (ISO),
      "stats": {
        "total":     int,
        "sentiment": {"Positive": int, "Negative": int, "Neutral": int},
        "emotion":   {"Joy": int, ...}
      }
    }
    """
    await manager.connect(websocket)
    # Send current state immediately on connect
    await websocket.send_json({
        "type": "connected",
        "running": is_running(),
        "stats": get_session_stats(),
        "clients": manager.client_count,
    })
    try:
        while True:
            # Keep the connection alive; frontend sends pings as needed
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket client disconnected cleanly.")
    except Exception as e:
        manager.disconnect(websocket)
        logger.warning(f"WebSocket error: {e}")
