"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Film } from "lucide-react";

// ============ GIF Encoder (reused from gif-maker.tsx) ============

class ByteWriter {
  private data: number[] = [];
  writeByte(b: number): void { this.data.push(b & 0xff); }
  writeBytes(bytes: number[]): void { for (const b of bytes) this.writeByte(b); }
  writeUint16(value: number): void { this.writeByte(value & 0xff); this.writeByte((value >> 8) & 0xff); }
  writeString(str: string): void { for (let i = 0; i < str.length; i++) this.writeByte(str.charCodeAt(i)); }
  toUint8Array(): Uint8Array { return new Uint8Array(this.data); }
}

function lzwEncode(indexStream: number[], minCodeSize: number): number[] {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  const codeLimit = 4096;

  const codeTable = new Map<string, number>();
  for (let i = 0; i < clearCode; i++) codeTable.set(String(i), i);

  const output: number[] = [];
  let bitBuffer = 0;
  let bitCount = 0;

  function writeBits(code: number, size: number): void {
    bitBuffer |= code << bitCount;
    bitCount += size;
    while (bitCount >= 8) {
      output.push(bitBuffer & 0xff);
      bitBuffer >>= 8;
      bitCount -= 8;
    }
  }

  writeBits(clearCode, codeSize);

  if (indexStream.length === 0) {
    writeBits(eoiCode, codeSize);
    if (bitCount > 0) output.push(bitBuffer & 0xff);
    return output;
  }

  let current = String(indexStream[0]);

  for (let i = 1; i < indexStream.length; i++) {
    const next = String(indexStream[i]);
    const combined = current + "," + next;

    if (codeTable.has(combined)) {
      current = combined;
    } else {
      writeBits(codeTable.get(current)!, codeSize);
      if (nextCode < codeLimit) {
        codeTable.set(combined, nextCode);
        nextCode++;
        if (nextCode > (1 << codeSize) && codeSize < 12) codeSize++;
      } else {
        writeBits(clearCode, codeSize);
        codeTable.clear();
        for (let j = 0; j < clearCode; j++) codeTable.set(String(j), j);
        nextCode = eoiCode + 1;
        codeSize = minCodeSize + 1;
      }
      current = next;
    }
  }

  writeBits(codeTable.get(current)!, codeSize);
  writeBits(eoiCode, codeSize);
  if (bitCount > 0) output.push(bitBuffer & 0xff);
  return output;
}

function quantizeToIndexed(
  imageData: ImageData,
  width: number,
  height: number
): { indexed: number[]; palette: number[][] } {
  const data = imageData.data;
  const colorMap = new Map<string, number>();
  const palette: number[][] = [];
  const indexed: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 128) {
      if (!colorMap.has("__transparent__")) {
        colorMap.set("__transparent__", palette.length);
        palette.push([0, 0, 0]);
      }
      indexed.push(colorMap.get("__transparent__")!);
      continue;
    }

    const qr = Math.round(r / 51) * 51;
    const qg = Math.round(g / 51) * 51;
    const qb = Math.round(b / 51) * 51;
    const key = `${qr},${qg},${qb}`;

    if (!colorMap.has(key)) {
      if (palette.length < 256) {
        colorMap.set(key, palette.length);
        palette.push([qr, qg, qb]);
      } else {
        let minDist = Infinity;
        let closest = 0;
        for (let j = 0; j < palette.length; j++) {
          const dr = palette[j][0] - qr;
          const dg = palette[j][1] - qg;
          const db = palette[j][2] - qb;
          const dist = dr * dr + dg * dg + db * db;
          if (dist < minDist) { minDist = dist; closest = j; }
        }
        colorMap.set(key, closest);
      }
    }
    indexed.push(colorMap.get(key)!);
  }

  while (palette.length < 256) palette.push([0, 0, 0]);
  return { indexed, palette };
}

function buildGIF(
  frames: { imageData: ImageData; width: number; height: number; delay: number }[],
  loopCount: number
): Uint8Array {
  const writer = new ByteWriter();
  const width = frames[0].width;
  const height = frames[0].height;

  writer.writeString("GIF89a");
  writer.writeUint16(width);
  writer.writeUint16(height);
  writer.writeByte(0xf7);
  writer.writeByte(0);
  writer.writeByte(0);

  for (let i = 0; i < 256 * 3; i++) writer.writeByte(0);

  writer.writeByte(0x21);
  writer.writeByte(0xff);
  writer.writeByte(11);
  writer.writeString("NETSCAPE2.0");
  writer.writeByte(3);
  writer.writeByte(1);
  writer.writeUint16(loopCount === 0 ? 0 : loopCount);
  writer.writeByte(0);

  for (const frame of frames) {
    const { indexed, palette } = quantizeToIndexed(frame.imageData, frame.width, frame.height);

    writer.writeByte(0x21);
    writer.writeByte(0xf9);
    writer.writeByte(4);
    writer.writeByte(0x00);
    writer.writeUint16(Math.round(frame.delay / 10));
    writer.writeByte(0);
    writer.writeByte(0);

    writer.writeByte(0x2c);
    writer.writeUint16(0);
    writer.writeUint16(0);
    writer.writeUint16(frame.width);
    writer.writeUint16(frame.height);
    writer.writeByte(0x80 | 0x07);

    for (let i = 0; i < 256; i++) {
      writer.writeByte(palette[i][0]);
      writer.writeByte(palette[i][1]);
      writer.writeByte(palette[i][2]);
    }

    writer.writeByte(8);
    const compressed = lzwEncode(indexed, 8);

    let offset = 0;
    while (offset < compressed.length) {
      const blockSize = Math.min(255, compressed.length - offset);
      writer.writeByte(blockSize);
      for (let i = 0; i < blockSize; i++) writer.writeByte(compressed[offset + i]);
      offset += blockSize;
    }
    writer.writeByte(0);
  }

  writer.writeByte(0x3b);
  return writer.toUint8Array();
}

