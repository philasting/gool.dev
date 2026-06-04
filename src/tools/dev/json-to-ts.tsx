"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Copy, Check, Trash2, Wand2 } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

/** Convert a JSON value to TypeScript type string */
function jsonValueToTsType(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (typeof value === "string") return "string";
  if (Array.isArray(value)) {
    if (value.length === 0) return "unknown[]";
    const types = new Set(value.map((v) => jsonValueToTsType(v)));
    if (types.size === 1) {
      const single = [...types][0];
      // Wrap object types in parentheses for array notation
      return single.includes("{") ? `(${single})[]` : `${single}[]`;
    }
    // Union of types
    const typeArr = [...types];
    return `(${typeArr.join(" | ")})[]`;
  }
  if (typeof value === "object") {
    return "object"; // placeholder, will be replaced by interface name
  }
  return "unknown";
}

interface InterfaceDef {
  name: string;
  fields: { key: string; type: string; optional: boolean }[];
}

/** Recursively generate interfaces from a JSON object */
function generateInterfaces(
  obj: Record<string, unknown>,
  rootName: string
): InterfaceDef[] {
  const interfaces: InterfaceDef[] = [];
  const usedNames = new Set<string>();

  const toPascal = (s: string): string => {
    return s
      .replace(/[^a-zA-Z0-9]/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join("");
  };

  const getUniqueName = (base: string): string => {
    let name = toPascal(base);
    if (!name) name = "Unknown";
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
    let i = 2;
    while (usedNames.has(`${name}${i}`)) i++;
    usedNames.add(`${name}${i}`);
    return `${name}${i}`;
  };

  usedNames.add(rootName);

  const processObject = (
    o: Record<string, unknown>,
    interfaceName: string
  ): string => {
    const fields: InterfaceDef["fields"] = [];

    for (const [key, value] of Object.entries(o)) {
      let fieldType: string;

      if (value === null || value === undefined) {
        fieldType = "null";
      } else if (typeof value === "object" && !Array.isArray(value)) {
        const nestedName = getUniqueName(key);
        fieldType = processObject(
          value as Record<string, unknown>,
          nestedName
        );
      } else if (Array.isArray(value)) {
        fieldType = processArray(value, key);
      } else {
        fieldType = jsonValueToTsType(value);
      }

      fields.push({
        key,
        type: fieldType,
        optional: value === null || value === undefined,
      });
    }

    interfaces.push({ name: interfaceName, fields });
    return interfaceName;
  };

  const processArray = (arr: unknown[], parentKey: string): string => {
    if (arr.length === 0) return "unknown[]";

    // Check if all elements are objects
    const objectItems = arr.filter(
      (v) => typeof v === "object" && v !== null && !Array.isArray(v)
    ) as Record<string, unknown>[];

    if (objectItems.length > 0) {
      // Merge all object keys to form a unified interface
      const merged: Record<string, unknown> = {};
      const allKeys = new Set<string>();
      for (const item of objectItems) {
        for (const k of Object.keys(item)) {
          allKeys.add(k);
        }
      }
      for (const k of allKeys) {
        // Use the first non-null value for type inference
        for (const item of objectItems) {
          if (item[k] !== null && item[k] !== undefined) {
            merged[k] = item[k];
            break;
          }
        }
        if (merged[k] === undefined) {
          merged[k] = null;
        }
      }

      const itemName = getUniqueName(parentKey);
      processObject(merged, itemName);
      return `${itemName}[]`;
    }

    // Non-object array
    const types = new Set(arr.map((v) => jsonValueToTsType(v)));
    if (types.size === 1) {
      const single = [...types][0];
      return single.includes("{") ? `(${single})[]` : `${single}[]`;
    }
    return `(${[...types].join(" | ")})[]`;
  };

  processObject(obj, rootName);
  return interfaces;
}

/** Convert interfaces to TypeScript code string */
function interfacesToTs(interfaces: InterfaceDef[]): string {
  return interfaces
    .map((iface) => {
      const fields = iface.fields
        .map((f) => {
          const optional = f.optional ? "?" : "";
          const needsQuote = /^[0-9]|[^a-zA-Z0-9_$]/.test(f.key);
          const keyStr = needsQuote ? `"${f.key}"` : f.key;
          return `  ${keyStr}${optional}: ${f.type};`;
        })
        .join("\n");
      return `interface ${iface.name} {\n${fields}\n}`;
    })
    .join("\n\n");
}

export function JsonToTsTool() {
  const [input, setInput] = useState("");
  const [rootName, setRootName] = useState("Root");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const { copied, handleCopy } = useCopyState();

  const generate = () => {
    try {
      const trimmed = input.trim();
      if (!trimmed) {
        setError("请输入 JSON");
        setOutput("");
        return;
      }
      const parsed = JSON.parse(trimmed);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setError("请输入一个 JSON 对象（非数组）");
        setOutput("");
        return;
      }
      const interfaces = generateInterfaces(
        parsed as Record<string, unknown>,
        rootName || "Root"
      );
      setOutput(interfacesToTs(interfaces));
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  };

  const clear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">输入 JSON</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"name": "张三", "age": 25, "address": {"city": "北京", "zip": "100000"}}'
            className="min-h-[300px] font-mono text-sm"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">根类型名称</Label>
              <Input
                value={rootName}
                onChange={(e) => setRootName(e.target.value)}
                className="w-24 font-mono text-sm"
                placeholder="Root"
              />
            </div>
            <Button onClick={generate} size="sm">
              <Wand2 className="h-4 w-4 mr-1" /> 生成
            </Button>
            <Button onClick={clear} variant="secondary" size="sm">
              <Trash2 className="h-4 w-4 mr-1" /> 清空
            </Button>
          </div>
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">TypeScript 类型定义</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(output)}
              disabled={!output}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          <Card>
            <CardContent className="p-3">
              {error ? (
                <div className="text-destructive text-sm">
                  <pre className="whitespace-pre-wrap break-all">{error}</pre>
                </div>
              ) : (
                <pre className="text-sm font-mono whitespace-pre-wrap break-all max-h-[400px] overflow-auto custom-scrollbar">
                  {output || "点击生成按钮查看 TypeScript 类型定义"}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
