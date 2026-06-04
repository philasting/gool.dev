"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor, Play, Pause, Maximize, Minimize } from "lucide-react";

type SpeedPreset = "slow" | "medium" | "fast" | "custom";
type ThemeMode = "dark" | "light";

const SPEED_MAP: Record<SpeedPreset, number> = {
  slow: 1,
  medium: 3,
  fast: 6,
  custom: 3,
};

export function TeleprompterTool() {
  const [text, setText] = useState("");
  const [speed, setSpeed] = useState(3);
  const [fontSize, setFontSize] = useState(48);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [speedPreset, setSpeedPreset] = useState<SpeedPreset>("medium");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  // Scrolling logic
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const container = isFullscreen
      ? scrollContainerRef.current
      : scrollContainerRef.current;
    if (!container) return;

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;

      // Scroll speed in pixels per second
      const pxPerSec = speed * 30;
      const scrollDelta = (pxPerSec * delta) / 1000;

      container.scrollTop += scrollDelta;

      // Check if we've reached the bottom
      if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
        setIsPlaying(false);
        return;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, speed, isFullscreen]);

  const handleSpeedPreset = useCallback((preset: SpeedPreset) => {
    setSpeedPreset(preset);
    if (preset !== "custom") {
      setSpeed(SPEED_MAP[preset]);
    }
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    const container = isFullscreen
      ? scrollContainerRef.current
      : scrollContainerRef.current;
    if (container) container.scrollTop = 0;
  }, [isFullscreen]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      scrollContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // Listen for fullscreen exit
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const isDark = theme === "dark";
  const bgColor = isDark ? "bg-black" : "bg-white";
  const textColor = isDark ? "text-white" : "text-black";
  const borderColor = isDark ? "border-gray-700" : "border-gray-300";

  // Fullscreen teleprompter view
  const teleprompterContent = (
    <div
      ref={scrollContainerRef}
      className={`w-full h-[400px] sm:h-[500px] rounded-xl overflow-y-auto ${bgColor} ${textColor} relative`}
      style={{ scrollBehavior: "auto" }}
    >
      <div
        ref={contentRef}
        className="px-8 pt-[50%] pb-[50%] whitespace-pre-wrap leading-relaxed"
        style={{ fontSize: `${fontSize}px` }}
      >
        {text || "在这里输入或粘贴你的提词文本..."}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>提词文本</Label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="在这里输入或粘贴你的提词文本..."
          rows={6}
          className="resize-y"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>速度预设</Label>
          <Select value={speedPreset} onValueChange={(v) => handleSpeedPreset(v as SpeedPreset)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="slow">慢速</SelectItem>
              <SelectItem value="medium">中速</SelectItem>
              <SelectItem value="fast">快速</SelectItem>
              <SelectItem value="custom">自定义</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>背景主题</Label>
          <Select value={theme} onValueChange={(v) => setTheme(v as ThemeMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dark">黑底白字</SelectItem>
              <SelectItem value="light">白底黑字</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {speedPreset === "custom" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>滚动速度</Label>
            <span className="text-sm font-mono text-primary">{speed}</span>
          </div>
          <Slider
            value={[speed]}
            onValueChange={(v) => { const val = typeof v === "number" ? v : v[0]; setSpeed(val); }}
            min={0.5}
            max={10}
            step={0.5}
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>字号</Label>
          <span className="text-sm font-mono text-primary">{fontSize}px</span>
        </div>
        <Slider
          value={[fontSize]}
          onValueChange={(v) => { const val = typeof v === "number" ? v : v[0]; setFontSize(val); }}
          min={24}
          max={96}
          step={2}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={togglePlay} variant={isPlaying ? "destructive" : "default"}>
          {isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
          {isPlaying ? "暂停" : "播放"}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          重置
        </Button>
        <Button variant="outline" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize className="h-4 w-4 mr-1" /> : <Maximize className="h-4 w-4 mr-1" />}
          {isFullscreen ? "退出全屏" : "全屏"}
        </Button>
      </div>

      {teleprompterContent}

      {!text && (
        <div className="text-center text-muted-foreground py-4">
          <Monitor className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">输入文本后点击播放，大字滚动提词</p>
        </div>
      )}
    </div>
  );
}
