"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plug, Unplug, Send, Trash2 } from "lucide-react";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface LogEntry {
  type: "sent" | "received" | "system";
  message: string;
  timestamp: Date;
}

export function WebsocketTesterTool() {
  const [url, setUrl] = useState("ws://localhost:8080");
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = useCallback((type: LogEntry["type"], msg: string) => {
    setLogs((prev) => [...prev, { type, message: msg, timestamp: new Date() }]);
  }, []);

  const handleConnect = useCallback(() => {
    if (!url.trim()) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      setStatus("connecting");
      addLog("system", `正在连接 ${url}...`);

      ws.onopen = () => {
        setStatus("connected");
        addLog("system", "已连接");
      };

      ws.onmessage = (event) => {
        let displayMsg = String(event.data);
        // Try to pretty-print JSON
        try {
          const parsed = JSON.parse(displayMsg);
          displayMsg = JSON.stringify(parsed, null, 2);
        } catch {
          // Not JSON, show as-is
        }
        addLog("received", displayMsg);
      };

      ws.onclose = (event) => {
        setStatus("disconnected");
        addLog("system", `连接已关闭 (code: ${event.code})`);
        wsRef.current = null;
      };

      ws.onerror = () => {
        setStatus("error");
        addLog("system", "连接出错");
        wsRef.current = null;
      };
    } catch (e) {
      setStatus("error");
      addLog("system", `连接失败: ${(e as Error).message}`);
    }
  }, [url, addLog]);

  const handleDisconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  const handleSend = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog("system", "未连接，无法发送消息");
      return;
    }
    if (!message.trim()) return;
    wsRef.current.send(message);
    addLog("sent", message);
    setMessage("");
  }, [message, addLog]);

  const handleClearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const statusLabel: Record<ConnectionStatus, string> = {
    disconnected: "未连接",
    connecting: "连接中...",
    connected: "已连接",
    error: "连接出错",
  };

  const statusColor: Record<ConnectionStatus, string> = {
    disconnected: "bg-gray-400",
    connecting: "bg-yellow-400",
    connected: "bg-green-500",
    error: "bg-red-500",
  };

  return (
    <div className="space-y-4">
      {/* Connection bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${statusColor[status]}`} />
            <Badge variant={status === "connected" ? "default" : "secondary"}>
              {statusLabel[status]}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="ws://localhost:8080"
              className="font-mono text-sm flex-1"
              disabled={status === "connected" || status === "connecting"}
            />
            {status === "disconnected" || status === "error" ? (
              <Button onClick={handleConnect} size="sm" disabled={!url.trim()}>
                <Plug className="h-4 w-4 mr-1" /> 连接
              </Button>
            ) : (
              <Button onClick={handleDisconnect} variant="destructive" size="sm">
                <Unplug className="h-4 w-4 mr-1" /> 断开
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Message input */}
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="输入要发送的消息..."
          className="font-mono text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button onClick={handleSend} size="sm" disabled={status !== "connected"}>
          <Send className="h-4 w-4 mr-1" /> 发送
        </Button>
      </div>

      {/* Message log */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">消息日志</Label>
            <Button variant="ghost" size="sm" onClick={handleClearLogs}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> 清空日志
            </Button>
          </div>
          <div className="max-h-[400px] overflow-auto custom-scrollbar space-y-1 font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">暂无消息</p>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className={`p-2 rounded text-xs ${
                    log.type === "sent"
                      ? "bg-blue-50 dark:bg-blue-950/30 border-l-2 border-blue-400"
                      : log.type === "received"
                      ? "bg-green-50 dark:bg-green-950/30 border-l-2 border-green-400"
                      : "bg-muted border-l-2 border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge
                      variant={
                        log.type === "sent"
                          ? "default"
                          : log.type === "received"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-[10px] px-1 py-0"
                    >
                      {log.type === "sent" ? "发送" : log.type === "received" ? "接收" : "系统"}
                    </Badge>
                    <span className="text-muted-foreground">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap break-all">{log.message}</pre>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
