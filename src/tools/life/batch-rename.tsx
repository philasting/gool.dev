"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Trash2, Copy } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

type RenameMode = "prefix" | "suffix" | "sequence" | "find-replace" | "regex";

interface FileItem {
  id: number;
  name: string;
}

let nextFileId = 1;

/**
 * Apply rename transformation based on mode
 */
function applyRename(
  originalName: string,
  mode: RenameMode,
  prefix: string,
  suffix: string,
  pattern: string,
  replacement: string,
  startIndex: number,
  index: number
): string {
  // Split name and extension
  const lastDot = originalName.lastIndexOf(".");
  const baseName = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
  const ext = lastDot > 0 ? originalName.slice(lastDot) : "";

  let newBase = baseName;

  switch (mode) {
    case "prefix":
      newBase = prefix + baseName;
      break;

    case "suffix":
      newBase = baseName + suffix;
      break;

    case "sequence": {
      // Replace {n} with sequential number
      const seqNum = startIndex + index;
      const seqStr = String(seqNum).padStart(
        (pattern.match(/0/g) || []).length || 1,
        "0"
      );
      newBase = pattern.replace(/\{n\}/g, seqStr);
      break;
    }

    case "find-replace":
      newBase = baseName.split(pattern).join(replacement);
      break;

    case "regex": {
      try {
        const regex = new RegExp(pattern, "g");
        newBase = baseName.replace(regex, replacement);
      } catch {
        // Invalid regex, keep original
        newBase = baseName;
      }
      break;
    }
  }

  return newBase + ext;
}

