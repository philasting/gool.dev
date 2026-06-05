"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft, RefreshCw, AlertCircle } from "lucide-react";

interface CurrencyInfo {
  code: string;
  name: string;
  flag: string;
}

const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", name: "美元", flag: "🇺🇸" },
  { code: "CNY", name: "人民币", flag: "🇨🇳" },
  { code: "EUR", name: "欧元", flag: "🇪🇺" },
  { code: "JPY", name: "日元", flag: "🇯🇵" },
  { code: "GBP", name: "英镑", flag: "🇬🇧" },
  { code: "KRW", name: "韩元", flag: "🇰🇷" },
  { code: "HKD", name: "港币", flag: "🇭🇰" },
  { code: "TWD", name: "新台币", flag: "🇹🇼" },
  { code: "AUD", name: "澳元", flag: "🇦🇺" },
  { code: "CAD", name: "加元", flag: "🇨🇦" },
  { code: "CHF", name: "瑞士法郎", flag: "🇨🇭" },
  { code: "SGD", name: "新加坡元", flag: "🇸🇬" },
  { code: "NZD", name: "新西兰元", flag: "🇳🇿" },
  { code: "THB", name: "泰铢", flag: "🇹🇭" },
  { code: "MYR", name: "马来西亚令吉", flag: "🇲🇾" },
  { code: "INR", name: "印度卢比", flag: "🇮🇳" },
  { code: "RUB", name: "俄罗斯卢布", flag: "🇷🇺" },
  { code: "BRL", name: "巴西雷亚尔", flag: "🇧🇷" },
  { code: "MXN", name: "墨西哥比索", flag: "🇲🇽" },
  { code: "ZAR", name: "南非兰特", flag: "🇿🇦" },
  { code: "SEK", name: "瑞典克朗", flag: "🇸🇪" },
  { code: "DKK", name: "丹麦克朗", flag: "🇩🇰" },
  { code: "NOK", name: "挪威克朗", flag: "🇳🇴" },
  { code: "PLN", name: "波兰兹罗提", flag: "🇵🇱" },
];

// Fallback static rates (relative to USD)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  CNY: 7.24,
  EUR: 0.92,
  JPY: 155.5,
  GBP: 0.79,
  KRW: 1345,
  HKD: 7.82,
  TWD: 32.5,
  AUD: 1.53,
  CAD: 1.37,
  CHF: 0.88,
  SGD: 1.34,
  NZD: 1.67,
  THB: 35.8,
  MYR: 4.72,
  INR: 83.5,
  RUB: 92.5,
  BRL: 5.05,
  MXN: 17.15,
  ZAR: 18.6,
  SEK: 10.72,
  DKK: 6.88,
  NOK: 10.82,
  PLN: 3.98,
};

const CACHE_KEY = "gool-exchange-rates";
const CACHE_TIMESTAMP_KEY = "gool-exchange-rates-ts";
const CACHE_DURATION = 3600000; // 1 hour

type FetchStatus = "idle" | "loading" | "success" | "error";

