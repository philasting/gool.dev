"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Download, Trash2, FileImage } from "lucide-react";

interface ExifEntry {
  tag: string;
  tagName: string;
  value: string;
}

/** Read a 16-bit big-endian value from a DataView */
function getUint16(data: DataView, offset: number, littleEndian: boolean): number {
  return data.getUint16(offset, littleEndian);
}

/** Read a 32-bit big-endian value from a DataView */
function getUint32(data: DataView, offset: number, littleEndian: boolean): number {
  return data.getUint32(offset, littleEndian);
}

/** Known EXIF tag names */
const TAG_NAMES: Record<number, string> = {
  0x010f: "Make",
  0x0110: "Model",
  0x0112: "Orientation",
  0x011a: "XResolution",
  0x011b: "YResolution",
  0x0132: "DateTime",
  0x829a: "ExposureTime",
  0x829d: "FNumber",
  0x8827: "ISO",
  0x9003: "DateTimeOriginal",
  0x9004: "DateTimeDigitized",
  0x920a: "FocalLength",
  0xa002: "ImageWidth",
  0xa003: "ImageHeight",
  0xa405: "FocalLengthIn35mmFilm",
  0xa433: "LensMake",
  0xa434: "LensModel",
  0x0001: "GPSLatitudeRef",
  0x0002: "GPSLatitude",
  0x0003: "GPSLongitudeRef",
  0x0004: "GPSLongitude",
  0x0005: "GPSAltitudeRef",
  0x0006: "GPSAltitude",
};

/** Parse rational value (unsigned) */
function parseRational(data: DataView, offset: number, littleEndian: boolean): number {
  const num = getUint32(data, offset, littleEndian);
  const den = getUint32(data, offset + 4, littleEndian);
  return den === 0 ? 0 : num / den;
}

/** Parse a single IFD entry */
function parseIFDEntry(
  data: DataView,
  entryOffset: number,
  tiffOffset: number,
  littleEndian: boolean
): ExifEntry | null {
  const tag = getUint16(data, entryOffset, littleEndian);
  const type = getUint16(data, entryOffset + 2, littleEndian);
  const count = getUint32(data, entryOffset + 4, littleEndian);
  const valueOffset = entryOffset + 8;

  const tagName = TAG_NAMES[tag] || `0x${tag.toString(16).toUpperCase()}`;
  let value = "";

  try {
    // Type 2 = ASCII
    if (type === 2) {
      const strOffset = count <= 4 ? valueOffset : tiffOffset + getUint32(data, valueOffset, littleEndian);
      let str = "";
      for (let i = 0; i < count - 1; i++) {
        const ch = data.getUint8(strOffset + i);
        if (ch === 0) break;
        str += String.fromCharCode(ch);
      }
      value = str;
    }
    // Type 3 = SHORT
    else if (type === 3) {
      if (count === 1) {
        value = String(getUint16(data, valueOffset, littleEndian));
      } else {
        const arr: number[] = [];
        for (let i = 0; i < Math.min(count, 4); i++) {
          arr.push(getUint16(data, valueOffset + i * 2, littleEndian));
        }
        value = arr.join(", ");
      }
    }
    // Type 4 = LONG
    else if (type === 4) {
      if (count === 1) {
        value = String(getUint32(data, valueOffset, littleEndian));
      } else {
        const arr: number[] = [];
        const base = count <= 1 ? valueOffset : tiffOffset + getUint32(data, valueOffset, littleEndian);
        for (let i = 0; i < Math.min(count, 4); i++) {
          arr.push(getUint32(data, base + i * 4, littleEndian));
        }
        value = arr.join(", ");
      }
    }
    // Type 5 = RATIONAL (unsigned)
    else if (type === 5) {
      if (count === 1) {
        const rationalOffset = tiffOffset + getUint32(data, valueOffset, littleEndian);
        const num = getUint32(data, rationalOffset, littleEndian);
        const den = getUint32(data, rationalOffset + 4, littleEndian);
        if (tag === 0x829a) {
          // ExposureTime
          value = den === 0 ? "0" : den === 1 ? `${num}s` : `${num}/${den}s`;
        } else if (tag === 0x829d) {
          // FNumber
          value = den === 0 ? "0" : `f/${(num / den).toFixed(1)}`;
        } else if (tag === 0x920a) {
          // FocalLength
          value = den === 0 ? "0" : `${(num / den).toFixed(1)}mm`;
        } else {
          value = den === 0 ? "0" : `${(num / den).toFixed(4)}`;
        }
      } else {
        const base = tiffOffset + getUint32(data, valueOffset, littleEndian);
        const arr: string[] = [];
        for (let i = 0; i < Math.min(count, 4); i++) {
          const r = parseRational(data, base + i * 8, littleEndian);
          arr.push(r.toFixed(4));
        }
        value = arr.join(", ");
      }
    }
    // Type 1 = BYTE
    else if (type === 1) {
      if (count === 1) {
        value = String(data.getUint8(valueOffset));
      } else {
        const arr: number[] = [];
        for (let i = 0; i < Math.min(count, 4); i++) {
          arr.push(data.getUint8(valueOffset + i));
        }
        value = arr.join(", ");
      }
    } else {
      value = `[Type:${type}, Count:${count}]`;
    }
  } catch {
    value = "[解析失败]";
  }

  return { tag: `0x${tag.toString(16).toUpperCase().padStart(4, "0")}`, tagName, value };
}

