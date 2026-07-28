"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Trash2,
  Loader2,
  Gem,
  Clock,
  AlertCircle,
  BookOpen,
  RotateCw,
  FileCode2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───

/** A single captured output line */
interface OutputLine {
  type: "log" | "error" | "result";
  text: string;
}

// ─── Constants ───

const RUBY_WASM_ESM =
  "https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@2.9.3-2.9.4/dist/browser/+esm";
const RUBY_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@ruby/4.0-wasm-wasi@2.9.3-2.9.4/dist/ruby+stdlib.wasm";

const DEFAULT_RUBY_CODE = `# Ruby 4.0 (ruby.wasm) 浏览器端运行
puts "Hello, Ruby!"

# 试试块和迭代器
[1, 2, 3, 4, 5].each { |n| puts "Number: #{n}" }

# 计算
puts "Sum: #{(1..100).sum}"
puts "Factorial: #{(1..10).reduce(:*)}"

# 字符串操作
name = "World"
puts "Hello, #{name}!".upcase`;

// ─── Helper: dynamic import via Function to bypass TS static analysis ───

const dynamicImport = new Function(
  "url",
  "return import(url)"
) as (url: string) => Promise<Record<string, unknown>>;

// ─── stdout/stderr capture ───
//
// ruby.wasm 2.9.x's DefaultRubyVM does NOT expose setStdout/setStderr.
// Instead it creates an internal console writer (z()) that captures
// `console.log` (stdout) and `console.warn` (stderr) **by reference** at
// initialization time. To intercept output we temporarily override
// console.log/warn *before* calling DefaultRubyVM, so z() captures our
// interceptors. We restore console immediately after init — the captured
// references persist for the VM's lifetime and route through these handlers.

let rubyStdoutHandler: ((text: string) => void) | null = null;
let rubyStderrHandler: ((text: string) => void) | null = null;

// ─── Helper: format output text into lines ───

/** Split text by newlines, removing trailing empty line, and return OutputLine array */
function splitToLines(
  text: string,
  type: "log" | "error"
): OutputLine[] {
  const parts = text.split("\n");
  if (parts.length > 1 && parts[parts.length - 1] === "") {
    parts.pop();
  }
  return parts.map((part) => ({ type, text: part }));
}

// ─── Component ───

