"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WS_BASE } from "@/lib/api";

export type LiveRecord = {
    id: number;
    text: string;
    clean_text: string;
    sentiment: "Positive" | "Negative" | "Neutral" | string;
    confidence: number;
    emotion: string;
    timestamp: string;
};

export type StreamStats = {
    total: number;
    sentiment: Record<string, number>;
    emotion: Record<string, number>;
};

export type WsMessage =
    | { type: "connected"; running: boolean; stats: StreamStats; clients: number }
    | { type: "stream_started"; interval: number }
    | { type: "stream_stopped" }
    | ({ type: "new_record" } & LiveRecord & { stats: StreamStats });

type UseWebSocketReturn = {
    connected: boolean;
    streamRunning: boolean;
    stats: StreamStats;
    records: LiveRecord[];
    latestRecord: LiveRecord | null;
    clientCount: number;
};

const INITIAL_STATS: StreamStats = {
    total: 0,
    sentiment: { Positive: 0, Negative: 0, Neutral: 0 },
    emotion: {},
};

const MAX_RECORDS = 200; // Keep last 200 records in memory

/**
 * useWebSocket — subscribes to the backend /ws/live endpoint.
 * Exposes live stats and the record feed for the dashboard / analysis pages.
 */
export function useWebSocket(): UseWebSocketReturn {
    const wsRef = useRef<WebSocket | null>(null);
    const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [connected, setConnected] = useState(false);
    const [streamRunning, setStreamRunning] = useState(false);
    const [stats, setStats] = useState<StreamStats>(INITIAL_STATS);
    const [records, setRecords] = useState<LiveRecord[]>([]);
    const [latestRecord, setLatestRecord] = useState<LiveRecord | null>(null);
    const [clientCount, setClientCount] = useState(0);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;
        const ws = new WebSocket(`${WS_BASE}/api/ws/live`);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            // Send heartbeat every 25s to keep connection alive
            pingRef.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) ws.send("ping");
            }, 25000);
        };

        ws.onclose = () => {
            setConnected(false);
            if (pingRef.current) clearInterval(pingRef.current);
            // Auto-reconnect after 3s
            setTimeout(connect, 3000);
        };

        ws.onerror = () => {
            ws.close();
        };

        ws.onmessage = (event) => {
            try {
                const msg: WsMessage = JSON.parse(event.data);
                switch (msg.type) {
                    case "connected":
                        setStreamRunning(msg.running);
                        setStats(msg.stats ?? INITIAL_STATS);
                        setClientCount(msg.clients ?? 0);
                        break;
                    case "stream_started":
                        setStreamRunning(true);
                        break;
                    case "stream_stopped":
                        setStreamRunning(false);
                        break;
                    case "new_record": {
                        const rec: LiveRecord = {
                            id: msg.id,
                            text: msg.text,
                            clean_text: msg.clean_text,
                            sentiment: msg.sentiment,
                            confidence: msg.confidence,
                            emotion: msg.emotion,
                            timestamp: msg.timestamp,
                        };
                        setLatestRecord(rec);
                        setRecords((prev) => [rec, ...prev].slice(0, MAX_RECORDS));
                        if (msg.stats) setStats(msg.stats);
                        break;
                    }
                }
            } catch {
                /* ignore malformed frames */
            }
        };
    }, []);

    useEffect(() => {
        connect();
        return () => {
            if (pingRef.current) clearInterval(pingRef.current);
            wsRef.current?.close();
        };
    }, [connect]);

    return { connected, streamRunning, stats, records, latestRecord, clientCount };
}
