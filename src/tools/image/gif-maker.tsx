"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, Download, Trash2, Film, X, Image as ImageIcon } from "lucide-react";

interface FrameItem {
  id: string;
  file: File;
  url: string;
  delay: number;
}

// ============ GIF Encoder (simplified GIF89a) ============

/** Write a 16-bit little-endian value */
function writeUint16(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value, true);
}

/** Create a byte buffer with writer helpers */
class ByteWriter {
  private data: number[] = [];

  writeByte(b: number): void {
    this.data.push(b & 0xff);
  }

  writeBytes(bytes: number[]): void {
    for (const b of bytes) this.writeByte(b);
  }

  writeUint16(value: number): void {
    this.writeByte(value & 0xff);
    this.writeByte((value >> 8) & 0xff);
  }

  writeString(str: string): void {
    for (let i = 0; i < str.length; i++) {
      this.writeByte(str.charCodeAt(i));
    }
  }

  toUint8Array(): Uint8Array {
    return new Uint8Array(this.data);
  }

  get length(): number {
    return this.data.length;
  }
}

/** LZW compression for GIF */
function lzwEncode(indexStream: number[], minCodeSize: number): number[] {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  const codeLimit = 4096;

  // Initialize code table
  const codeTable = new Map<string, number>();
  for (let i = 0; i < clearCode; i++) {
    codeTable.set(String(i), i);
  }

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

  // Write clear code
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
        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize++;
        }
      } else {
        // Reset
        writeBits(clearCode, codeSize);
        codeTable.clear();
        for (let j = 0; j < clearCode; j++) {
          codeTable.set(String(j), j);
        }
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

/** Quantize image data to 256 colors and return indexed pixels */
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
      // Transparent → index 0
      if (!colorMap.has("__transparent__")) {
        colorMap.set("__transparent__", palette.length);
        palette.push([0, 0, 0]);
      }
      indexed.push(colorMap.get("__transparent__")!);
      continue;
    }

    // Quantize to fewer colors (reduce to 6 levels per channel = 216 colors)
    const qr = Math.round(r / 51) * 51;
    const qg = Math.round(g / 51) * 51;
    const qb = Math.round(b / 51) * 51;
    const key = `${qr},${qg},${qb}`;

    if (!colorMap.has(key)) {
      if (palette.length < 256) {
        colorMap.set(key, palette.length);
        palette.push([qr, qg, qb]);
      } else {
        // Find closest color
        let minDist = Infinity;
        let closest = 0;
        for (let j = 0; j < palette.length; j++) {
          const dr = palette[j][0] - qr;
          const dg = palette[j][1] - qg;
          const db = palette[j][2] - qb;
          const dist = dr * dr + dg * dg + db * db;
          if (dist < minDist) {
            minDist = dist;
            closest = j;
          }
        }
        colorMap.set(key, closest);
      }
    }
    indexed.push(colorMap.get(key)!);
  }

  // Pad palette to 256 entries
  while (palette.length < 256) {
    palette.push([0, 0, 0]);
  }

  return { indexed, palette };
}

