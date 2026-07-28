"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Trash2,
  Loader2,
  Terminal,
  Cpu,
  MemoryStick,
  Clock,
  BookOpen,
  FileCode2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───

/** A supported language definition */
interface LanguageDef {
  id: string;
  name: string;
  version: string;
  ext: string;
  example: string;
}

/** Piston API execution result (run stage) */
interface ExecResult {
  stdout: string;
  stderr: string;
  output: string;
  code: number | null;
  signal: string | null;
  status: string | null;
  cpu_time?: number;
  wall_time?: number;
  memory?: number;
}

/** Piston API compilation result (compile stage, for compiled languages) */
interface CompileResult {
  stdout: string;
  stderr: string;
  code: number;
  output: string;
  signal: string | null;
  status: string | null;
}

// ─── Languages (20 languages) ───

const LANGUAGES: LanguageDef[] = [
  {
    id: "python",
    name: "Python",
    version: "*",
    ext: "py",
    example:
      "print('Hello, World!')\n\n# 试试列表推导\nsquares = [x**2 for x in range(10)]\nprint(squares)",
  },
  {
    id: "javascript",
    name: "JavaScript",
    version: "*",
    ext: "js",
    example:
      "console.log('Hello, World!');\n\n// 试试数组方法\nconst nums = [1, 2, 3, 4, 5];\nconsole.log(nums.map(n => n * 2));",
  },
  {
    id: "typescript",
    name: "TypeScript",
    version: "*",
    ext: "ts",
    example:
      "const greet = (name: string): string => `Hello, ${name}!`;\nconsole.log(greet('World'));",
  },
  {
    id: "c",
    name: "C",
    version: "*",
    ext: "c",
    example:
      '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
  },
  {
    id: "c++",
    name: "C++",
    version: "*",
    ext: "cpp",
    example:
      '#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> v = {1, 2, 3, 4, 5};\n    int sum = 0;\n    for (int x : v) sum += x;\n    std::cout << "Sum: " << sum << std::endl;\n    return 0;\n}',
  },
  {
    id: "java",
    name: "Java",
    version: "*",
    ext: "java",
    example:
      'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n        for (int i = 1; i <= 5; i++) {\n            System.out.println("Count: " + i);\n        }\n    }\n}',
  },
  {
    id: "go",
    name: "Go",
    version: "*",
    ext: "go",
    example:
      'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n    nums := []int{1, 2, 3, 4, 5}\n    for i, n := range nums {\n        fmt.Printf("nums[%d] = %d\\n", i, n)\n    }\n}',
  },
  {
    id: "rust",
    name: "Rust",
    version: "*",
    ext: "rs",
    example:
      "fn main() {\n    let nums = vec![1, 2, 3, 4, 5];\n    let sum: i32 = nums.iter().sum();\n    println!(\"Sum: {}\", sum);\n    \n    for n in &nums {\n        println!(\"{}\", n);\n    }\n}",
  },
  {
    id: "ruby",
    name: "Ruby",
    version: "*",
    ext: "rb",
    example:
      'puts "Hello, World!"\n\n# 试试块\n[1, 2, 3, 4, 5].each { |n| puts n }\nputs "Sum: #{[1,2,3,4,5].sum}"',
  },
  {
    id: "php",
    name: "PHP",
    version: "*",
    ext: "php",
    example:
      '<?php\necho "Hello, World!\\n";\n\n$nums = [1, 2, 3, 4, 5];\necho "Sum: " . array_sum($nums) . "\\n";\n?>',
  },
  {
    id: "bash",
    name: "Bash",
    version: "*",
    ext: "sh",
    example:
      '#!/bin/bash\necho "Hello, World!"\n\nfor i in 1 2 3 4 5; do\n    echo "Count: $i"\ndone\n\necho "Date: $(date)"',
  },
  {
    id: "lua",
    name: "Lua",
    version: "*",
    ext: "lua",
    example:
      'print("Hello, World!")\n\nlocal sum = 0\nfor i = 1, 5 do\n    sum = sum + i\nend\nprint("Sum: " .. sum)',
  },
  {
    id: "kotlin",
    name: "Kotlin",
    version: "*",
    ext: "kt",
    example:
      'fun main() {\n    println("Hello, World!")\n    val nums = listOf(1, 2, 3, 4, 5)\n    println("Sum: ${nums.sum()}")\n}',
  },
  {
    id: "swift",
    name: "Swift",
    version: "*",
    ext: "swift",
    example:
      'print("Hello, World!")\n\nlet nums = [1, 2, 3, 4, 5]\nprint("Sum: \\(nums.reduce(0, +))")',
  },
  {
    id: "csharp",
    name: "C#",
    version: "*",
    ext: "cs",
    example:
      "using System;\nusing System.Linq;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine(\"Hello, World!\");\n        int[] nums = {1, 2, 3, 4, 5};\n        Console.WriteLine($\"Sum: {nums.Sum()}\");\n    }\n}",
  },
  {
    id: "scala",
    name: "Scala",
    version: "*",
    ext: "scala",
    example:
      'object Main extends App {\n  println("Hello, World!")\n  val nums = List(1, 2, 3, 4, 5)\n  println(s"Sum: ${nums.sum}")\n}',
  },
  {
    id: "haskell",
    name: "Haskell",
    version: "*",
    ext: "hs",
    example:
      'main :: IO ()\nmain = do\n  putStrLn "Hello, World!"\n  let nums = [1..5]\n  putStrLn $ "Sum: " ++ show (sum nums)',
  },
  {
    id: "elixir",
    name: "Elixir",
    version: "*",
    ext: "exs",
    example:
      'IO.puts("Hello, World!")\n\nnums = 1..5\nIO.puts("Sum: #{Enum.sum(nums)}")',
  },
  {
    id: "perl",
    name: "Perl",
    version: "*",
    ext: "pl",
    example:
      'print "Hello, World!\\n";\n\nmy @nums = (1, 2, 3, 4, 5);\nmy $sum = 0;\n$sum += $_ for @nums;\nprint "Sum: $sum\\n";',
  },
  {
    id: "rscript",
    name: "R",
    version: "*",
    ext: "r",
    example:
      'print("Hello, World!")\n\nnums <- c(1, 2, 3, 4, 5)\nprint(paste("Sum:", sum(nums)))\nprint(paste("Mean:", mean(nums)))',
  },
];

