"""
ws_manager.py — WebSocket connection manager.
Handles broadcasting real-time analysis results to all connected clients.
"""
import asyncio
import json
import logging
from typing import List

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages all active WebSocket connections."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New WS client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WS client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, data: dict):
        """Send a JSON payload to every connected client."""
        payload = json.dumps(data)
        dead = []
        for ws in self.active_connections:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    @property
    def client_count(self) -> int:
        return len(self.active_connections)


# Singleton — imported everywhere
manager = ConnectionManager()
