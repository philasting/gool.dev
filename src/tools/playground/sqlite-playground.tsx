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
  Database,
  RotateCcw,
  Clock,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───

/** A single SQL query result set */
interface QueryResult {
  columns: string[];
  values: unknown[][];
}

/** Output from executing SQL */
interface ExecOutput {
  type: "query" | "info" | "error";
  message?: string;
  results?: QueryResult[];
  execTime?: number;
}

// ─── Constants ───

const SAMPLE_DATA_SQL = `-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  age INTEGER,
  city TEXT,
  created_at TEXT DEFAULT CURRENT_DATE
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  product TEXT NOT NULL,
  amount REAL,
  status TEXT DEFAULT 'pending',
  order_date TEXT DEFAULT CURRENT_DATE
);

-- 插入示例数据
INSERT INTO users (name, email, age, city) VALUES
  ('Alice', 'alice@example.com', 30, 'Beijing'),
  ('Bob', 'bob@example.com', 25, 'Shanghai'),
  ('Charlie', 'charlie@example.com', 35, 'Shenzhen'),
  ('Diana', 'diana@example.com', 28, 'Guangzhou'),
  ('Eve', 'eve@example.com', 32, 'Beijing');

INSERT INTO orders (user_id, product, amount, status) VALUES
  (1, 'Laptop', 8999.00, 'completed'),
  (1, 'Mouse', 99.00, 'completed'),
  (2, 'Keyboard', 299.00, 'pending'),
  (3, 'Monitor', 1999.00, 'completed'),
  (3, 'Webcam', 399.00, 'cancelled'),
  (4, 'Headphone', 599.00, 'pending'),
  (5, 'Tablet', 3299.00, 'completed');`;

const DEFAULT_SQL = `-- 试试这些 SQL 查询
SELECT * FROM users LIMIT 5;

-- 统计每个城市的用户数
SELECT city, COUNT(*) as user_count
FROM users
GROUP BY city
ORDER BY user_count DESC;

-- 查询订单总额
SELECT u.name, COUNT(o.id) as order_count, SUM(o.amount) as total_amount
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id;`;

// ─── Component ───