/** Build a GIF file from frames */
function buildGIF(
  frames: { imageData: ImageData; width: number; height: number; delay: number }[],
  loopCount: number
): Uint8Array {
  const writer = new ByteWriter();
  const width = frames[0].width;
  const height = frames[0].height;

  // Header
  writer.writeString("GIF89a");

  // Logical Screen Descriptor
  writer.writeUint16(width);
  writer.writeUint16(height);
  // GCT flag=1, color resolution=7, sort=0, GCT size=7 (256 colors)
  writer.writeByte(0xf7);
  writer.writeByte(0); // Background color index
  writer.writeByte(0); // Pixel aspect ratio

  // Global Color Table (256 * 3 bytes)
  // We'll write per-frame local color tables instead, but GIF needs a GCT
  // Write a minimal GCT (all zeros)
  for (let i = 0; i < 256 * 3; i++) {
    writer.writeByte(0);
  }

  // NETSCAPE extension for looping
  writer.writeByte(0x21); // Extension
  writer.writeByte(0xff); // Application extension
  writer.writeByte(11);   // Block size
  writer.writeString("NETSCAPE2.0");
  writer.writeByte(3);    // Sub-block size
  writer.writeByte(1);    // Sub-block ID
  writer.writeUint16(loopCount === 0 ? 0 : loopCount); // Loop count (0 = infinite)
  writer.writeByte(0);    // Block terminator

  for (const frame of frames) {
    const { indexed, palette } = quantizeToIndexed(frame.imageData, frame.width, frame.height);

    // Graphic Control Extension
    writer.writeByte(0x21); // Extension
    writer.writeByte(0xf9); // GCE
    writer.writeByte(4);    // Block size
    writer.writeByte(0x00); // Packed (no transparency for simplicity)
    writer.writeUint16(Math.round(frame.delay / 10)); // Delay in 1/100 seconds
    writer.writeByte(0);    // Transparent color index
    writer.writeByte(0);    // Block terminator

    // Image Descriptor
    writer.writeByte(0x2c); // Image separator
    writer.writeUint16(0);  // Left
    writer.writeUint16(0);  // Top
    writer.writeUint16(frame.width);
    writer.writeUint16(frame.height);
    writer.writeByte(0x80 | 0x07); // Local color table, 256 colors

    // Local Color Table
    for (let i = 0; i < 256; i++) {
      writer.writeByte(palette[i][0]);
      writer.writeByte(palette[i][1]);
      writer.writeByte(palette[i][2]);
    }

    // Image Data
    writer.writeByte(8); // LZW minimum code size

    // LZW compress
    const compressed = lzwEncode(indexed, 8);

    // Write sub-blocks (max 255 bytes each)
    let offset = 0;
    while (offset < compressed.length) {
      const blockSize = Math.min(255, compressed.length - offset);
      writer.writeByte(blockSize);
      for (let i = 0; i < blockSize; i++) {
        writer.writeByte(compressed[offset + i]);
      }
      offset += blockSize;
    }
    writer.writeByte(0); // Block terminator
  }

  // Trailer
  writer.writeByte(0x3b);

  return writer.toUint8Array();
}

