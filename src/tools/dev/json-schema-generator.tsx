"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, Check, FileJson, Trash2 } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

/** 根据 JSON 值推导 JSON Schema 类型 */
function inferType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

/** 递归生成 JSON Schema (Draft-07) */
function generateSchema(
  value: unknown,
  addDescription: boolean,
  strictRequired: boolean
): Record<string, unknown> {
  const type = inferType(value);
  const schema: Record<string, unknown> = {};

  switch (type) {
    case "string":
      schema.type = "string";
      if (addDescription) schema.description = "字符串类型";
      break;
    case "number":
      schema.type = "number";
      if (Number.isInteger(value as number)) schema.type = "integer";
      if (addDescription) schema.description = `${schema.type}类型`;
      break;
    case "boolean":
      schema.type = "boolean";
      if (addDescription) schema.description = "布尔类型";
      break;
    case "null":
      schema.type = "null";
      if (addDescription) schema.description = "空值";
      break;
    case "array": {
      schema.type = "array";
      const arr = value as unknown[];
      if (arr.length > 0) {
        schema.items = generateSchema(arr[0], addDescription, strictRequired);
      } else {
        schema.items = {};
      }
      if (addDescription) schema.description = "数组类型";
      break;
    }
    case "object": {
      schema.type = "object";
      const obj = value as Record<string, unknown>;
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      for (const [key, val] of Object.entries(obj)) {
        properties[key] = generateSchema(val, addDescription, strictRequired);
        if (strictRequired) required.push(key);
      }

      schema.properties = properties;
      if (strictRequired && required.length > 0) {
        schema.required = required;
      }
      if (addDescription) schema.description = "对象类型";
      break;
    }
    default:
      break;
  }

  return schema;
}

export function JsonSchemaGeneratorTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [addDescription, setAddDescription] = useState(false);
  const [strictRequired, setStrictRequired] = useState(true);
  const [error, setError] = useState("");
  const { copied, handleCopy } = useCopyState();

  const handleGenerate = () => {
    if (!input.trim()) return;
    setError("");
    try {
      const parsed = JSON.parse(input);
      const schema = generateSchema(parsed, addDescription, strictRequired);
      const fullSchema = {
        $schema: "http://json-schema.org/draft-07/schema#",
        ...schema,
      };
      setOutput(JSON.stringify(fullSchema, null, 2));
    } catch (e) {
      setError(`JSON 解析失败：${(e as Error).message}`);
      setOutput("");
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>输入 JSON</Label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='{"name": "张三", "age": 25, "email": "zhangsan@example.com"}'
          className="min-h-[150px] font-mono text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="add-desc"
            checked={addDescription}
            onCheckedChange={setAddDescription}
          />
          <Label htmlFor="add-desc" className="text-sm">
            添加描述
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="strict-req"
            checked={strictRequired}
            onCheckedChange={setStrictRequired}
          />
          <Label htmlFor="strict-req" className="text-sm">
            所有字段 required
          </Label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleGenerate} size="sm" disabled={!input.trim()}>
          <FileJson className="h-4 w-4 mr-1" /> 生成 Schema
        </Button>
        <Button onClick={handleClear} variant="outline" size="sm">
          <Trash2 className="h-4 w-4 mr-1" /> 清空
        </Button>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {output && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <pre className="text-xs font-mono break-all whitespace-pre-wrap flex-1 overflow-x-auto">
                {output}
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => handleCopy(output)}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