// ============ Component ============

export function VideoToGifTool() {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [fps, setFps] = useState(10);
  const [outputScale, setOutputScale] = useState(50);
  const [gifUrl, setGifUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) return;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setGifUrl("");
    setProgress(0);
  }, []);

  const handleVideoLoaded = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setVideoDuration(video.duration);
    setEndTime(video.duration);
  }, []);

  const processVideo = useCallback(async () => {
    if (!videoUrl || !videoRef.current) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not available");

      const origWidth = video.videoWidth;
      const origHeight = video.videoHeight;
      const scale = outputScale / 100;
      canvas.width = Math.round(origWidth * scale);
      canvas.height = Math.round(origHeight * scale);

      const frameDelay = Math.round(1000 / fps);
      const totalFrames = Math.round((endTime - startTime) * fps);
      const frames: { imageData: ImageData; width: number; height: number; delay: number }[] = [];

      for (let i = 0; i < totalFrames; i++) {
        const time = startTime + i / fps;

        // Seek video
        video.currentTime = time;
        await new Promise<void>((resolve) => {
          const handler = () => {
            video.removeEventListener("seeked", handler);
            resolve();
          };
          video.addEventListener("seeked", handler);
        });

        // Small delay for frame rendering
        await new Promise<void>((r) => setTimeout(r, 50));

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        frames.push({ imageData, width: canvas.width, height: canvas.height, delay: frameDelay });

        setProgress(Math.round(((i + 1) / totalFrames) * 100));
      }

      if (frames.length === 0) throw new Error("No frames captured");

      const gifData = buildGIF(frames, 0);
      const blob = new Blob([gifData.buffer as ArrayBuffer], { type: "image/gif" });
      setGifUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error("Video to GIF failed:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [videoUrl, startTime, endTime, fps, outputScale]);

  const handleDownload = useCallback(() => {
    if (!gifUrl) return;
    const a = document.createElement("a");
    a.href = gifUrl;
    a.download = "output.gif";
    a.click();
  }, [gifUrl]);

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
        }}
      >
        <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">点击或拖拽视频文件到此处</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        />
      </div>

      {videoUrl && (
        <>
          <div className="flex justify-center">
            <video
              ref={videoRef}
              src={videoUrl}
              onLoadedMetadata={handleVideoLoaded}
              controls
              className="max-h-60 rounded-lg border border-border"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>开始时间（秒）</Label>
              <Input
                type="number"
                value={startTime}
                onChange={(e) => setStartTime(Math.max(0, Number(e.target.value)))}
                min={0}
                max={endTime}
                step={0.1}
              />
            </div>
            <div className="space-y-2">
              <Label>结束时间（秒）</Label>
              <Input
                type="number"
                value={endTime}
                onChange={(e) => setEndTime(Math.min(videoDuration, Number(e.target.value)))}
                min={startTime}
                max={videoDuration}
                step={0.1}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>帧率 (FPS)</Label>
                <span className="text-sm font-mono text-primary">{fps}</span>
              </div>
              <Slider
                value={[fps]}
                onValueChange={(v) => { const val = typeof v === "number" ? v : v[0]; setFps(val); }}
                min={5}
                max={15}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>输出尺寸</Label>
                <span className="text-sm font-mono text-primary">{outputScale}%</span>
              </div>
              <Slider
                value={[outputScale]}
                onValueChange={(v) => { const val = typeof v === "number" ? v : v[0]; setOutputScale(val); }}
                min={10}
                max={100}
                step={10}
              />
            </div>
          </div>

          <Button onClick={processVideo} disabled={isProcessing}>
            <Film className="h-4 w-4 mr-1" />
            {isProcessing ? `转换中... ${progress}%` : "转换为 GIF"}
          </Button>
        </>
      )}

      {gifUrl && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">GIF 预览</span>
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" /> 下载 GIF
              </Button>
            </div>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={gifUrl} alt="GIF 预览" className="max-h-80 rounded-lg border border-border" />
            </div>
          </CardContent>
        </Card>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
