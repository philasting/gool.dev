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
  Package,
  CheckCircle2,
  BookOpen,
  Clock,
  FileCode2,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───

/** A single captured output line */
interface OutputLine {
  type: "log" | "error" | "warn" | "result";
  text: string;
}

/** A Pyodide-loadable package definition */
interface PyodidePackage {
  id: string;
  name: string;
  desc: string;
  example: string;
}

// ─── Pyodide packages (10 packages) ───

const PYODIDE_PACKAGES: PyodidePackage[] = [
  {
    id: "numpy",
    name: "NumPy",
    desc: "科学计算基础库",
    example:
      "import numpy as np\n\n# NumPy 已加载，直接使用\nprint(np.pi)\nprint(np.arange(10))\nprint(np.array([[1, 2], [3, 4]]).T)\nprint('Mean:', np.mean([1, 2, 3, 4, 5]))",
  },
  {
    id: "pandas",
    name: "Pandas",
    desc: "数据分析处理",
    example:
      "import pandas as pd\n\ndf = pd.DataFrame({'name': ['Alice', 'Bob'], 'age': [25, 30]})\nprint(df)\nprint(df.describe())",
  },
  {
    id: "matplotlib",
    name: "Matplotlib",
    desc: "图表绘制（需 Agg 后端）",
    example:
      "import matplotlib\nmatplotlib.use('Agg')\nimport matplotlib.pyplot as plt\nimport numpy as np\n\nx = np.linspace(0, 10, 100)\nplt.plot(x, np.sin(x))\nplt.savefig('plot.png')\nprint('图表已保存到 plot.png')",
  },
  {
    id: "scikit-learn",
    name: "scikit-learn",
    desc: "机器学习",
    example:
      "from sklearn.linear_model import LinearRegression\nimport numpy as np\n\nX = np.array([[1],[2],[3],[4]])\ny = np.array([2, 4, 6, 8])\nmodel = LinearRegression().fit(X, y)\nprint(f'预测 x=5: {model.predict([[5]])[0]:.1f}')",
  },
  {
    id: "sympy",
    name: "SymPy",
    desc: "符号数学",
    example:
      "from sympy import *\n\nx = symbols('x')\nprint(integrate(x**2, x))\nprint(diff(x**3, x))\nprint(solve(x**2 - 4, x))",
  },
  {
    id: "scipy",
    name: "SciPy",
    desc: "科学计算高级库",
    example:
      "from scipy import stats\nimport numpy as np\n\ndata = np.random.normal(0, 1, 100)\nprint('Mean:', np.mean(data))\nprint('Std:', np.std(data))",
  },
  {
    id: "beautifulsoup4",
    name: "BeautifulSoup4",
    desc: "HTML/XML 解析",
    example:
      "from bs4 import BeautifulSoup\n\nhtml = '<ul><li>A</li><li>B</li></ul>'\nsoup = BeautifulSoup(html, 'html.parser')\nprint([li.text for li in soup.find_all('li')])",
  },
  {
    id: "pyyaml",
    name: "PyYAML",
    desc: "YAML 解析",
    example:
      "import yaml\n\ndata = yaml.safe_load('name: Alice\\nage: 25')\nprint(data)\nprint(yaml.dump(data))",
  },
  {
    id: "regex",
    name: "regex",
    desc: "增强正则表达式",
    example:
      "import regex\n\nprint(regex.findall(r'\\w+', 'Hello, World 123'))\nprint(regex.match(r'(?<word>\\w+)', 'hello').group('word'))",
  },
  {
    id: "micropip",
    name: "micropip",
    desc: "安装纯 Python PyPI 包",
    example:
      "import micropip\nawait micropip.install('parse')\nimport parse\nprint(parse.parse('Hello {}', 'Hello World')[0])",
  },
];

// ─── Default code ───

const DEFAULT_CODE = `# Pyodide: 浏览器端 Python 运行环境
# 点击上方包名加载 NumPy/Pandas 等第三方库

import sys
print(f"Python {sys.version.split()[0]}")
print(f"平台: {sys.platform}")

# 列表推导
squares = [x**2 for x in range(10)]
print(f"平方数: {squares}")

# 字典与 f-string
info = {"name": "Alice", "age": 25, "city": "北京"}
for k, v in info.items():
    print(f"  {k}: {v}")

# 顶层 await
import asyncio
await asyncio.sleep(0.1)
print("异步执行完成!")`;

// ─── Constants ───

