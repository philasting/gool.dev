"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PageTitle } from "@/components/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, RotateCcw, Trophy, BarChart3, Clock, CheckCircle2, Coffee, Settings } from "lucide-react";

// ═════════════════════════════════════════
// 番茄钟增强版：统计报表 + 多种时长
// ═════════════════════════════════════════

const TIMER_PRESETS = [
  { label: "专注 25min", focus: 25 * 60, break: 5 * 60, emoji: "🍅" },
  { label: "专注 50min", focus: 50 * 60, break: 10 * 60, emoji: "🍅🍅" },
  { label: "冲刺 15min", focus: 15 * 60, break: 3 * 60, emoji: "⚡" },
  { label: "放松 5min", focus: 5 * 60, break: 2 * 60, emoji: "☕" },
];

interface Session {
  id: string;
  startTime: string;
  endTime: string | null;
  duration: number;    // 计划时长（秒）
  actualDuration: number; // 实际专注时长（秒）
  type: "focus" | "break";
  completed: boolean;
  tag: string;
}

const STORAGE_KEY = "pomodoro-sessions";
const TAGS = ["工作", "学习", "阅读", "编程", "写作", "其他"];

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSessions(sessions: Session[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// ═════════════════════════════════════════
// 主组件
// ═════════════════════════════════════════

export function PomodoroProTool() {
  const [sessions, setSessions] = useState<Session[]>(loadSessions);
  const [mode, setMode] = useState<"focus" | "break" | "idle">("idle");
  const [preset, setPreset] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_PRESETS[0].focus);
  const [isRunning, setIsRunning] = useState(false);
  const [tag, setTag] = useState("工作");
  const [activeTab, setActiveTab] = useState<"timer" | "stats">("timer");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);

  const totalSeconds = mode === "focus" ? TIMER_PRESETS[preset].focus : TIMER_PRESETS[preset].break;

  // 定时器逻辑
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, timeLeft]);

  const handleTimerEnd = () => {
    setIsRunning(false);
    if (mode === "focus") {
      // 完成一个专注时段
      const session: Session = {
        id: `s-${Date.now()}`,
        startTime: new Date(startRef.current).toISOString(),
        endTime: new Date().toISOString(),
        duration: TIMER_PRESETS[preset].focus,
        actualDuration: TIMER_PRESETS[preset].focus - timeLeft,
        type: "focus",
        completed: true,
        tag,
      };
      const newSessions = [...sessions, session];
      setSessions(newSessions);
      saveSessions(newSessions);
      setMode("break");
      setTimeLeft(TIMER_PRESETS[preset].break);
    } else {
      setMode("idle");
    }
  };

  const startFocus = () => {
    startRef.current = Date.now();
    setMode("focus");
    setTimeLeft(TIMER_PRESETS[preset].focus);
    setIsRunning(true);
  };

  const startBreak = () => {
    setMode("break");
    setTimeLeft(TIMER_PRESETS[preset].break);
    setIsRunning(true);
  };

  const togglePause = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
    if (mode === "focus") setTimeLeft(TIMER_PRESETS[preset].focus);
    else if (mode === "break") setTimeLeft(TIMER_PRESETS[preset].break);
    else setMode("idle");
  };

  // 统计
  const today = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter(s => s.startTime.slice(0, 10) === today && s.type === "focus");
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.actualDuration, 0) / 60;
  const totalFocusMinutes = sessions.filter(s => s.type === "focus").reduce((sum, s) => sum + s.actualDuration, 0) / 60;
  const streakDays = (() => {
    let days = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const hasSession = sessions.some(s => s.startTime.slice(0, 10) === ds && s.type === "focus");
      if (hasSession) days++;
      else if (i > 0) break;
    }
    return days;
  })();

  // 格式化时间
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const focusMins = mode === "focus" ? TIMER_PRESETS[preset].focus / 60 : TIMER_PRESETS[preset].break / 60;

  return (
    <div className="space-y-6">
      <PageTitle
        icon={<Clock className="w-6 h-6" />}
        title="番茄钟增强版"
        subtitle="多种时长 · 统计报表 · 标签分类"
      />

      {/* 统计概览 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "今日专注", value: Math.round(todayMinutes), unit: "分钟", icon: <Clock className="w-4 h-4" />, color: "text-red-500" },
          { label: "今日番茄", value: todaySessions.length, unit: "个", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-500" },
          { label: "累计专注", value: Math.round(totalFocusMinutes), unit: "分钟", icon: <Trophy className="w-4 h-4" />, color: "text-purple-500" },
          { label: "连续天数", value: streakDays, unit: "天", icon: <BarChart3 className="w-4 h-4" />, color: "text-amber-500" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted/50 ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}<span className="text-xs font-normal text-muted-foreground"> {s.unit}</span></p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList>
          <TabsTrigger value="timer">计时器</TabsTrigger>
          <TabsTrigger value="stats">统计报表</TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="space-y-4">
          {/* 预设选择 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TIMER_PRESETS.map((p, i) => (
              <Card
                key={i}
                className={`cursor-pointer text-center p-3 transition-all ${preset === i && mode === "idle" ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/50"}`}
                onClick={() => { if (mode === "idle") { setPreset(i); setTimeLeft(p.focus); } }}
              >
                <span className="text-2xl">{p.emoji}</span>
                <p className="text-xs font-medium mt-1">{p.label}</p>
              </Card>
            ))}
          </div>

          {/* 标签选择 */}
          {mode === "idle" && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">标签：</span>
              {TAGS.map(t => (
                <Badge
                  key={t}
                  variant={tag === t ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setTag(t)}
                >{t}</Badge>
              ))}
            </div>
          )}

          {/* 计时器主显示 */}
          <Card className={`border-2 ${mode === "focus" ? "border-red-500/30" : mode === "break" ? "border-emerald-500/30" : "border-border"}`}>
            <CardContent className="p-8 text-center space-y-6">
              {mode !== "idle" && (
                <Badge variant="outline" className={mode === "focus" ? "text-red-500 border-red-500/30" : "text-emerald-500 border-emerald-500/30"}>
                  {mode === "focus" ? "🍅 专注中" : "☕ 休息中"}
                </Badge>
              )}
              <div className="text-8xl font-mono font-bold tabular-nums">
                {formatTime(timeLeft)}
              </div>
              <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${mode === "focus" ? "bg-red-500" : "bg-emerald-500"}`}
                  style={{ width: `${mode !== "idle" ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0}%` }}
                />
              </div>

              <div className="flex justify-center gap-2">
                {mode === "idle" ? (
                  <Button onClick={startFocus} size="lg" className="px-8">
                    <Play className="w-5 h-5 mr-2" />
                    开始专注
                  </Button>
                ) : (
                  <>
                    <Button onClick={togglePause} size="lg" variant={isRunning ? "outline" : "default"}>
                      {isRunning ? <><Pause className="w-5 h-5 mr-2" /> 暂停</> : <><Play className="w-5 h-5 mr-2" /> 继续</>}
                    </Button>
                    <Button onClick={resetTimer} variant="outline" size="lg">
                      <RotateCcw className="w-5 h-5 mr-2" />
                      重置
                    </Button>
                    {mode === "focus" && (
                      <Button onClick={() => { if (timerRef.current) clearInterval(timerRef.current); handleTimerEnd(); }} variant="outline" size="lg">
                        跳过
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                本周统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (6 - i));
                  const ds = d.toISOString().slice(0, 10);
                  const daySessions = sessions.filter(s => s.startTime.slice(0, 10) === ds && s.type === "focus");
                  const mins = daySessions.reduce((sum, s) => sum + s.actualDuration, 0) / 60;
                  const label = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
                  return (
                    <div key={ds} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>周{label} ({ds.slice(5)})</span>
                        <span className="font-medium">{Math.round(mins)} 分钟 · {daySessions.length} 番茄</span>
                      </div>
                      <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, (mins / 120) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 标签统计 */}
          <Card>
            <CardHeader><CardTitle>按标签统计</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {TAGS.map(t => {
                  const tagSessions = sessions.filter(s => s.tag === t && s.type === "focus");
                  const mins = tagSessions.reduce((sum, s) => sum + s.actualDuration, 0) / 60;
                  return (
                    <div key={t} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
                      <span>{t}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{Math.round(mins)} 分钟</span>
                        <Badge variant="outline" className="text-[10px]">{tagSessions.length} 次</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-center text-muted-foreground">
        🍅 每完成一个番茄钟，记得休息一下，让大脑保持最佳状态。数据保存在浏览器本地。
      </p>
    </div>
  );
}