export function ExchangeRateTool() {
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle");
  const [leftCurrency, setLeftCurrency] = useState("CNY");
  const [rightCurrency, setRightCurrency] = useState("USD");
  const [leftAmount, setLeftAmount] = useState("100");
  const [rightAmount, setRightAmount] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Load cached rates on mount
  useEffect(() => {
    const loadCached = () => {
      try {
        const cachedRates = localStorage.getItem(CACHE_KEY);
        const cachedTs = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        if (cachedRates && cachedTs) {
          const ts = Number(cachedTs);
          if (Date.now() - ts < CACHE_DURATION) {
            setRates(JSON.parse(cachedRates));
            setFetchStatus("success");
            setLastUpdated(new Date(ts).toLocaleString("zh-CN"));
            return;
          }
        }
      } catch {
        // Ignore parse errors
      }
      // No valid cache, fetch
      fetchRates();
    };
    loadCached();
  }, []);

  const fetchRates = useCallback(async () => {
    setFetchStatus("loading");
    try {
      const resp = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!resp.ok) throw new Error("API 请求失败");
      const data = await resp.json();
      if (data.rates && typeof data.rates === "object") {
        const newRates: Record<string, number> = { USD: 1, ...data.rates };
        setRates(newRates);
        localStorage.setItem(CACHE_KEY, JSON.stringify(newRates));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()));
        setLastUpdated(new Date().toLocaleString("zh-CN"));
        setFetchStatus("success");
      } else {
        throw new Error("数据格式错误");
      }
    } catch {
      setRates(FALLBACK_RATES);
      setFetchStatus("error");
      setLastUpdated("使用内置汇率");
    }
  }, []);

  // Calculate conversions
  const convertAmount = useCallback(
    (amount: number, from: string, to: string): number => {
      const fromRate = rates[from];
      const toRate = rates[to];
      if (!fromRate || !toRate || fromRate === 0) return 0;
      return (amount / fromRate) * toRate;
    },
    [rates]
  );

  // When left amount changes, compute right
  useEffect(() => {
    const num = Number(leftAmount);
    if (Number.isNaN(num) || num === 0) {
      setRightAmount("");
      return;
    }
    const result = convertAmount(num, leftCurrency, rightCurrency);
    setRightAmount(result.toFixed(4));
  }, [leftAmount, leftCurrency, rightCurrency, convertAmount]);

  const handleRightChange = (value: string) => {
    setRightAmount(value);
    const num = Number(value);
    if (Number.isNaN(num) || num === 0) {
      setLeftAmount("");
      return;
    }
    const result = convertAmount(num, rightCurrency, leftCurrency);
    setLeftAmount(result.toFixed(4));
  };

  const swapCurrencies = () => {
    setLeftCurrency(rightCurrency);
    setRightCurrency(leftCurrency);
    setLeftAmount(rightAmount);
  };

  const leftCurrencyInfo = useMemo(() => CURRENCIES.find((c) => c.code === leftCurrency), [leftCurrency]);
  const rightCurrencyInfo = useMemo(() => CURRENCIES.find((c) => c.code === rightCurrency), [rightCurrency]);

  return (
    <div className="space-y-4">
      {fetchStatus === "error" && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700">汇率获取失败，当前使用内置参考汇率，仅供参考</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Left currency */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Select value={leftCurrency} onValueChange={(v) => { if (v !== null) setLeftCurrency(v); }}>
                <SelectTrigger className="w-48 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.flag} {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              type="number"
              value={leftAmount}
              onChange={(e) => setLeftAmount(e.target.value)}
              placeholder="输入金额"
              className="text-lg font-mono h-12"
            />
          </div>

          {/* Swap button */}
          <div className="flex justify-center">
            <Button variant="outline" size="icon" onClick={swapCurrencies} className="rounded-full h-10 w-10">
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Right currency */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Select value={rightCurrency} onValueChange={(v) => { if (v !== null) setRightCurrency(v); }}>
                <SelectTrigger className="w-48 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.flag} {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              type="number"
              value={rightAmount}
              onChange={(e) => handleRightChange(e.target.value)}
              placeholder="输入金额"
              className="text-lg font-mono h-12"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {lastUpdated ? `汇率更新: ${lastUpdated}` : "正在获取汇率..."}
        </p>
        <Button variant="ghost" size="sm" onClick={fetchRates} disabled={fetchStatus === "loading"}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${fetchStatus === "loading" ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>

      {/* Rate display */}
      {leftCurrencyInfo && rightCurrencyInfo && rates[leftCurrency] && rates[rightCurrency] && (
        <p className="text-xs text-muted-foreground text-center">
          1 {leftCurrency} = {convertAmount(1, leftCurrency, rightCurrency).toFixed(4)} {rightCurrency} · 1 {rightCurrency} = {convertAmount(1, rightCurrency, leftCurrency).toFixed(4)} {leftCurrency}
        </p>
      )}
    </div>
  );
}
