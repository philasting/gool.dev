"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Square, Volume2, AlertCircle } from "lucide-react";

type SpeechStatus = "idle" | "playing" | "paused";

interface VoiceOption {
  voice: SpeechSynthesisVoice;
  label: string;
}

export function TextToSpeechTool() {
  const [text, setText] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [supported, setSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Sort: Chinese voices first
      const sorted = [...allVoices].sort((a, b) => {
        const aZh = a.lang.startsWith("zh") ? 0 : 1;
        const bZh = b.lang.startsWith("zh") ? 0 : 1;
        return aZh - bZh;
      });
      const voiceOptions: VoiceOption[] = sorted.map((v) => ({
        voice: v,
        label: `${v.name} (${v.lang})`,
      }));
      setVoices(voiceOptions);
      // Auto-select first Chinese voice or first voice
      const zhVoice = voiceOptions.find((vo) => vo.voice.lang.startsWith("zh"));
      if (zhVoice) {
        setSelectedVoiceName(zhVoice.voice.name);
      } else if (voiceOptions.length > 0) {
        setSelectedVoiceName(voiceOptions[0].voice.name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handlePlay = useCallback(() => {
    if (!text.trim() || !supported) return;
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    const selectedVoice = voices.find((v) => v.voice.name === selectedVoiceName);
    if (selectedVoice) {
      utterance.voice = selectedVoice.voice;
    }

    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setStatus("playing");
  }, [text, rate, pitch, volume, voices, selectedVoiceName, supported]);

  const handlePause = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setStatus("paused");
    }
  }, []);

  const handleResume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setStatus("playing");
    }
  }, []);

  const handleStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setStatus("idle");
  }, []);

  const statusLabels: Record<SpeechStatus, string> = {
    idle: "已停止",
    playing: "正在播放",
    paused: "已暂停",
  };

  const statusColors: Record<SpeechStatus, string> = {
    idle: "text-muted-foreground",
    playing: "text-green-600",
    paused: "text-yellow-600",
  };

  if (!supported) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            您的浏览器不支持 Web Speech API，请使用 Chrome / Edge 等现代浏览器。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="请输入要朗读的文本..."
        rows={5}
        className="resize-y"
      />

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1 flex-1 min-w-[200px]">
          <Label className="text-sm">语音选择</Label>
          <Select value={selectedVoiceName} onValueChange={(v) => { if (v !== null) setSelectedVoiceName(v); }}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="选择语音" />
            </SelectTrigger>
            <SelectContent>
              {voices.map((vo) => (
                <SelectItem key={vo.voice.name} value={vo.voice.name}>
                  {vo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-sm">语速</Label>
            <span className="text-xs text-muted-foreground">{rate.toFixed(1)}</span>
          </div>
          <Slider
            value={[rate]}
            onValueChange={(v) => setRate(Array.isArray(v) ? v[0] : v)}
            min={0.5}
            max={2}
            step={0.1}
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-sm">音调</Label>
            <span className="text-xs text-muted-foreground">{pitch.toFixed(1)}</span>
          </div>
          <Slider
            value={[pitch]}
            onValueChange={(v) => setPitch(Array.isArray(v) ? v[0] : v)}
            min={0.5}
            max={2}
            step={0.1}
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-sm">音量</Label>
            <span className="text-xs text-muted-foreground">{volume.toFixed(1)}</span>
          </div>
          <Slider
            value={[volume]}
            onValueChange={(v) => setVolume(Array.isArray(v) ? v[0] : v)}
            min={0}
            max={1}
            step={0.1}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={status === "paused" ? handleResume : handlePlay}
          disabled={!text.trim()}
          size="lg"
        >
          <Play className="h-4 w-4 mr-2" />
          {status === "paused" ? "继续" : "播放"}
        </Button>
        <Button
          onClick={handlePause}
          disabled={status !== "playing"}
          variant="outline"
          size="lg"
        >
          <Pause className="h-4 w-4 mr-2" /> 暂停
        </Button>
        <Button
          onClick={handleStop}
          disabled={status === "idle"}
          variant="outline"
          size="lg"
        >
          <Square className="h-4 w-4 mr-2" /> 停止
        </Button>
        <div className="flex items-center gap-2 ml-auto">
          <Volume2 className={`h-4 w-4 ${statusColors[status]}`} />
          <span className={`text-sm ${statusColors[status]}`}>{statusLabels[status]}</span>
        </div>
      </div>
    </div>
  );
}