// ─── Helper: format memory ───

function formatMemory(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Helper: translate status code ───

function translateStatus(status: string | null): string {
  if (!status) return "正常退出";
  const map: Record<string, string> = {
    RE: "运行时错误",
    SG: "信号终止",
    TO: "执行超时",
    OL: "输出超长",
    EL: "错误超长",
  };
  return map[status] || status;
}

// ─── Component ───

export function CodePlaygroundTool() {
  const [langId, setLangId] = useState("python");
  const [code, setCode] = useState(LANGUAGES[0].example);
  const [stdin, setStdin] = useState("");
  const [result, setResult] = useState<ExecResult | null>(null);
  const [compileResult, setCompileResult] = useState<CompileResult | null>(
    null
  );
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [execVersion, setExecVersion] = useState("");

  const lang = LANGUAGES.find((l) => l.id === langId) ?? LANGUAGES[0];

  // ─── Run code ───
  const runCode = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setError(null);
    setResult(null);
    setCompileResult(null);
    setExecVersion("");

    try {
      const res = await fetch("/api/code-exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang.id,
          version: lang.version,
          files: [{ name: `main.${lang.ext}`, content: code }],
          stdin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "执行失败");
      } else {
        if (data.compile) {
          setCompileResult(data.compile as CompileResult);
        }
        if (data.run) {
          setResult(data.run as ExecResult);
        }
        if (data.version) {
          setExecVersion(data.version as string);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误");
    } finally {
      setRunning(false);
    }
  }, [lang, code, stdin, running]);

  // ─── Switch language ───
  const switchLang = (id: string) => {
    const newLang = LANGUAGES.find((l) => l.id === id);
    if (!newLang) return;
    setLangId(id);
    setCode(newLang.example);
    setResult(null);
    setCompileResult(null);
    setError(null);
    setExecVersion("");
  };

  // ─── Clear output ───
  const handleClear = () => {
    setResult(null);
    setCompileResult(null);
    setError(null);
    setExecVersion("");
  };

  // ─── Load example ───
  const handleLoadExample = () => {
    setCode(lang.example);
  };

  // ─── Tab key handler ───
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

  // ─── Render ───
  return (
    <div className="space-y-4">
      {/* Language selector bar */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground">
          语言选择:
        </label>
        <Select
          value={langId}
          onValueChange={(v) => {
            if (v != null) switchLang(v);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {execVersion && (
          <Badge variant="secondary" className="text-xs">
            版本: {execVersion}
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          .{lang.ext}
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
            placeholder={`// 输入 ${lang.name} 代码...`}
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
            {result?.wall_time != null && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Clock className="h-3 w-3" />
                {result.wall_time}ms
              </Badge>
            )}
          </div>
          <div className="min-h-[300px] rounded-lg border border-input bg-muted/30 p-3 overflow-auto">
            {error ? (
              <div className="flex items-start gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <pre className="font-mono whitespace-pre-wrap break-all">
                  {error}
                </pre>
              </div>
            ) : !result && !compileResult ? (
              <p className="text-sm text-muted-foreground/50 font-mono">
                点击运行按钮执行代码...
              </p>
            ) : (
              <div className="space-y-3">
                {/* Compile output (if any) */}
                {compileResult &&
                  (compileResult.stderr || compileResult.stdout) && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-yellow-600 dark:text-yellow-500">
                        编译输出:
                      </div>
                      {compileResult.stderr && (
                        <pre className="text-sm font-mono whitespace-pre-wrap break-all text-yellow-600 dark:text-yellow-500">
                          {compileResult.stderr}
                        </pre>
                      )}
                      {compileResult.stdout && (
                        <pre className="text-sm font-mono whitespace-pre-wrap break-all text-muted-foreground">
                          {compileResult.stdout}
                        </pre>
                      )}
                    </div>
                  )}

                {/* Stdout */}
                {result?.stdout && (
                  <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-all text-foreground">
                    {result.stdout}
                  </pre>
                )}

                {/* Stderr */}
                {result?.stderr && (
                  <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-all text-red-500">
                    {result.stderr}
                  </pre>
                )}

                {/* No output */}
                {result &&
                  !result.stdout &&
                  !result.stderr &&
                  !compileResult && (
                    <p className="text-sm text-muted-foreground/50 font-mono">
                      (无输出)
                    </p>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* stdin + exec info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* stdin */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            标准输入 (stdin)
          </label>
          <Textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                void runCode();
              }
            }}
            placeholder="可选：输入传递给程序的标准输入..."
            className="min-h-[100px] font-mono text-sm leading-relaxed resize-y"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>

        {/* Exec info */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            执行信息
          </label>
          <div className="min-h-[100px] rounded-lg border border-input bg-muted/30 p-3">
            {result ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">退出码:</span>
                  <Badge
                    variant={result.code === 0 ? "default" : "destructive"}
                    className="text-xs font-mono"
                  >
                    {result.code ?? "N/A"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">状态:</span>
                  <span
                    className={cn(
                      "text-xs",
                      result.status
                        ? "text-red-500"
                        : "text-green-500"
                    )}
                  >
                    {translateStatus(result.status)}
                  </span>
                </div>
                {result.cpu_time != null && (
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">CPU 时间:</span>
                    <span className="text-xs font-mono">
                      {result.cpu_time}ms
                    </span>
                  </div>
                )}
                {result.memory != null && (
                  <div className="flex items-center gap-2">
                    <MemoryStick className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">内存:</span>
                    <span className="text-xs font-mono">
                      {formatMemory(result.memory)}
                    </span>
                  </div>
                )}
                {result.signal && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-muted-foreground">信号:</span>
                    <span className="text-xs font-mono text-red-500">
                      {result.signal}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/50 font-mono">
                执行后将显示详细信息...
              </p>
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
        <Button
          variant="outline"
          onClick={handleLoadExample}
          disabled={running}
        >
          <FileCode2 className="h-4 w-4" />
          加载示例
        </Button>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-cyan-500" />
            多语言在线运行说明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• 代码通过 Piston API 远程执行，支持 20+ 编程语言</li>
            <li>• 执行超时 5 秒，输出上限 1024 字符</li>
            <li>• 编译型语言（C/C++/Java/Go/Rust 等）会显示编译输出</li>
            <li>• 支持标准输入 (stdin)，适用于需要交互输入的程序</li>
            <li>• 退出码 0 表示正常退出，非 0 表示有错误</li>
            <li>• 切换语言会自动加载该语言的示例代码</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
