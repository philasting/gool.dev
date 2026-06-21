"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Trash2, Loader2, Languages } from "lucide-react";
import { toast } from "sonner";
import { s2t, t2s } from "./zh-trans-dict";

// ─── Types ────────────────────────────────────────────────────────────────

type Lang = "zh-Hans" | "zh-Hant" | "en";

interface LangConfig {
  label: string;
  flag: string;
  placeholder: string;
}

// ─── Constants ────────────────────────────────────────────────────────────

const LANGS: Lang[] = ["zh-Hans", "zh-Hant", "en"];

const LANG_CONFIG: Record<Lang, LangConfig> = {
  "zh-Hans": {
    label: "简体中文",
    flag: "🇨🇳",
    placeholder: "输入简体中文，自动翻译为繁体中文和英文…",
  },
  "zh-Hant": {
    label: "繁體中文",
    flag: "🇹🇼",
    placeholder: "輸入繁體中文，自動翻譯為簡體中文和英文…",
  },
  en: {
    label: "English",
    flag: "🇬🇧",
    placeholder: "Type English, auto-translate to Chinese…",
  },
};

// ─── Translation Logic ────────────────────────────────────────────────────

/**
 * Translate text from one language to another.
 *
 * - zh-Hans ↔ zh-Hant: local character conversion (instant, no network)
 * - zh ↔ en: MyMemory translation API (free, CORS-enabled, no API key)
 * - zh-Hant ↔ en: routed through zh-Hans for the API call, then
 *   locally converted to/from traditional
 */