/** Parse EXIF data from a JPEG ArrayBuffer */
function parseExif(buffer: ArrayBuffer): ExifEntry[] {
  const data = new DataView(buffer);
  const entries: ExifEntry[] = [];

  // Find APP1 marker (0xFFE1)
  let offset = 2; // Skip SOI marker
  while (offset < data.byteLength - 4) {
    const marker = data.getUint16(offset);
    if (marker === 0xffe1) {
      break;
    }
    if ((marker & 0xff00) !== 0xff00) break;
    const segLen = data.getUint16(offset + 2);
    offset += 2 + segLen;
  }

  if (offset >= data.byteLength - 4) return entries;

  const segLen = data.getUint16(offset + 2);
  // Check "Exif\x00\x00" header
  const exifHeader =
    String.fromCharCode(data.getUint8(offset + 4), data.getUint8(offset + 5), data.getUint8(offset + 6), data.getUint8(offset + 7)) === "Exif" &&
    data.getUint8(offset + 8) === 0 &&
    data.getUint8(offset + 9) === 0;

  if (!exifHeader) return entries;

  const tiffOffset = offset + 10;
  // Byte order
  const byteOrder = String.fromCharCode(data.getUint8(tiffOffset), data.getUint8(tiffOffset + 1));
  const littleEndian = byteOrder === "II";

  // Verify 0x002A
  const magic = getUint16(data, tiffOffset + 2, littleEndian);
  if (magic !== 0x002a) return entries;

  // IFD0 offset
  const ifd0Offset = tiffOffset + getUint32(data, tiffOffset + 4, littleEndian);

  function parseIFD(ifdOffset: number): void {
    if (ifdOffset < tiffOffset || ifdOffset >= data.byteLength - 2) return;
    const numEntries = getUint16(data, ifdOffset, littleEndian);
    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifdOffset + 2 + i * 12;
      if (entryOffset + 12 > data.byteLength) break;
      const entry = parseIFDEntry(data, entryOffset, tiffOffset, littleEndian);
      if (entry) entries.push(entry);
    }
  }

  // Parse IFD0
  parseIFD(ifd0Offset);

  // Find Exif IFD offset (tag 0x8769)
  const exifIFDEntry = entries.find((e) => e.tag === "0x8769");
  if (exifIFDEntry) {
    const exifIFDOffset = tiffOffset + parseInt(exifIFDEntry.value, 10);
    parseIFD(exifIFDOffset);
  }

  // Find GPS IFD offset (tag 0x8825)
  const gpsIFDEntry = entries.find((e) => e.tag === "0x8825");
  if (gpsIFDEntry) {
    const gpsIFDOffset = tiffOffset + parseInt(gpsIFDEntry.value, 10);
    parseIFD(gpsIFDOffset);
  }

  return entries;
}