const PYODIDE_VERSION = "v314.0.3";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full`;

// ─── Helper: format Pyodide result ───

/** Format a Pyodide result value for display */
function formatPyodideResult(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v === null) return "None";
  if (v === undefined) return "";

  // Pyodide proxy objects have a toJs() method
  if (v && typeof (v as any).toJs === "function") {
    try {
      const jsVal = (v as any).toJs();
      // Python dict -> JS Map, list -> Array, etc.
      if (jsVal instanceof Map) {
        return JSON.stringify(Object.fromEntries(jsVal), null, 2);
      }
      if (jsVal instanceof Set) {
        return JSON.stringify(Array.from(jsVal), null, 2);
      }
      return JSON.stringify(jsVal, null, 2);
    } catch {
      // Fall through to String(v)
    }
  }

  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

// ─── Component ───

export function PythonPlaygroundTool() {
  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadStatus, setLoadStatus] = useState("正在加载 Pyodide...");
  const [loadedPackages, setLoadedPackages] = useState<Set<string>>(
    new Set()
  );
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null);
  const [execTime, setExecTime] = useState<number | null>(null);

  const pyodideRef = useRef<any>(null);

  // ─── Initialize Pyodide ───
  const initPyodide = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setLoadStatus("正在下载 Pyodide 运行时 (~10MB)...");

    try {
      // Step 1: Dynamically inject the Pyodide script
      await new Promise<void>((resolve, reject) => {
        if ((window as any).loadPyodide) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = `${PYODIDE_CDN}/pyodide.js`;
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("Pyodide 脚本加载失败，请检查网络连接"));
        document.head.appendChild(script);
      });

      // Step 2: Initialize the Python interpreter
      setLoadStatus("正在初始化 Python 解释器...");
      const pyodide = await (window as any).loadPyodide({
        indexURL: `${PYODIDE_CDN}/`,
      });

      pyodideRef.current = pyodide;
      setLoadStatus("Pyodide 就绪");
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
    void initPyodide();
  }, [initPyodide]);

  // ─── Load a package ───
  const handleLoadPackage = async (pkgId: string) => {
    if (!pyodideRef.current || loadedPackages.has(pkgId) || loadingPkg) return;
    setLoadingPkg(pkgId);
    try {
      await pyodideRef.current.loadPackage(pkgId);
      setLoadedPackages((prev) => new Set(prev).add(pkgId));
    } catch (err) {
      setOutput([
        {
          type: "error",
          text: `加载 ${pkgId} 失败: ${
            err instanceof Error ? err.message : String(err)
          }`,
        },
      ]);
    } finally {
      setLoadingPkg(null);
    }
  };

  // ─── Run code ───
  const runCode = useCallback(async () => {
    if (!pyodideRef.current || running) return;
    setRunning(true);
    setOutput([]);
    setExecTime(null);

    const startTime = performance.now();
    const lines: OutputLine[] = [];

    // Redirect stdout/stderr to capture output
    pyodideRef.current.setStdout({
      batched: (text: string) => {
        // Split by newlines and push each line
        const parts = text.split("\n");
        // Remove trailing empty element if text ends with \n
        if (parts.length > 1 && parts[parts.length - 1] === "") {
          parts.pop();
        }
        parts.forEach((part) => lines.push({ type: "log", text: part }));
      },
    });
    pyodideRef.current.setStderr({
      batched: (text: string) => {
        const parts = text.split("\n");
        if (parts.length > 1 && parts[parts.length - 1] === "") {
          parts.pop();
        }
        parts.forEach((part) => lines.push({ type: "error", text: part }));
      },
    });

    try {
      const result = await pyodideRef.current.runPythonAsync(code);
      if (result !== undefined) {
        lines.push({
          type: "result",
          text: `→ ${formatPyodideResult(result)}`,
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
    if (loadedPackages.size > 0) {
      // Load example for the first loaded package
      const firstPkg = PYODIDE_PACKAGES.find((p) =>
        loadedPackages.has(p.id)
      );
      if (firstPkg) {
        setCode(firstPkg.example);
        return;
      }
    }
    setCode(DEFAULT_CODE);
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
      case "warn":
        return "text-yellow-500";
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
              <h3 className="text-lg font-semibold mb-2">Pyodide 加载失败</h3>
              <p className="text-muted-foreground text-sm mb-4 max-w-md">
                {loadStatus}
              </p>
              <Button onClick={() => void initPyodide()}>
                <RotateCw className="h-4 w-4" />
                重新加载
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="h-10 w-10 text-cyan-500 animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">{loadStatus}</p>
              <p className="text-xs text-muted-foreground/60 mt-2">
                首次加载需要下载约 10MB 的 WASM 文件，请耐心等待
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
      {/* Package selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-cyan-500" />
            可加载的包（可选，点击加载）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {PYODIDE_PACKAGES.map((pkg) => {
              const isLoaded = loadedPackages.has(pkg.id);
              const isLoading = loadingPkg === pkg.id;
              return (
                <Button
                  key={pkg.id}
                  variant={isLoaded ? "default" : "outline"}
                  size="sm"
                  onClick={() => void handleLoadPackage(pkg.id)}
                  disabled={isLoaded || isLoading}
                  className={cn(
                    "font-mono text-xs transition-all",
                    isLoaded && "ring-2 ring-cyan-500/40",
                    isLoading && "opacity-70"
                  )}
                  title={pkg.desc}
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isLoaded ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : null}
                  {pkg.name}
                </Button>
              );
            })}
          </div>
          {loadedPackages.size > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              已加载:{" "}
              {Array.from(loadedPackages)
                .map((id) => {
                  const pkg = PYODIDE_PACKAGES.find((p) => p.id === id);
                  return pkg ? `${pkg.name} ✓` : `${id} ✓`;
                })
                .join(" ")}
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
            placeholder="# 在此输入 Python 代码..."
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
                    className={cn("min-h-[1.25rem]", getOutputColor(line.type))}
                  >
                    {line.text === "" ? "\u00A0" : line.text}
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
        <span className="ml-auto text-xs text-muted-foreground">
          状态: Python 3.12 (Pyodide {PYODIDE_VERSION}) 已就绪
        </span>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-cyan-500" />
            Pyodide 使用提示
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• 纯浏览器端执行，代码不上传服务器</li>
            <li>• 支持 print() 输出，最后一个表达式自动打印（蓝色 → 前缀）</li>
            <li>• 点击上方包名加载第三方库（NumPy/Pandas/scikit-learn 等）</li>
            <li>• 支持 await 语法（顶层 await），如 await asyncio.sleep(1)</li>
            <li>• 首次加载约 10MB WASM 文件，加载后后续访问更快</li>
            <li>• Matplotlib 需设置 Agg 后端：matplotlib.use('Agg')</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
