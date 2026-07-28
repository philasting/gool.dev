"use client";

import { useState, useCallback } from "react";
import { Play, Trash2, FileCode2, Package, BookOpen, Copy, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/components/tool/ToolLayout";

// ─── Types ───

/** A single supported JS library definition */
interface JSLibrary {
  id: string;
  name: string;
  varName: string;
  cdnUrl: string;
  npmInstall: string;
  importCode: string;
  description: string;
  example: string;
}

/** A single captured console output line */
interface OutputLine {
  type: "log" | "error" | "warn" | "info";
  text: string;
}

// ─── Library registry (12 libraries) ───

const LIBRARIES: JSLibrary[] = [
  {
    id: "dayjs",
    name: "dayjs",
    varName: "dayjs",
    cdnUrl: "https://esm.sh/dayjs@1.11.13",
    npmInstall: "npm install dayjs",
    importCode: "import dayjs from 'dayjs'",
    description: "轻量级日期处理库",
    example:
      "console.log(dayjs().format('YYYY-MM-DD HH:mm:ss'));\nconsole.log(dayjs('2024-01-15').diff(dayjs('2024-01-01'), 'days'), '天');",
  },
  {
    id: "decimal",
    name: "decimal.js",
    varName: "Decimal",
    cdnUrl: "https://esm.sh/decimal.js@10.5.0",
    npmInstall: "npm install decimal.js",
    importCode: "import Decimal from 'decimal.js'",
    description: "高精度十进制运算库",
    example: "console.log(new Decimal(0.1).plus(0.2).toString()); // 0.3",
  },
  {
    id: "lodash",
    name: "lodash-es",
    varName: "_",
    cdnUrl: "https://esm.sh/lodash-es@4.17.21",
    npmInstall: "npm install lodash-es",
    importCode: "import _ from 'lodash-es'",
    description: "实用工具函数库",
    example: "console.log(_.chunk([1, 2, 3, 4, 5], 2));",
  },
  {
    id: "uuid",
    name: "uuid",
    varName: "uuid",
    cdnUrl: "https://esm.sh/uuid@10.0.0",
    npmInstall: "npm install uuid",
    importCode: "import { v4, v1 } from 'uuid'",
    description: "UUID 生成库",
    example: "console.log(uuid.v4());",
  },
  {
    id: "nanoid",
    name: "nanoid",
    varName: "nanoid",
    cdnUrl: "https://esm.sh/nanoid@5.0.7",
    npmInstall: "npm install nanoid",
    importCode: "import { nanoid } from 'nanoid'",
    description: "短唯一 ID 生成库",
    example: "console.log(nanoid.nanoid());",
  },
  {
    id: "qs",
    name: "qs",
    varName: "qs",
    cdnUrl: "https://esm.sh/qs@6.13.0",
    npmInstall: "npm install qs",
    importCode: "import qs from 'qs'",
    description: "URL 查询字符串解析库",
    example: "console.log(qs.parse('a=1&b=2'));",
  },
  {
    id: "mathjs",
    name: "mathjs",
    varName: "math",
    cdnUrl: "https://esm.sh/mathjs@13.2.0",
    npmInstall: "npm install mathjs",
    importCode: "import { create, all } from 'mathjs'",
    description: "数学表达式计算库",
    example: "console.log(math.evaluate('1.2 * (2 + 4.5)'));",
  },
  {
    id: "crypto-js",
    name: "crypto-js",
    varName: "CryptoJS",
    cdnUrl: "https://esm.sh/crypto-js@4.2.0",
    npmInstall: "npm install crypto-js",
    importCode: "import CryptoJS from 'crypto-js'",
    description: "加密哈希算法库",
    example: "console.log(CryptoJS.SHA256('hello').toString());",
  },
  {
    id: "big",
    name: "big.js",
    varName: "Big",
    cdnUrl: "https://esm.sh/big.js@6.2.2",
    npmInstall: "npm install big.js",
    importCode: "import Big from 'big.js'",
    description: "任意精度十进制运算库",
    example: "console.log(new Big(0.1).plus(0.2).toString()); // 0.3",
  },
  {
    id: "ajv",
    name: "ajv",
    varName: "Ajv",
    cdnUrl: "https://esm.sh/ajv@8.17.1",
    npmInstall: "npm install ajv",
    importCode: "import Ajv from 'ajv'",
    description: "JSON Schema 校验库",
    example:
      "const ajv = new Ajv();\nconsole.log(ajv.validate({ type: 'number' }, 42));",
  },
  {
    id: "chroma",
    name: "chroma-js",
    varName: "chroma",
    cdnUrl: "https://esm.sh/chroma-js@2.6.0",
    npmInstall: "npm install chroma-js",
    importCode: "import chroma from 'chroma-js'",
    description: "颜色操作与转换库",
    example: "console.log(chroma('#ff0000').darken().hex());",
  },
  {
    id: "marked",
    name: "marked",
    varName: "marked",
    cdnUrl: "https://esm.sh/marked@14.1.3",
    npmInstall: "npm install marked",
    importCode: "import { marked } from 'marked'",
    description: "Markdown 解析库",
    example: "console.log(marked.parse('# Hello'));",
  },
];

// ─── Default code ───

const DEFAULT_CODE = `// dayjs 已注入，可直接使用
console.log(dayjs().format('YYYY-MM-DD HH:mm:ss'));
console.log(dayjs('2024-01-15').diff(dayjs('2024-01-01'), 'days'), '天');`;

// ─── Helper: dynamic import via Function to bypass TS/webpack static analysis ───

/** Dynamically import a CDN ESM module at runtime, bypassing TypeScript module resolution and webpack static analysis. */
const dynamicImport = new Function("url", "return import(url)") as (url: string) => Promise<Record<string, unknown>>;

// ─── Component ───

export function JsPlaygroundTool() {
  const [selectedLibs, setSelectedLibs] = useState<string[]>(["dayjs"]);
  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [running, setRunning] = useState(false);
  const [execTime, setExecTime] = useState<number | null>(null);

  // ─── Library selection toggle ───
  const handleToggleLib = (libId: string) => {
    setSelectedLibs((prev) =>
      prev.includes(libId)
        ? prev.filter((id) => id !== libId)
        : [...prev, libId]
    );
  };

  // ─── Load example code based on selected libraries ───
  const handleLoadExample = () => {
    const examples = selectedLibs
      .map((id) => LIBRARIES.find((l) => l.id === id))
      .filter((lib): lib is JSLibrary => lib !== undefined)
      .map(
        (lib) =>
          `// ${lib.name} 已注入，可直接使用\n${lib.example}`
      );
    setCode(examples.join("\n\n") || DEFAULT_CODE);
  };

  // ─── Clear output ───
  const handleClear = () => {
    setOutput([]);
    setExecTime(null);
  };

  // ─── Tab key handler: insert two spaces instead of switching focus ───
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.setRangeText("  ", start, end, "end");
      setCode(textarea.value);
    }
    // Ctrl/Cmd + Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void runCode();
    }
  };

  // ─── Core execution function ───
  const runCode = useCallback(async () => {
    setRunning(true);
    setOutput([]);
    setExecTime(null);
    const startTime = performance.now();

    try {
      // 1. Dynamically import selected libraries from CDN
      const libs: Record<string, unknown> = {};
      for (const libId of selectedLibs) {
        const lib = LIBRARIES.find((l) => l.id === libId);
        if (!lib) continue;
        const mod = await dynamicImport(lib.cdnUrl);
        // Use default export if available, otherwise use the whole module namespace
        libs[lib.varName] = mod.default !== undefined ? mod.default : mod;
      }

      // 2. Build console capturer
      const lines: OutputLine[] = [];

      const formatArg = (arg: unknown): string => {
        if (typeof arg === "string") return arg;
        if (arg === undefined) return "undefined";
        if (arg === null) return "null";
        if (typeof arg === "function") return arg.toString();
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      };

      const fakeConsole = {
        log: (...args: unknown[]) =>
          lines.push({ type: "log" as const, text: args.map(formatArg).join(" ") }),
        error: (...args: unknown[]) =>
          lines.push({ type: "error" as const, text: args.map(formatArg).join(" ") }),
        warn: (...args: unknown[]) =>
          lines.push({ type: "warn" as const, text: args.map(formatArg).join(" ") }),
        info: (...args: unknown[]) =>
          lines.push({ type: "info" as const, text: args.map(formatArg).join(" ") }),
        table: (data: unknown) =>
          lines.push({ type: "log" as const, text: formatArg(data) }),
        dir: (obj: unknown) =>
          lines.push({ type: "log" as const, text: formatArg(obj) }),
      };

      // 3. Execute user code (supports await via async IIFE wrapper)
      const varNames = Object.keys(libs);
      const varValues = Object.values(libs);
      const fn = new Function(
        ...varNames,
        "console",
        `"use strict"; return (async () => {\n${code}\n})()`
      ) as (...args: unknown[]) => Promise<unknown>;

      // 4. Timeout protection (10 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("⏱ 执行超时（10秒限制）")),
          10000
        );
      });

      const result = await Promise.race([
        fn(...varValues, fakeConsole),
        timeoutPromise,
      ]);

      // 5. If the async IIFE returned a value, display it
      if (result !== undefined) {
        lines.push({ type: "log", text: "→ " + formatArg(result) });
      }

      setOutput(lines.length > 0 ? lines : [{ type: "log", text: "" }]);
    } catch (err) {
      setOutput([
        {
          type: "error",
          text: err instanceof Error ? err.message : String(err),
        },
      ]);
    } finally {
      setExecTime(Math.round(performance.now() - startTime));
      setRunning(false);
    }
  }, [selectedLibs, code]);

  // ─── Output line color helper ───
  const getOutputColor = (type: OutputLine["type"]): string => {
    switch (type) {
      case "error":
        return "text-red-500";
      case "warn":
        return "text-yellow-500";
      case "info":
        return "text-blue-500";
      default:
        return "text-foreground";
    }
  };

  // ─── Render ───
  return (
    <div className="space-y-4">
      {/* Library selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-cyan-500" />
            选择要注入的库（可多选）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {LIBRARIES.map((lib) => {
              const isSelected = selectedLibs.includes(lib.id);
              return (
                <Button
                  key={lib.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToggleLib(lib.id)}
                  className={cn(
                    "font-mono text-xs transition-all",
                    isSelected && "ring-2 ring-cyan-500/40"
                  )}
                >
                  {lib.name}
                </Button>
              );
            })}
          </div>
          {selectedLibs.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              已选中 {selectedLibs.length} 个库，将自动注入为同名变量
            </p>
          )}
        </CardContent>
      </Card>

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
            placeholder="// 选中的库已注入为同名变量，可直接使用..."
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
                点击执行按钮运行代码...
              </p>
            ) : (
              <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-all">
                {output.map((line, i) => (
                  <div key={i} className={cn("min-h-[1.25rem]", getOutputColor(line.type))}>
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
          {running ? "执行中..." : "执行代码"}
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

      {/* Tutorial section */}
      {selectedLibs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-cyan-500" />
              安装与使用教程
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedLibs
              .map((id) => LIBRARIES.find((l) => l.id === id))
              .filter((lib): lib is JSLibrary => lib !== undefined)
              .map((lib) => (
                <div
                  key={lib.id}
                  className="rounded-lg border border-border p-3 space-y-2"
                >
                  {/* Library header */}
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="font-mono text-xs">
                      {lib.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {lib.description}
                    </span>
                  </div>

                  {/* Install command */}
                  <CodeBlock
                    label="安装"
                    code={lib.npmInstall}
                  />

                  {/* Import statement */}
                  <CodeBlock
                    label="引入"
                    code={lib.importCode}
                  />

                  {/* Example code */}
                  <CodeBlock
                    label="示例"
                    code={lib.example}
                  />
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Reusable code block with copy button ───

interface CodeBlockProps {
  label: string;
  code: string;
}

function CodeBlock({ label, code }: CodeBlockProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => void copyToClipboard(code)}
        >
          <Copy className="h-3 w-3" />
          复制
        </Button>
      </div>
      <pre className="bg-muted/50 rounded-md p-2.5 text-xs font-mono overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}