/** Create a JPEG without EXIF data by stripping APP1 segment */
function stripExif(buffer: ArrayBuffer): Blob {
  const data = new DataView(buffer);
  const chunks: Uint8Array[] = [];

  // SOI marker
  chunks.push(new Uint8Array([0xff, 0xd8]));

  let offset = 2;
  while (offset < data.byteLength - 1) {
    const marker = data.getUint16(offset);
    // Skip APP1 (EXIF) marker
    if (marker === 0xffe1) {
      const segLen = data.getUint16(offset + 2);
      offset += 2 + segLen;
      continue;
    }
    // SOS marker — copy rest of file
    if (marker === 0xffda) {
      chunks.push(new Uint8Array(buffer, offset));
      break;
    }
    // Other markers — copy them
    if ((marker & 0xff00) === 0xff00) {
      const segLen = data.getUint16(offset + 2);
      chunks.push(new Uint8Array(buffer, offset, 2 + segLen));
      offset += 2 + segLen;
    } else {
      // Unknown, copy byte and advance
      chunks.push(new Uint8Array(buffer, offset, 1));
      offset += 1;
    }
  }

  return new Blob(chunks.map(c => c.buffer as ArrayBuffer), { type: "image/jpeg" });
}

export function ImageExifTool() {
  const [exifEntries, setExifEntries] = useState<ExifEntry[]>([]);
  const [fileName, setFileName] = useState("");
  const [imageBuffer, setImageBuffer] = useState<ArrayBuffer | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      setImageBuffer(buffer);
      setPreviewUrl(URL.createObjectURL(file));

      if (file.type === "image/jpeg") {
        const entries = parseExif(buffer);
        setExifEntries(entries);
      } else {
        setExifEntries([]);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleClearExif = useCallback(() => {
    if (!imageBuffer) return;
    const blob = stripExif(imageBuffer);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(/\.jpe?g$/i, "_no_exif.jpg");
    a.click();
    URL.revokeObjectURL(url);
  }, [imageBuffer, fileName]);

  const handleClear = useCallback(() => {
    setExifEntries([]);
    setFileName("");
    setImageBuffer(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
  }, [previewUrl]);

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
        }}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">点击或拖拽 JPEG 图片到此处上传</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {previewUrl && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileImage className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{fileName}</span>
            </div>
            <div className="flex gap-2">
              {fileName.match(/\.jpe?g$/i) && exifEntries.length > 0 && (
                <Button variant="secondary" size="sm" onClick={handleClearExif}>
                  <Download className="h-4 w-4 mr-1" /> 清除EXIF并下载
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleClear}>
                <Trash2 className="h-4 w-4 mr-1" /> 清空
              </Button>
            </div>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="预览"
            className="max-h-48 rounded-lg border border-border object-contain"
          />

          {fileName.match(/\.jpe?g$/i) ? (
            exifEntries.length > 0 ? (
              <Card>
                <CardContent className="p-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-1.5 px-2 font-medium text-muted-foreground">标签</th>
                          <th className="text-left py-1.5 px-2 font-medium text-muted-foreground">名称</th>
                          <th className="text-left py-1.5 px-2 font-medium text-muted-foreground">值</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exifEntries.map((entry, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-1.5 px-2 font-mono text-xs text-muted-foreground">{entry.tag}</td>
                            <td className="py-1.5 px-2">{entry.tagName}</td>
                            <td className="py-1.5 px-2 font-mono text-xs">{entry.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">该图片不包含 EXIF 信息</p>
            )
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">仅支持 JPEG 格式图片的 EXIF 读取</p>
          )}
        </div>
      )}
    </div>
  );
}
