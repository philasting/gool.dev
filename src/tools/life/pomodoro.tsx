"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";

type PomodoroPhase = "work" | "break" | "longBreak";

interface PomodoroConfig {
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  roundsBeforeLongBreak: number;
}

const DEFAULT_CONFIG: PomodoroConfig = {
  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  roundsBeforeLongBreak: 4,
};

/** Play a short beep using AudioContext */
function playBeep(): void {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gain.gain.value = 0.3;
    oscillator.start();
    // Play 3 short beeps
    setTimeout(() => { gain.gain.value = 0; }, 150);
    setTimeout(() => { gain.gain.value = 0.3; }, 300);
    setTimeout(() => { gain.gain.value = 0; }, 450);
    setTimeout(() => { gain.gain.value = 0.3; }, 600);
    setTimeout(() => {
      gain.gain.value = 0;
      oscillator.stop();
      ctx.close();
    }, 750);
  } catch {
    // AudioContext not available
  }
}

export function PomodoroTool() {
  const [config, setConfig] = useState<PomodoroConfig>(DEFAULT_CONFIG);
  const [showSettings, setShowSettings] = useState(false);
  const [phase, setPhase] = useState<PomodoroPhase>("work");
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_CONFIG.workMinutes * 60);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer tick
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Timer finished
          playBeep();
          setRunning(false);
          // Move to next phase
          setCompletedRounds((r) => {
            if (phase === "work") {
              const newRounds = r + 1;
              setTotalCompleted((t) => t + 1);
              if (newRounds >= config.roundsBeforeLongBreak) {
                setPhase("longBreak");
                setSecondsLeft(config.longBreakMinutes * 60);
                return 0;
              } else {
                setPhase("break");
                setSecondsLeft(config.breakMinutes * 60);
                return newRounds;
              }
            } else {
              setPhase("work");
              setSecondsLeft(config.workMinutes * 60);
              return r;
            }
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, phase, config]);

  const handleStart = useCallback(() => {
    setRunning(true);
  }, []);

  const handlePause = useCallback(() => {
    setRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    setRunning(false);
    setPhase("work");
    setSecondsLeft(config.workMinutes * 60);
    setCompletedRounds(0);
  }, [config.workMinutes]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const totalSeconds = phase === "work"
    ? config.workMinutes * 60
    : phase === "break"
    ? config.breakMinutes * 60
    : config.longBreakMinutes * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  const phaseLabel: Record<PomodoroPhase, string> = {
    work: "工作中",
    break: "休息中",
    longBreak: "长休息",
  };

  const phaseColor: Record<PomodoroPhase, string> = {
    work: "text-red-500",
    break: "text-green-500",
    longBreak: "text-blue-500",
  };

  const phaseBg: Record<PomodoroPhase, string> = {
    work: "bg-red-500",
    break: "bg-green-500",
    longBreak: "bg-blue-500",
  };

  return (
    <div className="space-y-4">
      {/* Main timer display */}
      <Card>
        <CardContent className="p-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant={phase === "work" ? "destructive" : phase === "break" ? "default" : "secondary"}>
              {phaseLabel[phase]}
            </Badge>
            {phase === "work" && (
              <Badge variant="outline">
                第 {completedRounds + 1}/{config.roundsBeforeLongBreak} 轮
              </Badge>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-sm h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${phaseBg[phase]} transition-all duration-1000`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Timer */}
          <div className={`text-6xl font-mono font-bold tabular-nums ${phaseColor[phase]}`}>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!running ? (
              <Button onClick={handleStart} size="lg">
                <Play className="h-5 w-5 mr-2" /> 开始
              </Button>
            ) : (
              <Button onClick={handlePause} variant="secondary" size="lg">
                <Pause className="h-5 w-5 mr-2" /> 暂停
              </Button>
            )}
            <Button onClick={handleReset} variant="outline" size="lg">
              <RotateCcw className="h-5 w-5 mr-2" /> 重置
            </Button>
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="ghost"
              size="lg"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          {/* Stats */}
          <div className="text-sm text-muted-foreground">
            已完成 {totalCompleted} 个番茄钟
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      {showSettings && (
        <Card>
          <CardContent className="p-4">
            <Label className="text-sm font-medium mb-3 block">自定义时间（分钟）</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">工作时长</Label>
                <Input
                  type="number"
                  value={config.workMinutes}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(60, Number(e.target.value) || 25));
                    setConfig((c) => ({ ...c, workMinutes: val }));
                    if (phase === "work" && !running) setSecondsLeft(val * 60);
                  }}
                  min={1}
                  max={60}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">休息时长</Label>
                <Input
                  type="number"
                  value={config.breakMinutes}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(30, Number(e.target.value) || 5));
                    setConfig((c) => ({ ...c, breakMinutes: val }));
                    if (phase === "break" && !running) setSecondsLeft(val * 60);
                  }}
                  min={1}
                  max={30}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">长休息时长</Label>
                <Input
                  type="number"
                  value={config.longBreakMinutes}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(60, Number(e.target.value) || 15));
                    setConfig((c) => ({ ...c, longBreakMinutes: val }));
                    if (phase === "longBreak" && !running) setSecondsLeft(val * 60);
                  }}
                  min={1}
                  max={60}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">长休息前轮数</Label>
                <Input
                  type="number"
                  value={config.roundsBeforeLongBreak}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(10, Number(e.target.value) || 4));
                    setConfig((c) => ({ ...c, roundsBeforeLongBreak: val }));
                  }}
                  min={1}
                  max={10}
                  className="h-8"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
