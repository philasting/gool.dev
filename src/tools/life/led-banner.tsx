"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Smartphone, Maximize, Minimize, Play, Pause } from "lucide-react";

export function LedBannerTool() {
  const [text, setText] = useState("你好世界 Hello World");
  const [fontSize, setFontSize] = useState(80);
  const [speed, setSpeed] = useState(5);
  const [textColor, setTextColor] = useState("#00ff00");
  const [bgColor, setBgColor] = useState("#000000");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const bannerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const positionRef = useRef(0);

  const startAnimation = useCallback(() => {
    if (!bannerRef.current) return;
    const container = bannerRef.current;

    const animate = () => {
      positionRef.current -= speed * 0.5;

      // Reset position when text scrolls out
      const textWidth = container.scrollWidth;
      const containerWidth = container.parentElement?.clientWidth || window.innerWidth;
      if (positionRef.current < -textWidth) {
        positionRef.current = containerWidth;
      }

      container.style.transform = `translateX(${positionRef.current}px)`;
      animationRef.current = requestAnimationFrame(animate);
    };

    // Initialize position
    const containerWidth = container.parentElement?.clientWidth || window.innerWidth;
    positionRef.current = containerWidth;
    animate();
  }, [speed]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startAnimation();
    } else {
      stopAnimation();
    }
    return () => stopAnimation();
  }, [isPlaying, startAnimation, stopAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const wrapper = document.getElementById("led-banner-wrapper");
    if (!wrapper) return;

    if (!document.fullscreenElement) {
      wrapper.requestFullscreen().then(() => {
        setIsFullscreen(true);
        if (isPlaying) {
          stopAnimation();
          startAnimation();
        }
      }).catch(() => {
        // Fullscreen not supported
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  }, [isPlaying, startAnimation, stopAnimation]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>滚动文字</Label>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入要显示的文字..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>文字颜色</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-10 h-9 rounded border cursor-pointer"
              />
              <Input
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="flex-1 font-mono text-xs h-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>背景颜色</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-10 h-9 rounded border cursor-pointer"
              />
              <Input
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="flex-1 font-mono text-xs h-9"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>字号</Label>
            <span className="text-sm font-mono text-primary">{fontSize}px</span>
          </div>
          <Slider
            value={[fontSize]}
            onValueChange={(v) => setFontSize(Array.isArray(v) ? v[0] : v)}
            min={24}
            max={200}
            step={4}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>滚动速度</Label>
            <span className="text-sm font-mono text-primary">{speed}</span>
          </div>
          <Slider
            value={[speed]}
            onValueChange={(v) => setSpeed(Array.isArray(v) ? v[0] : v)}
            min={1}
            max={20}
            step={1}
          />
        </div>

        {/* Quick color presets */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">快速配色</Label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "经典绿", text: "#00ff00", bg: "#000000" },
              { label: "红底白字", text: "#ffffff", bg: "#ff0000" },
              { label: "蓝底白字", text: "#ffffff", bg: "#0044ff" },
              { label: "白底黑字", text: "#000000", bg: "#ffffff" },
              { label: "黄底黑字", text: "#000000", bg: "#ffdd00" },
              { label: "橙底白字", text: "#ffffff", bg: "#ff6600" },
            ].map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setTextColor(preset.text);
                  setBgColor(preset.bg);
                }}
              >
                <span
                  className="inline-block w-3 h-3 rounded-sm mr-1 border"
                  style={{ backgroundColor: preset.bg, borderColor: preset.text }}
                />
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => setIsPlaying(!isPlaying)}
          size="sm"
          className="flex-1"
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4 mr-1" /> 暂停
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-1" /> 播放
            </>
          )}
        </Button>
        <Button
          onClick={toggleFullscreen}
          variant="outline"
          size="sm"
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Banner preview */}
      <div
        id="led-banner-wrapper"
        className="relative overflow-hidden rounded-lg border"
        style={{ backgroundColor: bgColor, height: `${fontSize * 2}px` }}
      >
        <div
          ref={bannerRef}
          className="absolute whitespace-nowrap flex items-center h-full"
          style={{
            color: textColor,
            fontSize: `${fontSize}px`,
            fontWeight: "bold",
            fontFamily: "system-ui, sans-serif",
            textShadow: `0 0 10px ${textColor}66, 0 0 20px ${textColor}44`,
            transform: isPlaying ? undefined : "translateX(20px)",
          }}
        >
          {text || "请输入文字"}
        </div>
      </div>

      {!isPlaying && (
        <Card>
          <CardContent className="p-3 text-center text-muted-foreground">
            <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">点击「播放」开始滚动，点击「全屏」手持展示</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
