"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, Image, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

/** Magic header to identify stego images */
const STEGO_MAGIC = "GSTG"; // GotAI Stego
const HEADER_LEN = 4 + 4; // magic(4) + length(4)

/**
 * Encode secret text into image pixel LSBs.
 * Format: [MAGIC 4 bytes][length 4 bytes][secret text bytes]
 * Each bit is written to the LSB of R, G, B channels sequentially.
 */
function encodeIntoImage(
  imageData: ImageData,
  secretText: string
): ImageData | null {
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(secretText);

  // Build payload: magic + length + secret
  const payload = new Uint8Array(HEADER_LEN + secretBytes.length);
  // Write magic
  for (let i = 0; i < 4; i++) {
    payload[i] = STEGO_MAGIC.charCodeAt(i);
  }
  // Write length (big-endian uint32)
  const len = secretBytes.length;
  payload[4] = (len >> 24) & 0xff;
  payload[5] = (len >> 16) & 0xff;
  payload[6] = (len >> 8) & 0xff;
  payload[7] = len & 0xff;
  // Write secret bytes
  payload.set(secretBytes, HEADER_LEN);

  // Total bits needed
  const totalBits = payload.length * 8;
  const totalChannels = imageData.width * imageData.height * 3; // RGB only, skip A

  if (totalBits > totalChannels) {
    return null; // Image too small
  }

  // Clone image data
  const result = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );

  let bitIndex = 0;
  for (let i = 0; i < result.data.length && bitIndex < totalBits; i++) {
    // Only modify R, G, B channels (skip A at index 3, 7, 11, ...)
    if (i % 4 === 3) continue;

    const bit = (payload[Math.floor(bitIndex / 8)] >> (7 - (bitIndex % 8))) & 1;
    result.data[i] = (result.data[i] & 0xfe) | bit;
    bitIndex++;
  }

  return result;
}

/**
 * Decode secret text from image pixel LSBs.
 */
