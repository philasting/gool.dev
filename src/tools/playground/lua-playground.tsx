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
  Moon,
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

const WASMOON_ESM = "https://cdn.jsdelivr.net/npm/wasmoon@1.16.0/+esm";
const WASMOON_WASM_URL =
  "https://cdn.jsdelivr.net/npm/wasmoon@1.16.0/dist/glue.wasm";

const DEFAULT_LUA_CODE = `-- Lua 5.4 (wasmoon) 浏览器端运行
print("Hello, Lua!")

-- 表操作
local nums = {1, 2, 3, 4, 5}
local sum = 0
for i, v in ipairs(nums) do
  sum = sum + v
end
print("Sum:", sum)

-- 函数
local function factorial(n)
  if n <= 1 then return 1 end
  return n * factorial(n - 1)
end
print("5! =", factorial(5))

-- 字符串
print(string.format("Pi ≈ %.4f", math.pi))`;

// ─── Helper: dynamic import via Function to bypass TS static analysis ───

const dynamicImport = new Function(
  "url",
  "return import(url)"
) as (url: string) => Promise<Record<string, unknown>>;

// ─── Helper: format a Lua value for display ───

function formatLuaValue(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return String(v);
  if (v === null || v === undefined) return "nil";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

// ─── Component ───

export function LuaPlaygroundTool() {
  const [code, setCode] = useState<string>(DEFAULT_LUA_CODE);
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadStatus, setLoadStatus] = useState("正在加载 Lua...");
  const [execTime, setExecTime] = useState<number | null>(null);
  const [runtimeVersion, setRuntimeVersion] = useState<string>("");

  const luaRef = useRef<any>(null);

  // ─── Initialize Lua engine ───
  const initLua = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setLoadStatus("正在下载 Lua WASM (~1MB)...");

    try {
      // Step 1: Dynamically import wasmoon from CDN
      const mod = await dynamicImport(WASMOON_ESM);
      const LuaFactory = mod.LuaFactory as (new (
        customWasmUri?: string
      ) => {
        createEngine: () => Promise<any>;
      });

      // Step 2: Create Lua factory with WASM URL
      setLoadStatus("正在初始化 Lua...");
      const factory = new LuaFactory(WASMOON_WASM_URL);

      // Step 3: Create the Lua engine
      const lua = await factory.createEngine();

      luaRef.current = lua;
      // Get actual Lua version from runtime
      try {
        const ver = lua.global.get("_VERSION");
        const verStr = String(ver);
        const match = verStr.match(/[\d.]+/);
        if (match) setRuntimeVersion(match[0]);
      } catch {
        /* fallback to default */
      }
      setLoadStatus("Lua 就绪");
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
    void initLua();
  }, [initLua]);

  // ─── Run code ───
  const runCode = useCallback(async () => {
    if (!luaRef.current || running) return;
    setRunning(true);
    setOutput([]);
    setExecTime(null);

    const startTime = performance.now();
    const lines: OutputLine[] = [];
    const lua = luaRef.current;

    try {
      // Redirect print to capture output
      lua.global.set("print", (...args: unknown[]) => {
        const text = args.map(formatLuaValue).join("\t");
        lines.push({ type: "log", text });
      });

      // Redirect io.write to capture output
      lua.global.set("__js_io_write", (s: string) => {
        lines.push({ type: "log", text: s });
      });
      await lua.doString(`
        io.write = function(...)
          local args = {...}
          for _, v in ipairs(args) do
            __js_io_write(tostring(v))
          end
        end
      `);

      // Execute user code
      const result = await lua.doString(code);

      // Display the return value if present
      if (result !== undefined && result !== null) {
        lines.push({
          type: "result",
          text: `→ ${formatLuaValue(result)}`,
        });
      }

      setOutput(lines.length > 0 ? lines : [{ type: "log", text: "" }]);
    } catch (err) {
      lines.push({
        type: "error",
        text: err instanceof Error ? err.message : String(err),
      });
      setOutput([...lines]);
    } finally {
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
    setCode(DEFAULT_LUA_CODE);
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
              <h3 className="text-lg font-semibold mb-2">Lua 加载失败</h3>
              <p className="text-muted-foreground text-sm mb-4 max-w-md">
                {loadStatus}
              </p>
              <Button onClick={() => void initLua()}>
                <RotateCw className="h-4 w-4" />
                重新加载
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="h-10 w-10 text-cyan-500 animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">{loadStatus}</p>
              <p className="text-xs text-muted-foreground/60 mt-2">
                首次加载需要下载约 1MB 的 WASM 文件，请耐心等待
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
          <Moon className="h-3 w-3 text-cyan-500" />
          Lua {runtimeVersion || "5.4"} (wasmoon) 已就绪
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
            placeholder="-- 在此输入 Lua 代码..."
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
            Lua 使用提示
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• 纯浏览器端执行，代码不上传服务器</li>
            <li>• 支持标准库（string, math, table, io 等）</li>
            <li>• print / io.write 输出会被捕获</li>
            <li>• return 的值自动显示（蓝色 → 前缀）</li>
            <li>• print 多个参数用 Tab 分隔（Lua 标准行为）</li>
            <li>• Tab 键插入 2 空格，Ctrl+Enter 快捷运行</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