async function translateText(
  text: string,
  from: Lang,
  to: Lang,
  signal?: AbortSignal
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return "";

  // Local simplified ↔ traditional conversion
  if (from === "zh-Hans" && to === "zh-Hant") {
    return s2t(text);
  }
  if (from === "zh-Hant" && to === "zh-Hans") {
    return t2s(text);
  }

  // Determine API source text and language codes
  let apiText = text;
  let sourceCode: string;
  let targetCode: string;

  if (from === "zh-Hant") {
    apiText = t2s(text); // convert to simplified for better API support
    sourceCode = "zh-CN";
  } else if (from === "zh-Hans") {
    sourceCode = "zh-CN";
  } else {
    sourceCode = "en";
  }

  if (to === "zh-Hant") {
    targetCode = "zh-CN"; // will convert to traditional after API
  } else if (to === "zh-Hans") {
    targetCode = "zh-CN";
  } else {
    targetCode = "en";
  }

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(apiText)}&langpair=${sourceCode}|${targetCode}`;
  const res = await fetch(url, { signal });

  if (!res.ok) {
    throw new Error(`翻译请求失败 (HTTP ${res.status})`);
  }

  const data = await res.json();

  if (data.responseStatus !== 200 && data.responseData?.translatedText == null) {
    throw new Error(data.responseDetails || "翻译服务返回错误");
  }

  let result: string = data.responseData.translatedText || "";

  // Handle HTML entity decoding (MyMemory sometimes returns encoded chars)
  result = decodeEntities(result);

  // Post-process: convert to traditional if target is zh-Hant
  if (to === "zh-Hant") {
    result = s2t(result);
  }

  return result;
}

/** Decode common HTML entities that MyMemory may return. */
function decodeEntities(text: string): string {
  const textarea = typeof document !== "undefined" ? document.createElement("textarea") : null;
  if (textarea) {
    textarea.innerHTML = text;
    return textarea.value;
  }
  // Fallback for SSR
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// ─── Hook: Debounce ───────────────────────────────────────────────────────

function useDebouncedCallback<T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number
): (...args: T) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: T) => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

// ─── Sub-component: Language Column ───────────────────────────────────────

interface LangColumnProps {
  lang: Lang;
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
  copied: boolean;
  onCopy: () => void;
  onClear: () => void;
}

function LangColumn({
  lang,
  value,
  onChange,
  loading,
  copied,
  onCopy,
  onClear,
}: LangColumnProps) {
  const config = LANG_CONFIG[lang];
  const charCount = value.length;

  return (
    <Card className="flex flex-col">
      <CardContent className="p-3 flex flex-col flex-1 gap-2">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{config.flag}</span>
            <span className="text-sm font-semibold">{config.label}</span>
            {loading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onCopy}
              disabled={!value}
              title="复制"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClear}
              disabled={!value}
              title="清空"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Textarea */}
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          className="min-h-[180px] flex-1 text-sm resize-none"
        />

        {/* Footer: char count */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{charCount} 字符</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export function ZhTransTool() {
  const [hansText, setHansText] = useState("");
  const [hantText, setHantText] = useState("");
  const [enText, setEnText] = useState("");
  const [loadingLangs, setLoadingLangs] = useState<Set<Lang>>(new Set());
  const [copiedLang, setCopiedLang] = useState<Lang | null>(null);

  // Track which language the user is currently editing
  const editingLangRef = useRef<Lang | null>(null);
  // Track the latest input to avoid race conditions
  const latestInputRef = useRef<{ lang: Lang; text: string } | null>(null);
  // Abort controller for in-flight requests
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Perform translation from the given source language to the other two.
   * Uses local conversion for zh↔zh and MyMemory API for zh↔en.
   */
  const doTranslate = useCallback(
    async (source: Lang, text: string) => {
      const targets = LANGS.filter((l) => l !== source);

      if (!text.trim()) {
        // Clear target fields when source is empty
        if (source !== "zh-Hans") setHansText("");
        if (source !== "zh-Hant") setHantText("");
        if (source !== "en") setEnText("");
        return;
      }

      // Set loading state for all targets
      setLoadingLangs(new Set(targets));

      // Abort any previous in-flight requests
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const results = await Promise.all(
          targets.map((target) => translateText(text, source, target, controller.signal))
        );

        // Only apply results if this request is still the latest
        if (
          latestInputRef.current?.lang !== source ||
          latestInputRef.current?.text !== text
        ) {
          return;
        }

        targets.forEach((target, i) => {
          const value = results[i];
          if (target === "zh-Hans") setHansText(value);
          else if (target === "zh-Hant") setHantText(value);
          else if (target === "en") setEnText(value);
        });
      } catch (err) {
        // Ignore abort errors
        if (err instanceof DOMException && err.name === "AbortError") return;
        toast.error("翻译失败，请稍后重试", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setLoadingLangs(new Set());
      }
    },
    []
  );

  // Debounced translate function
  const debouncedTranslate = useDebouncedCallback(
    (source: Lang, text: string) => {
      doTranslate(source, text);
    },
    600
  );

  /** Handle user input in a specific language column. */
  const handleInputChange = useCallback(
    (lang: Lang, value: string) => {
      // Update the source field immediately
      if (lang === "zh-Hans") setHansText(value);
      else if (lang === "zh-Hant") setHantText(value);
      else setEnText(value);

      // Track the latest edit
      editingLangRef.current = lang;
      latestInputRef.current = { lang, text: value };

      // Trigger debounced translation
      debouncedTranslate(lang, value);
    },
    [debouncedTranslate]
  );

  /** Copy text from a column to clipboard. */
  const handleCopy = useCallback(
    async (lang: Lang, text: string) => {
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        toast.success("已复制到剪贴板");
        setCopiedLang(lang);
        setTimeout(() => setCopiedLang(null), 2000);
      } catch {
        toast.error("复制失败");
      }
    },
    []
  );

  /** Clear a specific column. */
  const handleClear = useCallback((lang: Lang) => {
    if (lang === "zh-Hans") setHansText("");
    else if (lang === "zh-Hant") setHantText("");
    else setEnText("");
    editingLangRef.current = null;
    latestInputRef.current = null;
  }, []);

  /** Clear all columns. */
  const handleClearAll = useCallback(() => {
    setHansText("");
    setHantText("");
    setEnText("");
    editingLangRef.current = null;
    latestInputRef.current = null;
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setLoadingLangs(new Set());
  }, []);

  const totalChars = hansText.length + hantText.length + enText.length;
  const hasAnyText = totalChars > 0;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            任意一栏输入，其余两栏自动翻译（防抖 600ms）
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasAnyText && (
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              全部清空
            </Button>
          )}
        </div>
      </div>

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <LangColumn
          lang="zh-Hans"
          value={hansText}
          onChange={(v) => handleInputChange("zh-Hans", v)}
          loading={loadingLangs.has("zh-Hans")}
          copied={copiedLang === "zh-Hans"}
          onCopy={() => handleCopy("zh-Hans", hansText)}
          onClear={() => handleClear("zh-Hans")}
        />
        <LangColumn
          lang="zh-Hant"
          value={hantText}
          onChange={(v) => handleInputChange("zh-Hant", v)}
          loading={loadingLangs.has("zh-Hant")}
          copied={copiedLang === "zh-Hant"}
          onCopy={() => handleCopy("zh-Hant", hantText)}
          onClear={() => handleClear("zh-Hant")}
        />
        <LangColumn
          lang="en"
          value={enText}
          onChange={(v) => handleInputChange("en", v)}
          loading={loadingLangs.has("en")}
          copied={copiedLang === "en"}
          onCopy={() => handleCopy("en", enText)}
          onClear={() => handleClear("en")}
        />
      </div>

      {/* Footer: attribution + stats */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            简繁转换：本地字典
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            中英翻译：MyMemory API
          </Badge>
        </div>
        <span>由 MyMemory 提供翻译服务</span>
      </div>
    </div>
  );
}
