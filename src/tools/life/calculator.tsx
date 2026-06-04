"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Delete, History } from "lucide-react";

interface HistoryEntry {
  expression: string;
  result: string;
}

/** Safely evaluate a mathematical expression */
function safeEval(expr: string): string {
  try {
    // Replace math functions and constants
    let processed = expr
      .replace(/π/g, `(${Math.PI})`)
      .replace(/\bpi\b/gi, `(${Math.PI})`)
      .replace(/\be\b/g, `(${Math.E})`)
      .replace(/sin\(/g, "Math.sin(")
      .replace(/cos\(/g, "Math.cos(")
      .replace(/tan\(/g, "Math.tan(")
      .replace(/log\(/g, "Math.log10(")
      .replace(/ln\(/g, "Math.log(")
      .replace(/sqrt\(/g, "Math.sqrt(")
      .replace(/abs\(/g, "Math.abs(")
      .replace(/\^/g, "**");

    // Validate: only allow safe characters
    if (/[^0-9+\-*/.()eE\s]/.test(processed.replace(/Math\.\w+/g, ""))) {
      return "错误";
    }

    // Use Function constructor for safe evaluation
    const fn = new Function(`"use strict"; return (${processed});`);
    const result = fn();

    if (typeof result !== "number" || !isFinite(result)) {
      return "错误";
    }

    // Format result
    if (Number.isInteger(result) && Math.abs(result) < 1e15) {
      return result.toString();
    }
    return parseFloat(result.toPrecision(12)).toString();
  } catch {
    return "错误";
  }
}

/** Check if a character is an operator */
function isOperator(char: string): boolean {
  return ["+", "-", "*", "/"].includes(char);
}

export function CalculatorTool() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [justEvaluated, setJustEvaluated] = useState(false);

  const appendToExpression = useCallback(
    (value: string) => {
      setExpression((prev) => {
        // If we just evaluated and user starts typing a number, start fresh
        if (justEvaluated && !isOperator(value) && value !== "(" && value !== ")") {
          setJustEvaluated(false);
          setResult("");
          return value;
        }
        setJustEvaluated(false);
        return prev + value;
      });
    },
    [justEvaluated]
  );

  const calculate = useCallback(() => {
    if (!expression.trim()) return;
    const evalResult = safeEval(expression);
    setResult(evalResult);

    if (evalResult !== "错误") {
      setHistory((prev) => {
        const newHistory = [
          { expression, result: evalResult },
          ...prev,
        ].slice(0, 10);
        return newHistory;
      });
    }
    setJustEvaluated(true);
  }, [expression]);

  const clear = useCallback(() => {
    setExpression("");
    setResult("");
    setJustEvaluated(false);
  }, []);

  const backspace = useCallback(() => {
    setExpression((prev) => prev.slice(0, -1));
    setJustEvaluated(false);
  }, []);

  const toggleSign = useCallback(() => {
    setExpression((prev) => {
      if (prev.startsWith("-")) return prev.slice(1);
      if (prev.length > 0) return `-${prev}`;
      return prev;
    });
  }, []);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key;

      if (/^[0-9.]$/.test(key)) {
        e.preventDefault();
        appendToExpression(key);
      } else if (key === "+" || key === "-" || key === "*" || key === "/") {
        e.preventDefault();
        appendToExpression(key);
      } else if (key === "(" || key === ")") {
        e.preventDefault();
        appendToExpression(key);
      } else if (key === "Enter" || key === "=") {
        e.preventDefault();
        calculate();
      } else if (key === "Backspace") {
        e.preventDefault();
        backspace();
      } else if (key === "Escape") {
        e.preventDefault();
        clear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [appendToExpression, calculate, backspace, clear]);

  /** Button component for calculator keys */
  const CalcButton = ({
    label,
    onClick,
    variant = "outline",
    className = "",
    wide = false,
  }: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary" | "ghost";
    className?: string;
    wide?: boolean;
  }) => (
    <Button
      variant={variant}
      onClick={onClick}
      className={`h-12 text-base font-mono ${wide ? "col-span-2" : ""} ${className}`}
    >
      {label}
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="max-w-sm mx-auto space-y-3">
        {/* Display */}
        <Card>
          <CardContent className="p-4 space-y-1">
            <div className="text-right text-sm text-muted-foreground font-mono min-h-[20px] truncate">
              {expression || "\u00A0"}
            </div>
            <div className="text-right text-3xl font-bold font-mono truncate">
              {result || "0"}
            </div>
          </CardContent>
        </Card>

        {/* Scientific functions row */}
        <div className="grid grid-cols-5 gap-1.5">
          <CalcButton label="sin" onClick={() => appendToExpression("sin(")} variant="secondary" />
          <CalcButton label="cos" onClick={() => appendToExpression("cos(")} variant="secondary" />
          <CalcButton label="tan" onClick={() => appendToExpression("tan(")} variant="secondary" />
          <CalcButton label="log" onClick={() => appendToExpression("log(")} variant="secondary" />
          <CalcButton label="ln" onClick={() => appendToExpression("ln(")} variant="secondary" />
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          <CalcButton label="√" onClick={() => appendToExpression("sqrt(")} variant="secondary" />
          <CalcButton label="xʸ" onClick={() => appendToExpression("^")} variant="secondary" />
          <CalcButton label="π" onClick={() => appendToExpression("π")} variant="secondary" />
          <CalcButton label="e" onClick={() => appendToExpression("e")} variant="secondary" />
          <CalcButton label="(" onClick={() => appendToExpression("(")} variant="secondary" />
        </div>

        {/* Main keypad */}
        <div className="grid grid-cols-4 gap-1.5">
          <CalcButton label="C" onClick={clear} variant="secondary" />
          <CalcButton label="()" onClick={() => appendToExpression(")")} variant="secondary" />
          <CalcButton label="%" onClick={() => appendToExpression("/100")} variant="secondary" />
          <CalcButton label="÷" onClick={() => appendToExpression("/")} variant="secondary" />

          <CalcButton label="7" onClick={() => appendToExpression("7")} />
          <CalcButton label="8" onClick={() => appendToExpression("8")} />
          <CalcButton label="9" onClick={() => appendToExpression("9")} />
          <CalcButton label="×" onClick={() => appendToExpression("*")} variant="secondary" />

          <CalcButton label="4" onClick={() => appendToExpression("4")} />
          <CalcButton label="5" onClick={() => appendToExpression("5")} />
          <CalcButton label="6" onClick={() => appendToExpression("6")} />
          <CalcButton label="−" onClick={() => appendToExpression("-")} variant="secondary" />

          <CalcButton label="1" onClick={() => appendToExpression("1")} />
          <CalcButton label="2" onClick={() => appendToExpression("2")} />
          <CalcButton label="3" onClick={() => appendToExpression("3")} />
          <CalcButton label="+" onClick={() => appendToExpression("+")} variant="secondary" />

          <CalcButton label="±" onClick={toggleSign} variant="secondary" />
          <CalcButton label="0" onClick={() => appendToExpression("0")} />
          <CalcButton label="." onClick={() => appendToExpression(".")} />
          <Button
            onClick={calculate}
            className="h-12 text-base font-bold bg-primary text-primary-foreground"
          >
            =
          </Button>
        </div>

        {/* Backspace row */}
        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            onClick={backspace}
            className="flex-1 h-10 text-sm"
          >
            <Delete className="h-4 w-4 mr-1" /> 退格
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowHistory(!showHistory)}
            className="flex-1 h-10 text-sm"
          >
            <History className="h-4 w-4 mr-1" /> 历史
          </Button>
        </div>

        {/* History */}
        {showHistory && (
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">历史记录</h3>
                <Badge variant="secondary" className="text-xs">
                  最近 {history.length} 条
                </Badge>
              </div>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无记录
                </p>
              ) : (
                <div className="space-y-1.5 max-h-[200px] overflow-auto custom-scrollbar">
                  {history.map((entry, i) => (
                    <button
                      key={i}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-muted transition-colors"
                      onClick={() => {
                        setExpression(entry.expression);
                        setResult(entry.result);
                        setJustEvaluated(true);
                      }}
                    >
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {entry.expression}
                      </div>
                      <div className="text-sm font-mono font-semibold">
                        = {entry.result}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