function decodeFromImage(imageData: ImageData): string | null {
  // Read all available LSBs
  const maxBytes = Math.floor((imageData.width * imageData.height * 3) / 8);
  const bytes = new Uint8Array(Math.min(maxBytes, 1024 * 1024)); // limit 1MB

  let bitIndex = 0;
  for (let i = 0; i < imageData.data.length && bitIndex < bytes.length * 8; i++) {
    if (i % 4 === 3) continue; // skip alpha

    const bit = imageData.data[i] & 1;
    bytes[Math.floor(bitIndex / 8)] |= bit << (7 - (bitIndex % 8));
    bitIndex++;
  }

  // Check magic
  let magic = "";
  for (let i = 0; i < 4; i++) {
    magic += String.fromCharCode(bytes[i]);
  }
  if (magic !== STEGO_MAGIC) {
    return null; // Not a stego image
  }

  // Read length
  const len =
    ((bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | bytes[7]) >>> 0;

  if (len <= 0 || len + HEADER_LEN > bytes.length) {
    return null; // Invalid length
  }

  // Read secret
  const secretBytes = bytes.slice(HEADER_LEN, HEADER_LEN + len);
  const decoder = new TextDecoder();
  return decoder.decode(secretBytes);
}

export function ImageSteganographyTool() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [secretText, setSecretText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [resultImagePreview, setResultImagePreview] = useState<string | null>(null);
  const [decodedText, setDecodedText] = useState<string | null>(null);
  const [decodeStatus, setDecodeStatus] = useState<"idle" | "success" | "notfound">("idle");
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const decodeFileInputRef = useRef<HTMLInputElement>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);
  const loadedImageDataRef = useRef<ImageData | null>(null);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("请选择图片文件");
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = document.createElement("img");
        img.onload = () => {
          loadedImageRef.current = img;

          const canvas = canvasRef.current;
          if (!canvas) return;
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(img, 0, 0);
          loadedImageDataRef.current = ctx.getImageData(0, 0, img.width, img.height);

          setImagePreview(ev.target?.result as string);
          setResultImagePreview(null);
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleDecodeImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/png")) {
        toast.error("请选择 PNG 图片（隐写信息在 PNG 中保存最佳）");
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = document.createElement("img");
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);

          setImagePreview(ev.target?.result as string);
          setDecodedText(null);
          setDecodeStatus("idle");

          // Auto-decode
          const result = decodeFromImage(imageData);
          if (result !== null) {
            setDecodedText(result);
            setDecodeStatus("success");
          } else {
            setDecodeStatus("notfound");
          }
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleEncode = useCallback(() => {
    if (!loadedImageDataRef.current || !secretText) {
      toast.error("请上传图片并输入秘密文本");
      return;
    }

    setIsProcessing(true);

    try {
      const result = encodeIntoImage(loadedImageDataRef.current, secretText);
      if (!result) {
        toast.error("图片太小，无法容纳秘密文本");
        setIsProcessing(false);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = result.width;
      canvas.height = result.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.putImageData(result, 0, 0);

      // Generate preview
      setResultImagePreview(canvas.toDataURL("image/png"));
      toast.success("隐写成功！请下载含隐写信息的图片");
    } catch {
      toast.error("编码失败");
    } finally {
      setIsProcessing(false);
    }
  }, [secretText]);

  const handleDownload = useCallback(() => {
    if (!resultImagePreview) return;

    const link = document.createElement("a");
    link.href = resultImagePreview;
    link.download = "stego_image.png";
    link.click();
  }, [resultImagePreview]);

  const maxCapacity = loadedImageDataRef.current
    ? Math.floor((loadedImageDataRef.current.width * loadedImageDataRef.current.height * 3) / 8) - HEADER_LEN
    : 0;

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />

      <Tabs value={mode} onValueChange={(v) => setMode(v as "encode" | "decode")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="encode">
            <Lock className="h-3.5 w-3.5 mr-1" />
            隐写编码
          </TabsTrigger>
          <TabsTrigger value="decode">
            <Unlock className="h-3.5 w-3.5 mr-1" />
            提取解码
          </TabsTrigger>
        </TabsList>

        {/* Encode Tab */}
        <TabsContent value="encode" className="space-y-3">
          <div className="space-y-2">
            <Label>上传载体图片</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-1" /> 选择图片
              </Button>
              {imagePreview && mode === "encode" && (
                <span className="text-xs text-muted-foreground">
                  {loadedImageRef.current?.width} × {loadedImageRef.current?.height}
                  {maxCapacity > 0 && ` · 最大容量 ${maxCapacity} 字节`}
                </span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {imagePreview && mode === "encode" && (
            <div className="border rounded-lg overflow-hidden max-w-[300px]">
              <img
                src={imagePreview}
                alt="载体图片"
                className="w-full h-auto"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>秘密文本</Label>
            <Textarea
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              placeholder="输入要隐藏的秘密文本..."
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              {secretText
                ? `文本长度: ${new TextEncoder().encode(secretText).length} 字节`
                : ""}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleEncode}
              size="sm"
              disabled={!imagePreview || !secretText || isProcessing}
            >
              <Lock className="h-4 w-4 mr-1" />
              {isProcessing ? "编码中..." : "编码隐写"}
            </Button>
          </div>

          {resultImagePreview && (
            <Card>
              <CardContent className="p-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  隐写成功！图片外观无变化，但已包含秘密信息。
                </p>
                <div className="border rounded-lg overflow-hidden max-w-[300px]">
                  <img
                    src={resultImagePreview}
                    alt="含隐写信息图片"
                    className="w-full h-auto"
                  />
                </div>
                <Button onClick={handleDownload} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" /> 下载 PNG 图片
                </Button>
                <p className="text-xs text-amber-600">
                  请下载为 PNG 格式，JPEG 压缩会破坏隐写数据！
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Decode Tab */}
        <TabsContent value="decode" className="space-y-3">
          <div className="space-y-2">
            <Label>上传含隐写信息的图片（PNG）</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => decodeFileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1" /> 选择图片
            </Button>
            <input
              ref={decodeFileInputRef}
              type="file"
              accept="image/png,image/bmp,image/webp"
              className="hidden"
              onChange={handleDecodeImageUpload}
            />
          </div>

          {imagePreview && mode === "decode" && (
            <div className="border rounded-lg overflow-hidden max-w-[300px]">
              <img
                src={imagePreview}
                alt="待解码图片"
                className="w-full h-auto"
              />
            </div>
          )}

          {decodeStatus === "success" && decodedText !== null && (
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-1">提取的秘密文本</p>
                <div className="text-sm break-all whitespace-pre-wrap font-mono bg-muted/50 rounded p-2">
                  {decodedText}
                </div>
              </CardContent>
            </Card>
          )}

          {decodeStatus === "notfound" && (
            <Card>
              <CardContent className="p-3">
                <p className="text-sm text-amber-600">
                  未检测到隐写信息。请确认图片是由本工具编码生成的 PNG 图片。
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium">LSB 图片隐写原理</p>
          <p>将秘密文本的二进制数据逐位写入图片像素 RGB 通道的最低有效位（LSB）。</p>
          <p>• 编码时：在每个像素的 R/G/B 值最低位写入 0 或 1</p>
          <p>• 解码时：读取像素 LSB，还原出秘密文本</p>
          <p>• 人眼无法分辨最低位变化，图片外观几乎无损</p>
          <p>⚠️ 请务必使用 PNG 格式保存，JPEG 有损压缩会破坏隐写数据</p>
        </CardContent>
      </Card>
    </div>
  );
}
