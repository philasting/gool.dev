"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Video, Square, Pause, Play, Download, Monitor } from "lucide-react";
import { toast } from "sonner";

type RecordingState = "idle" | "recording" | "paused" | "stopped";

export function ScreenRecorderTool() {
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - pausedDurationRef.current * 1000;
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setDuration(Math.floor(elapsed));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
        },
        audio: false,
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm",
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        setFileSize(blob.size);
        setState("stopped");

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      // Handle user stopping share via browser UI
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
          stopTimer();
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setState("recording");
      setDuration(0);
      pausedDurationRef.current = 0;
      setRecordedBlob(null);
      setRecordedUrl(null);
      startTimer();

      toast.success("屏幕录制已开始");
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        toast.error("录制权限被拒绝，请在浏览器中允许屏幕共享");
      } else {
        toast.error("无法启动屏幕录制");
      }
    }
  }, [startTimer, stopTimer]);

  const pauseRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") return;
    mediaRecorderRef.current.pause();
    pausedDurationRef.current = duration;
    stopTimer();
    setState("paused");
  }, [duration, stopTimer]);

  const resumeRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "paused") return;
    mediaRecorderRef.current.resume();
    startTimer();
    setState("recording");
  }, [startTimer]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.stop();
      stopTimer();
    }
  }, [stopTimer]);

  const downloadRecording = useCallback(() => {
    if (!recordedBlob || !recordedUrl) return;

    const link = document.createElement("a");
    link.href = recordedUrl;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    link.download = `screen-recording-${timestamp}.webm`;
    link.click();
  }, [recordedBlob, recordedUrl]);

  const resetRecording = useCallback(() => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setFileSize(0);
    setDuration(0);
    setState("idle");
    pausedDurationRef.current = 0;
  }, [recordedUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [recordedUrl, stopTimer]);

  const stateColor: Record<RecordingState, string> = {
    idle: "secondary",
    recording: "destructive",
    paused: "outline",
    stopped: "secondary",
  };

  const stateLabel: Record<RecordingState, string> = {
    idle: "就绪",
    recording: "录制中",
    paused: "已暂停",
    stopped: "已停止",
  };

  return (
    <div className="space-y-4">
      {/* Status display */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={stateColor[state] as "secondary" | "destructive" | "outline"}>
                {stateLabel[state]}
              </Badge>
            </div>

            {/* Duration display */}
            <div className="text-4xl font-mono font-bold tabular-nums">
              {formatDuration(duration)}
            </div>

            {/* Recording indicator */}
            {state === "recording" && (
              <div className="flex items-center gap-2 text-red-500">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <span className="text-sm font-medium">REC</span>
              </div>
            )}

            {state === "paused" && (
              <div className="flex items-center gap-2 text-amber-500">
                <Pause className="h-4 w-4" />
                <span className="text-sm font-medium">已暂停</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex justify-center gap-2">
        {state === "idle" && (
          <Button onClick={startRecording} size="lg" className="min-w-[160px]">
            <Video className="h-5 w-5 mr-2" /> 开始录制
          </Button>
        )}

        {state === "recording" && (
          <>
            <Button onClick={pauseRecording} variant="outline" size="lg">
              <Pause className="h-5 w-5 mr-2" /> 暂停
            </Button>
            <Button onClick={stopRecording} variant="destructive" size="lg">
              <Square className="h-5 w-5 mr-2" /> 停止
            </Button>
          </>
        )}

        {state === "paused" && (
          <>
            <Button onClick={resumeRecording} size="lg">
              <Play className="h-5 w-5 mr-2" /> 继续
            </Button>
            <Button onClick={stopRecording} variant="destructive" size="lg">
              <Square className="h-5 w-5 mr-2" /> 停止
            </Button>
          </>
        )}

        {state === "stopped" && (
          <>
            <Button onClick={downloadRecording} size="lg" disabled={!recordedBlob}>
              <Download className="h-5 w-5 mr-2" /> 下载录制
            </Button>
            <Button onClick={resetRecording} variant="outline" size="lg">
              重新录制
            </Button>
          </>
        )}
      </div>

      {/* Recording result */}
      {state === "stopped" && recordedUrl && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <Label className="text-sm font-medium">录制预览</Label>
            <video
              src={recordedUrl}
              controls
              className="w-full rounded-lg border"
              style={{ maxHeight: "360px" }}
            />
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>时长: {formatDuration(duration)}</span>
              <span>大小: {formatFileSize(fileSize)}</span>
              <span>格式: WebM</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium">屏幕录制说明</p>
          <p>• 使用浏览器 Screen Capture API，无需安装任何插件</p>
          <p>• 点击「开始录制」后，浏览器会弹出屏幕共享选择</p>
          <p>• 可选择录制整个屏幕、应用窗口或浏览器标签页</p>
          <p>• 录制完成后自动生成 WebM 视频文件并下载</p>
          <p>• 需要在 localhost 或 HTTPS 环境下使用</p>
          <p>• 点击浏览器共享栏的「停止共享」也可结束录制</p>
        </CardContent>
      </Card>
    </div>
  );
}