export function BatchRenameTool() {
  const [files, setFiles] = useState<FileItem[]>([
    { id: nextFileId++, name: "photo_001.jpg" },
    { id: nextFileId++, name: "photo_002.jpg" },
    { id: nextFileId++, name: "photo_003.jpg" },
    { id: nextFileId++, name: "document.pdf" },
  ]);
  const [mode, setMode] = useState<RenameMode>("prefix");
  const [prefix, setPrefix] = useState("vacation_");
  const [suffix, setSuffix] = useState("_backup");
  const [seqPattern, setSeqPattern] = useState("file_{n}");
  const [startIndex, setStartIndex] = useState(1);
  const [findText, setFindText] = useState("photo_");
  const [replaceText, setReplaceText] = useState("img_");
  const [regexPattern, setRegexPattern] = useState("\\d+");
  const [regexReplace, setRegexReplace] = useState("000");
  const [bulkInput, setBulkInput] = useState("");
  const { copied, handleCopy } = useCopyState();

  const addFile = () => {
    setFiles((prev) => [...prev, { id: nextFileId++, name: "" }]);
  };

  const removeFile = (id: number) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileName = (id: number, name: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name } : f))
    );
  };

  const handleBulkImport = () => {
    if (!bulkInput.trim()) return;
    const names = bulkInput
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (names.length === 0) return;

    setFiles(names.map((name) => ({ id: nextFileId++, name })));
    setBulkInput("");
  };

  const clearFiles = () => {
    setFiles([]);
  };

  // Compute renamed results
  const results = useMemo(() => {
    return files.map((file, index) => {
      const newName = file.name
        ? applyRename(
            file.name,
            mode,
            prefix,
            suffix,
            mode === "sequence" ? seqPattern : findText,
            mode === "sequence" ? "" : mode === "regex" ? regexReplace : replaceText,
            startIndex,
            index
          )
        : "";
      return {
        id: file.id,
        original: file.name,
        renamed: newName,
        changed: file.name !== newName && file.name !== "",
      };
    });
  }, [files, mode, prefix, suffix, seqPattern, startIndex, findText, replaceText, regexPattern, regexReplace]);

  const changedCount = results.filter((r) => r.changed).length;

  const renameScript = useMemo(() => {
    return results
      .filter((r) => r.changed)
      .map((r) => `mv "${r.original}" "${r.renamed}"`)
      .join("\n");
  }, [results]);

  return (
    <div className="space-y-4">
      {/* File list input */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">文件名列表</Label>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" onClick={addFile}>
                <Plus className="h-3.5 w-3.5 mr-1" /> 添加
              </Button>
              <Button variant="outline" size="sm" onClick={clearFiles}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> 清空
              </Button>
            </div>
          </div>

          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-1.5">
                <Input
                  value={file.name}
                  onChange={(e) => updateFileName(file.id, e.target.value)}
                  placeholder="文件名.扩展名"
                  className="h-8 text-sm font-mono"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFile(file.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {files.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              没有文件，请添加或批量导入
            </p>
          )}
        </CardContent>
      </Card>

      {/* Bulk import */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <Label className="text-sm font-medium">批量导入（每行一个文件名）</Label>
          <Textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            placeholder={"photo_001.jpg\nphoto_002.jpg\ndocument.pdf"}
            className="min-h-[80px] font-mono text-sm"
          />
          <Button variant="outline" size="sm" onClick={handleBulkImport} disabled={!bulkInput.trim()}>
            导入
          </Button>
        </CardContent>
      </Card>

      {/* Rename mode */}
      <div className="space-y-2">
        <Label>重命名模式</Label>
        <Select value={mode} onValueChange={(v) => { if (v != null) setMode(v as RenameMode); }}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prefix">前缀添加</SelectItem>
            <SelectItem value="suffix">后缀添加</SelectItem>
            <SelectItem value="sequence">序号替换</SelectItem>
            <SelectItem value="find-replace">查找替换</SelectItem>
            <SelectItem value="regex">正则替换</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mode-specific options */}
      {mode === "prefix" && (
        <div className="space-y-2">
          <Label>添加前缀</Label>
          <Input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="输入前缀，如：vacation_"
            className="font-mono"
          />
        </div>
      )}

      {mode === "suffix" && (
        <div className="space-y-2">
          <Label>添加后缀（扩展名前）</Label>
          <Input
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
            placeholder="输入后缀，如：_backup"
            className="font-mono"
          />
        </div>
      )}

      {mode === "sequence" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>命名模板（{`{n}`} 为序号占位符）</Label>
            <Input
              value={seqPattern}
              onChange={(e) => setSeqPattern(e.target.value)}
              placeholder="file_{n}"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label>起始序号</Label>
            <Input
              type="number"
              value={startIndex}
              onChange={(e) => setStartIndex(parseInt(e.target.value, 10) || 1)}
              min={0}
              className="font-mono"
            />
          </div>
        </div>
      )}

      {mode === "find-replace" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>查找</Label>
            <Input
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="要查找的文本"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label>替换为</Label>
            <Input
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="替换后的文本"
              className="font-mono"
            />
          </div>
        </div>
      )}

      {mode === "regex" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>正则表达式</Label>
            <Input
              value={regexPattern}
              onChange={(e) => setRegexPattern(e.target.value)}
              placeholder="\\d+"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label>替换为</Label>
            <Input
              value={regexReplace}
              onChange={(e) => setRegexReplace(e.target.value)}
              placeholder="000"
              className="font-mono"
            />
          </div>
        </div>
      )}

      {/* Preview */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">重命名预览</Label>
            <Badge variant="secondary">{changedCount} 项变更</Badge>
          </div>

          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {results.map((r) => (
              <div
                key={r.id}
                className={`flex items-center gap-2 text-sm font-mono py-1 px-2 rounded ${
                  r.changed ? "bg-primary/5" : ""
                }`}
              >
                <span className="flex-1 truncate text-muted-foreground">
                  {r.original || "(空)"}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className={`flex-1 truncate ${r.changed ? "text-primary font-medium" : ""}`}>
                  {r.renamed || "(空)"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rename script */}
      {renameScript && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Shell 命令</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => handleCopy(renameScript)}
              >
                {copied ? "已复制" : <><Copy className="h-3.5 w-3.5 mr-1" /> 复制</>}
              </Button>
            </div>
            <pre className="text-xs font-mono bg-muted/50 rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-[200px] overflow-y-auto">
              {renameScript}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium">使用说明</p>
          <p>• 本工具仅生成重命名方案，不会实际修改任何文件</p>
          <p>• 可复制 Shell 命令到终端执行批量重命名</p>
          <p>• 序号模式中，{`{n}`} 会被替换为序号，支持补零</p>
          <p>• 正则替换使用 JavaScript 正则语法</p>
        </CardContent>
      </Card>
    </div>
  );
}
