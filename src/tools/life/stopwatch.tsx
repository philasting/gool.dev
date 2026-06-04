"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Flag } from "lucide-react";

interface LapRecord {
  index: number;
  time: number;
  diff: number;
}

function formatTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

export function StopwatchTool() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<LapRecord[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    accumulatedRef.current = elapsed;
    setRunning(true);

    intervalRef.current = setInterval(() => {
      setElapsed(accumulatedRef.current + (Date.now() - startTimeRef.current));
    }, 10);
  }, [elapsed]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    accumulatedRef.current = elapsed;
    setRunning(false);
  }, [elapsed]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setElapsed(0);
    setRunning(false);
    accumulatedRef.current = 0;
    startTimeRef.current = 0;
    setLaps([]);
  }, []);

  const addLap = useCallback(() => {
    const lastLapTime = laps.length > 0 ? laps[0].time : 0;
    const diff = elapsed - lastLapTime;
    setLaps((prev) => [{ index: prev.length + 1, time: elapsed, diff }, ...prev]);
  }, [elapsed, laps]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Timer display */}
      <div className="text-center py-8">
        <div className="text-5xl sm:text-6xl font-mono font-bold tracking-wider">
          {formatTime(elapsed)}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {running ? "计时中" : elapsed === 0 ? "点击开始计时" : "已暂停"}
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {!running ? (
          <Button onClick={start} size="lg" className="w-28">
            <Play className="h-5 w-5 mr-2" /> {elapsed === 0 ? "开始" : "继续"}
          </Button>
        ) : (
          <Button onClick={pause} variant="secondary" size="lg" className="w-28">
            <Pause className="h-5 w-5 mr-2" /> 暂停
          </Button>
        )}
        {running ? (
          <Button onClick={addLap} variant="outline" size="lg" className="w-28">
            <Flag className="h-5 w-5 mr-2" /> 计次
          </Button>
        ) : (
          <Button onClick={reset} variant="outline" size="lg" className="w-28" disabled={elapsed === 0}>
            <RotateCcw className="h-5 w-5 mr-2" /> 重置
          </Button>
        )}
      </div>

      {/* Lap records */}
      {laps.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="text-sm font-semibold mb-2">计次记录</div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {laps.map((lap) => {
                // Find best (min) and worst (max) diff
                const diffs = laps.map((l) => l.diff);
                const minDiff = Math.min(...diffs);
                const maxDiff = Math.max(...diffs);

                let diffClass = "";
                if (laps.length > 2) {
                  if (lap.diff === minDiff) diffClass = "text-green-600 dark:text-green-400";
                  else if (lap.diff === maxDiff) diffClass = "text-red-600 dark:text-red-400";
                }

                return (
                  <div key={lap.index} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <span className="text-sm text-muted-foreground w-16">#{lap.index}</span>
                    <span className={`text-sm font-mono ${diffClass}`}>{formatTime(lap.diff)}</span>
                    <span className="text-sm font-mono text-muted-foreground">{formatTime(lap.time)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
