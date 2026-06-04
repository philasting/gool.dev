"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

type Algorithm = "SHA-1" | "SHA-256" | "SHA-512";

interface OtpEntry {
  id: string;
  name: string;
  secret: string;
  period: number;
  digits: 6 | 8;
  algorithm: Algorithm;
}

const STORAGE_KEY = "gotai-otp-entries";

function loadEntries(): OtpEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: OtpEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ─── Base32 Decode ───
function base32Decode(str: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const ch of str.toUpperCase().replace(/=+$/, "")) {
    const val = alphabet.indexOf(ch);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substring(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}

// ─── TOTP Generation (RFC 6238) ───
async function generateTOTP(
  secret: string,
  period: number,
  digits: 6 | 8,
  algorithm: Algorithm
): Promise<string> {
  const key = base32Decode(secret);
  const keyBuf = key.buffer as ArrayBuffer;
  const counter = Math.floor(Date.now() / 1000 / period);
  const counterBuf = new ArrayBuffer(8);
  new DataView(counterBuf).setBigUint64(0, BigInt(counter));

  const hashAlgo = algorithm === "SHA-1" ? "SHA-1" : algorithm === "SHA-256" ? "SHA-256" : "SHA-512";
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: hashAlgo },
    false,
    ["sign"]
  );
  const hmac = await crypto.subtle.sign("HMAC", cryptoKey, counterBuf);
  const hmacArr = new Uint8Array(hmac);
  const offset = hmacArr[hmacArr.length - 1] & 0x0f;
  const code =
    ((hmacArr[offset] & 0x7f) << 24) |
    ((hmacArr[offset + 1] & 0xff) << 16) |
    ((hmacArr[offset + 2] & 0xff) << 8) |
    (hmacArr[offset + 3] & 0xff);
  const otp = code % Math.pow(10, digits);
  return otp.toString().padStart(digits, "0");
}

function getTimeRemaining(period: number): number {
  return period - (Math.floor(Date.now() / 1000) % period);
}

export function OtpGeneratorTool() {
  const [entries, setEntries] = useState<OtpEntry[]>(loadEntries);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [timers, setTimers] = useState<Record<string, number>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newSecret, setNewSecret] = useState("");
  const [newPeriod, setNewPeriod] = useState(30);
  const [newDigits, setNewDigits] = useState<6 | 8>(6);
  const [newAlgorithm, setNewAlgorithm] = useState<Algorithm>("SHA-1");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Save to localStorage whenever entries change
  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  // Refresh codes every second
  useEffect(() => {
    const refresh = async () => {
      const newCodes: Record<string, string> = {};
      const newTimers: Record<string, number> = {};
      for (const entry of entries) {
        if (entry.secret.trim()) {
          try {
            newCodes[entry.id] = await generateTOTP(entry.secret, entry.period, entry.digits, entry.algorithm);
          } catch {
            newCodes[entry.id] = "------";
          }
        } else {
          newCodes[entry.id] = "------";
        }
        newTimers[entry.id] = getTimeRemaining(entry.period);
      }
      setCodes(newCodes);
      setTimers(newTimers);
    };

    refresh();
    intervalRef.current = setInterval(refresh, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [entries]);

  const addEntry = useCallback(() => {
    if (!newSecret.trim()) return;
    const id = `otp-${Date.now()}`;
    const entry: OtpEntry = {
      id,
      name: newName.trim() || "未命名",
      secret: newSecret.trim().replace(/\s/g, "").toUpperCase(),
      period: newPeriod,
      digits: newDigits,
      algorithm: newAlgorithm,
    };
    setEntries((prev) => [...prev, entry]);
    setNewName("");
    setNewSecret("");
  }, [newName, newSecret, newPeriod, newDigits, newAlgorithm]);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleCopy = async (code: string, id: string) => {
    if (code === "------") return;
    await copyToClipboard(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Saved OTP entries */}
      {entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry) => {
            const code = codes[entry.id] ?? "------";
            const remaining = timers[entry.id] ?? 0;
            const progress = entry.period > 0 ? ((entry.period - remaining) / entry.period) * 100 : 0;
            const isLow = remaining <= 5;

            return (
              <Card key={entry.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.algorithm} · {entry.period}s · {entry.digits} 位
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeEntry(entry.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className={`text-2xl font-mono tracking-widest ${isLow ? "text-red-500" : ""}`}>
                      {code.slice(0, 3)} {code.slice(3)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCopy(code, entry.id)}
                    >
                      {copiedId === entry.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <span className={`ml-auto text-sm font-mono ${isLow ? "text-red-500" : "text-muted-foreground"}`}>
                      {remaining}s
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isLow ? "bg-red-500" : "bg-primary"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add new entry */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-medium">添加密钥</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">名称</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例如：GitHub"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">密钥 (Base32)</Label>
              <Input
                value={newSecret}
                onChange={(e) => setNewSecret(e.target.value)}
                placeholder="例如：JBSWY3DPEHPK3PXP"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">时间步长（秒）</Label>
              <Select value={String(newPeriod)} onValueChange={(v) => setNewPeriod(Number(v))}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 秒</SelectItem>
                  <SelectItem value="60">60 秒</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">验证码位数</Label>
              <Select value={String(newDigits)} onValueChange={(v) => setNewDigits(Number(v) as 6 | 8)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 位</SelectItem>
                  <SelectItem value="8">8 位</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-sm">哈希算法</Label>
              <Select value={newAlgorithm} onValueChange={(v) => setNewAlgorithm(v as Algorithm)}>
                <SelectTrigger className="h-8 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SHA-1">SHA-1</SelectItem>
                  <SelectItem value="SHA-256">SHA-256</SelectItem>
                  <SelectItem value="SHA-512">SHA-512</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={addEntry} disabled={!newSecret.trim()} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> 添加
          </Button>
        </CardContent>
      </Card>

      {entries.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          请添加 Base32 密钥以生成 TOTP 验证码
        </p>
      )}
    </div>
  );
}