export function RubyPlaygroundTool() {
  const [code, setCode] = useState<string>(DEFAULT_RUBY_CODE);
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadStatus, setLoadStatus] = useState("正在加载 Ruby...");
  const [execTime, setExecTime] = useState<number | null>(null);
  const [runtimeVersion, setRuntimeVersion] = useState<string>("");

  const vmRef = useRef<any>(null);

  // ─── Initialize Ruby VM ───
  const initRuby = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setLoadStatus("正在下载 Ruby 运行时 (~5MB)...");

    try {
      // Step 1: Dynamically import the ruby.wasm browser module from CDN
      const mod = await dynamicImport(RUBY_WASM_ESM);
      const DefaultRubyVM = mod.DefaultRubyVM as (
        module: WebAssembly.Module,
        options?: {
          consolePrint?: boolean;
          env?: Record<string, string>;
        }
      ) => Promise<{
        vm: any;
        wasi: any;
        instance: WebAssembly.Instance;
      }>;

      // Step 2: Fetch and compile the Ruby WASM binary
      setLoadStatus("正在编译 Ruby WASM...");
      const response = await fetch(RUBY_WASM_URL);
      const buffer = await response.arrayBuffer();
      const wasmModule = await WebAssembly.compile(buffer);

      // Step 3: Initialize the Ruby VM.
      // Override console.log/warn BEFORE DefaultRubyVM so its internal
      // console writer (z()) captures our interceptors as stdout/stderr.
      setLoadStatus("正在初始化 Ruby VM...");
      const origLog = console.log;
      const origWarn = console.warn;
      console.log = (...args: unknown[]) => {
        const text = args
          .map((a) => (typeof a === "string" ? a : String(a)))
          .join(" ");
        if (rubyStdoutHandler) rubyStdoutHandler(text);
      };
      console.warn = (...args: unknown[]) => {
        const text = args
          .map((a) => (typeof a === "string" ? a : String(a)))
          .join(" ");
        if (rubyStderrHandler) rubyStderrHandler(text);
      };
      try {
        const { vm } = await DefaultRubyVM(wasmModule, {
          consolePrint: true,
        });
        vmRef.current = vm;
      } finally {
        // Restore console — z() already captured our interceptors by reference
        console.log = origLog;
        console.warn = origWarn;
      }

      setLoadStatus("Ruby 就绪");
      // Get actual Ruby version from runtime
      try {
        const ver = vmRef.current?.eval("RUBY_VERSION");
        const verStr = ver?.toString?.() || String(ver);
        if (verStr) setRuntimeVersion(verStr);
      } catch {
        /* fallback to default */
      }
      setLoading(false);
    } catch (err) {
      setLoadError(true);
      setLoadStatus(
        `加载失败: ${err instanceof Error ? err.message : String(err)}`
      );
      setLoading(false);
    }
  }, []);

  // Run initialization on mount
  useEffect(() => {
    void initRuby();
  }, [initRuby]);

  // ─── Run code ───
  const runCode = useCallback(async () => {
    if (!vmRef.current || running) return;
    setRunning(true);
    setOutput([]);
    setExecTime(null);

    const startTime = performance.now();
    const lines: OutputLine[] = [];
    const vm = vmRef.current;

    try {
      // Route Ruby stdout/stderr through the interceptors captured at init
      rubyStdoutHandler = (text: string) => {
        lines.push(...splitToLines(text, "log"));
      };
      rubyStderrHandler = (text: string) => {
        lines.push(...splitToLines(text, "error"));
      };

      // Execute user code — prefer evalAsync (supports require "js" + await)
      let result: any;
      if (typeof vm.evalAsync === "function") {
        result = await vm.evalAsync(code);
      } else {
        result = vm.eval(code);
      }

      // Display the return value if it's not nil/undefined
      if (result !== undefined && result !== null) {
        let resultStr: string;
        try {
          resultStr = result.toString();
        } catch {
          resultStr = String(result);
        }
        if (resultStr && resultStr.trim()) {
          lines.push({ type: "result", text: `→ ${resultStr}` });
        }
      }

      setOutput(lines.length > 0 ? lines : [{ type: "log", text: "" }]);
    } catch (err) {
      lines.push({
        type: "error",
        text: err instanceof Error ? err.message : String(err),
      });
      setOutput([...lines]);
    } finally {
      rubyStdoutHandler = null;
      rubyStderrHandler = null;
      setExecTime(Math.round(performance.now() - startTime));
      setRunning(false);
    }
  }, [code, running]);

  // ─── Clear output ───
  const handleClear = () => {
    setOutput([]);
    setExecTime(null);
  };

  // ─── Load example code ───
  const handleLoadExample = () => {
    setCode(DEFAULT_RUBY_CODE);
  };

  // ─── Tab key handler: insert two spaces ───
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.setRangeText("  ", start, end, "end");
      setCode(textarea.value);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void runCode();
    }
  };

  // ─── Output line color helper ───
  const getOutputColor = (type: OutputLine["type"]): string => {
    switch (type) {
      case "error":
        return "text-red-500";
      case "result":
        return "text-blue-500";
      default:
        return "text-foreground";
    }
  };

  // ─── Loading state ───
  if (loading || loadError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          {loadError ? (
            <>
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ruby 加载失败</h3>
              <p className="text-muted-foreground text-sm mb-4 max-w-md">
                {loadStatus}
              </p>
              <Button onClick={() => void initRuby()}>
                <RotateCw className="h-4 w-4" />
                重新加载
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="h-10 w-10 text-cyan-500 animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">{loadStatus}</p>
              <p className="text-xs text-muted-foreground/60 mt-2">
                首次加载需要下载约 5MB 的 WASM 文件，请耐心等待
              </p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // ─── Render ───
  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <Gem className="h-3 w-3 text-cyan-500" />
          Ruby {runtimeVersion || "4.0"} (ruby.wasm) 已就绪
        </Badge>
      </div>

      {/* Code editor + Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Code editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">
              代码编辑器
            </label>
            <Badge variant="secondary" className="text-xs">
              Ctrl+Enter 运行
            </Badge>
          </div>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="# 在此输入 Ruby 代码..."
            className="min-h-[300px] font-mono text-sm leading-relaxed resize-y"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">
              输出结果
            </label>
            {execTime !== null && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Clock className="h-3 w-3" />
                {execTime}ms
              </Badge>
            )}
          </div>
          <div className="min-h-[300px] rounded-lg border border-input bg-muted/30 p-3 overflow-auto">
            {output.length === 0 ? (
              <p className="text-sm text-muted-foreground/50 font-mono">
                点击运行按钮执行代码...
              </p>
            ) : (
              <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-all">
                {output.map((line, i) => (
                  <div
                    key={i}
                    className={cn(
                      "min-h-[1.25rem]",
                      getOutputColor(line.type)
                    )}
                  >
                    {line.text === "" ? "\u00A0" : `> ${line.text}`}
                  </div>
                ))}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void runCode()} disabled={running}>
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {running ? "执行中..." : "运行代码"}
        </Button>
        <Button variant="outline" onClick={handleClear} disabled={running}>
          <Trash2 className="h-4 w-4" />
          清空
        </Button>
        <Button variant="outline" onClick={handleLoadExample} disabled={running}>
          <FileCode2 className="h-4 w-4" />
          加载示例
        </Button>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-cyan-500" />
            Ruby 使用提示
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• 纯浏览器端执行，代码不上传服务器</li>
            <li>• 支持标准库（require "json" 等）</li>
            <li>• puts / print / warn 输出会被捕获</li>
            <li>• 最后一个表达式的值自动显示（蓝色 → 前缀）</li>
            <li>• 支持通过 require "js" 调用 JavaScript API</li>
            <li>• Tab 键插入 2 空格，Ctrl+Enter 快捷运行</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
