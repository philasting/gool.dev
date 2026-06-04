"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Timer } from "lucide-react";

interface CountdownItem {
  id: string;
  name: string;
  targetDate: string;
}

const STORAGE_KEY = "gotai-countdown-items";

function loadItems(): CountdownItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: CountdownItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

interface TimeRemaining {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

function calcRemaining(targetDate: string): TimeRemaining {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;
  const isPast = diff < 0;
  const absDiff = Math.abs(diff);

  const totalMs = diff;
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

  return { totalMs, days, hours, minutes, seconds, isPast };
}

export function CountdownTimerTool() {
  const [items, setItems] = useState<CountdownItem[]>(loadItems);
  const [remainingMap, setRemainingMap] = useState<Record<string, TimeRemaining>>({});
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    saveItems(items);
  }, [items]);

  useEffect(() => {
    const update = () => {
      const map: Record<string, TimeRemaining> = {};
      for (const item of items) {
        map[item.id] = calcRemaining(item.targetDate);
      }
      setRemainingMap(map);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [items]);

  const addItem = useCallback(() => {
    if (!newDate) return;
    const id = `cd-${Date.now()}`;
    const item: CountdownItem = {
      id,
      name: newName.trim() || "未命名倒计时",
      targetDate: newDate,
    };
    setItems((prev) => [...prev, item]);
    setNewName("");
    setNewDate("");
  }, [newName, newDate]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <div className="space-y-4">
      {/* Countdown list */}
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => {
            const r = remainingMap[item.id];
            if (!r) return null;
            return (
              <Card key={item.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        目标: {new Date(item.targetDate).toLocaleString("zh-CN")}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.isPast ? (
                      <p className="text-lg font-semibold text-muted-foreground">
                        已过去 <span className="text-foreground">{r.days}</span> 天 <span className="text-foreground">{r.hours}</span> 时 <span className="text-foreground">{r.minutes}</span> 分 <span className="text-foreground">{r.seconds}</span> 秒
                      </p>
                    ) : (
                      <p className="text-lg font-semibold">
                        距目标还有 <span className="text-primary">{r.days}</span> 天 <span className="text-primary">{r.hours}</span> 时 <span className="text-primary">{r.minutes}</span> 分 <span className="text-primary">{r.seconds}</span> 秒
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add new countdown */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-medium">添加倒计时</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">名称</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例如：项目截止日"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">目标日期时间</Label>
              <Input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addItem} disabled={!newDate} className="w-full h-8">
                <Plus className="h-4 w-4 mr-1" /> 添加
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {items.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          请添加倒计时目标日期
        </p>
      )}
    </div>
  );
}