export function GifMakerTool() {
  const [frames, setFrames] = useState<FrameItem[]>([]);
  const [globalDelay, setGlobalDelay] = useState(200);
  const [loopCount, setLoopCount] = useState(0);
  const [gifUrl, setGifUrl] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [decodedFrames, setDecodedFrames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gifInputRef = useRef<HTMLInputElement>(null);

  const handleAddFrames = useCallback(
    (files: FileList) => {
      const newFrames: FrameItem[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const url = URL.createObjectURL(file);
        newFrames.push({ id: `frame-${Date.now()}-${Math.random()}`, file, url, delay: globalDelay });
      }
      setFrames((prev) => [...prev, ...newFrames]);
    },
    [globalDelay]
  );

  const removeFrame = useCallback((id: string) => {
    setFrames((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const updateDelay = useCallback((id: string, delay: number) => {
    setFrames((prev) => prev.map((f) => (f.id === id ? { ...f, delay } : f)));
  }, []);

  const generateGIF = useCallback(async () => {
    if (frames.length < 2) return;
    setGenerating(true);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not available");

      const firstImg = await loadImageElement(frames[0].url);
      canvas.width = firstImg.naturalWidth;
      canvas.height = firstImg.naturalHeight;

      const gifFrames: { imageData: ImageData; width: number; height: number; delay: number }[] = [];

      for (const frame of frames) {
        const img = await loadImageElement(frame.url);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        gifFrames.push({ imageData, width: canvas.width, height: canvas.height, delay: frame.delay });
      }

      const gifData = buildGIF(gifFrames, loopCount);
      const blob = new Blob([gifData.buffer as ArrayBuffer], { type: "image/gif" });
      setGifUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error("GIF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }, [frames, loopCount]);

  const decodeGIF = useCallback(async (file: File) => {
    setDecodedFrames([]);
    try {
      // Try ImageDecoder API (Chrome/Edge)
      if ("ImageDecoder" in window) {
        const response = new Response(file);
        const decoder = new ImageDecoder({
          data: response.body!,
          type: "image/gif",
        });

        const frameUrls: string[] = [];
        let frameIndex = 0;

        while (true) {
          const result = await decoder.decode({ frameIndex, completeFramesOnly: true });
          const bitmap = result.image;

          const canvas = document.createElement("canvas");
          canvas.width = bitmap.codedWidth;
          canvas.height = bitmap.codedHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(bitmap, 0, 0);
            frameUrls.push(canvas.toDataURL("image/png"));
          }
          bitmap.close();

          frameIndex++;
          if (result.complete) break;
        }

        setDecodedFrames(frameUrls);
      } else {
        // Fallback: just show the GIF as a single image
        const url = URL.createObjectURL(file);
        setDecodedFrames([url]);
      }
    } catch (err) {
      console.error("GIF decode failed:", err);
    }
  }, []);

  const handleDownloadGif = useCallback(() => {
    if (!gifUrl) return;
    const a = document.createElement("a");
    a.href = gifUrl;
    a.download = "animation.gif";
    a.click();
  }, [gifUrl]);

  const handleClear = useCallback(() => {
    frames.forEach((f) => URL.revokeObjectURL(f.url));
    setFrames([]);
    setGifUrl("");
  }, [frames]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="make">
        <TabsList>
          <TabsTrigger value="make">制作 GIF</TabsTrigger>
          <TabsTrigger value="split">分解 GIF</TabsTrigger>
        </TabsList>

        <TabsContent value="make" className="space-y-4 pt-2">
          <div
            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) handleAddFrames(e.dataTransfer.files);
            }}
          >
            <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">点击或拖拽多张图片到此处（帧）</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleAddFrames(e.target.files)}
            />
          </div>

          {frames.length > 0 && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">全局帧延迟</Label>
                  <span className="text-sm font-mono text-primary">{globalDelay}ms</span>
                </div>
                <Slider
                  value={[globalDelay]}
                  onValueChange={(v) => {
                    const val = Array.isArray(v) ? v[0] : v;
                    setGlobalDelay(val);
                    setFrames((prev) => prev.map((f) => ({ ...f, delay: val })));
                  }}
                  min={50}
                  max={2000}
                  step={50}
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm">循环次数</Label>
                <Input
                  type="number"
                  value={loopCount}
                  onChange={(e) => setLoopCount(Number(e.target.value) || 0)}
                  min={0}
                  className="w-20 h-8"
                />
                <span className="text-xs text-muted-foreground">0 = 无限循环</span>
              </div>

              <div className="space-y-2">
                {frames.map((frame, idx) => (
                  <Card key={frame.id}>
                    <CardContent className="p-2 flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-8">#{idx + 1}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={frame.url} alt={`帧 ${idx + 1}`} className="h-12 w-16 object-cover rounded border" />
                      <div className="flex-1 flex items-center gap-2">
                        <Label className="text-xs">延迟:</Label>
                        <Input
                          type="number"
                          value={frame.delay}
                          onChange={(e) => updateDelay(frame.id, Number(e.target.value) || 100)}
                          min={50}
                          className="w-20 h-7 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">ms</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFrame(frame.id)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={generateGIF} disabled={generating || frames.length < 2}>
                  <Film className="h-4 w-4 mr-1" /> {generating ? "生成中..." : "生成 GIF"}
                </Button>
                <Button variant="outline" onClick={handleClear}>
                  <Trash2 className="h-4 w-4 mr-1" /> 清空
                </Button>
              </div>
            </>
          )}

          {gifUrl && (
            <Card>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">GIF 预览</span>
                  <Button variant="secondary" size="sm" onClick={handleDownloadGif}>
                    <Download className="h-4 w-4 mr-1" /> 下载 GIF
                  </Button>
                </div>
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={gifUrl} alt="GIF预览" className="max-h-80 rounded-lg border border-border" />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="split" className="space-y-4 pt-2">
          <div
            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => gifInputRef.current?.click()}
          >
            <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">点击上传 GIF 文件进行分解</p>
            <input
              ref={gifInputRef}
              type="file"
              accept="image/gif"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && decodeGIF(e.target.files[0])}
            />
          </div>

          {"ImageDecoder" in window ? null : (
            <p className="text-xs text-muted-foreground text-center">
              当前浏览器不支持 ImageDecoder API，仅可查看 GIF 原图。推荐使用 Chrome 或 Edge 浏览器。
            </p>
          )}

          {decodedFrames.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {decodedFrames.map((url, idx) => (
                <Card key={idx}>
                  <CardContent className="p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`帧 ${idx + 1}`} className="w-full rounded border" />
                    <p className="text-xs text-muted-foreground text-center mt-1">帧 {idx + 1}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Helper: load image from URL */
function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}