export function SqlitePlaygroundTool() {
  const [sql, setSql] = useState<string>(DEFAULT_SQL);
  const [output, setOutput] = useState<ExecOutput | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadStatus, setLoadStatus] = useState("正在加载 SQLite...");

  const dbRef = useRef<any>(null);

  // ─── Initialize sql.js ───
  const initSqlJs = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setLoadStatus("正在下载 SQLite WASM (~1MB)...");

    try {
      // Step 1: Dynamically inject the sql.js script
      await new Promise<void>((resolve, reject) => {
        if ((window as any).initSqlJs) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://sql.js.org/dist/sql-wasm.js";
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("sql.js 脚本加载失败，请检查网络连接"));
        document.head.appendChild(script);
      });

      // Step 2: Initialize the SQLite database
      setLoadStatus("正在初始化数据库...");
      const SQL = await (window as any).initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
      });

      // Step 3: Create database and load sample data
      const db = new SQL.Database();
      db.run(SAMPLE_DATA_SQL);

      dbRef.current = db;
      setLoadStatus("SQLite 就绪");
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
    void initSqlJs();
  }, [initSqlJs]);

  // ─── Reset sample data ───
  const handleResetData = () => {
    if (!dbRef.current) return;
    try {
      dbRef.current.run(
        "DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS orders;"
      );
      dbRef.current.run(SAMPLE_DATA_SQL);
      setOutput({ type: "info", message: "示例数据已重置" });
    } catch (err) {
      setOutput({
        type: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  // ─── Execute SQL ───
  const runSql = useCallback(() => {
    if (!dbRef.current || running) return;
    setRunning(true);
    const startTime = performance.now();

    try {
      // db.exec() returns results for SELECT statements only
      const results: QueryResult[] = dbRef.current.exec(sql);
      const execTime = Math.round(performance.now() - startTime);

      if (results.length === 0) {
        // Non-query statement (DDL/DML) — show rows affected
        const rowsModified: number = dbRef.current.getRowsModified();
        setOutput({
          type: "info",
          message: `执行成功，${rowsModified} 行受影响`,
          execTime,
        });
      } else {
        setOutput({
          type: "query",
          results,
          execTime,
        });
      }
    } catch (err) {
      setOutput({
        type: "error",
        message: err instanceof Error ? err.message : String(err),
        execTime: Math.round(performance.now() - startTime),
      });
    } finally {
      setRunning(false);
    }
  }, [sql, running]);

  // ─── Clear output ───
  const handleClear = () => {
    setOutput(null);
  };

  // ─── Tab key handler: insert two spaces ───
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.setRangeText("  ", start, end, "end");
      setSql(textarea.value);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runSql();
    }
  };

  // ─── Render a single result table ───
  const renderResultTable = (result: QueryResult, index: number) => {
    return (
      <div key={index} className="space-y-2">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                {result.columns.map((col, i) => (
                  <th
                    key={i}
                    className="text-left px-3 py-2 font-medium text-foreground whitespace-nowrap border-r border-border last:border-r-0"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.values.map((row, i) => (
                <tr key={i} className="border-b hover:bg-muted/30 last:border-b-0">
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="px-3 py-2 whitespace-nowrap border-r border-border last:border-r-0"
                    >
                      {cell === null ? (
                        <span className="text-muted-foreground italic">NULL</span>
                      ) : (
                        String(cell)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-muted-foreground px-1">
          {result.values.length} 行
        </div>
      </div>
    );
  };

  // ─── Loading state ───
  if (loading || loadError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          {loadError ? (
            <>
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">SQLite 加载失败</h3>
              <p className="text-muted-foreground text-sm mb-4 max-w-md">
                {loadStatus}
              </p>
              <Button onClick={() => void initSqlJs()}>
                <RotateCcw className="h-4 w-4" />
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
          <Database className="h-3 w-3 text-cyan-500" />
          SQLite 3.x 已就绪
        </Badge>
        <Badge variant="outline" className="text-xs">
          示例数据: users (5行) + orders (7行)
        </Badge>
      </div>

      {/* SQL editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground">
            SQL 编辑器
          </label>
          <Badge variant="secondary" className="text-xs">
            Ctrl+Enter 执行
          </Badge>
        </div>
        <Textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="-- 在此输入 SQL 语句..."
          className="min-h-[300px] font-mono text-sm leading-relaxed resize-y"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => runSql()} disabled={running}>
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {running ? "执行中..." : "执行 SQL"}
        </Button>
        <Button variant="outline" onClick={handleClear} disabled={running}>
          <Trash2 className="h-4 w-4" />
          清空
        </Button>
        <Button
          variant="outline"
          onClick={handleResetData}
          disabled={running}
        >
          <RotateCcw className="h-4 w-4" />
          重置示例数据
        </Button>
        {output?.execTime !== undefined && output?.execTime !== null && (
          <Badge variant="secondary" className="text-xs gap-1 ml-auto">
            <Clock className="h-3 w-3" />
            {output.execTime}ms
          </Badge>
        )}
      </div>

      {/* Results / Output */}
      {output && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {output.type === "error" ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : output.type === "info" ? (
                <Database className="h-4 w-4 text-cyan-500" />
              ) : (
                <Database className="h-4 w-4 text-green-500" />
              )}
              {output.type === "error"
                ? "错误信息"
                : output.type === "info"
                ? "执行结果"
                : "查询结果"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {output.type === "error" && (
              <pre className="text-sm font-mono text-red-500 whitespace-pre-wrap break-all">
                {output.message}
              </pre>
            )}
            {output.type === "info" && (
              <p className="text-sm text-foreground">{output.message}</p>
            )}
            {output.type === "query" && output.results && (
              <div className="space-y-6">
                {output.results.map((result, i) =>
                  renderResultTable(result, i)
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-cyan-500" />
            使用提示
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• 纯浏览器端执行，数据不上传服务器</li>
            <li>• 支持多条 SQL 语句（分号分隔）</li>
            <li>• 示例数据库: users(5行) + orders(7行)，含 JOIN 关联</li>
            <li>• 点击"重置示例数据"恢复初始数据</li>
            <li>• DDL/DML 语句显示影响行数，SELECT 语句显示结果表格</li>
            <li>• Tab 键插入 2 空格，Ctrl+Enter 快捷执行</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
