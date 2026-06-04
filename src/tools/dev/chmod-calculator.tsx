"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

interface PermissionSet {
  read: boolean;
  write: boolean;
  execute: boolean;
}

interface ChmodState {
  owner: PermissionSet;
  group: PermissionSet;
  other: PermissionSet;
  suid: boolean;
  sgid: boolean;
  sticky: boolean;
}

const defaultState: ChmodState = {
  owner: { read: true, write: true, execute: true },
  group: { read: true, write: false, execute: true },
  other: { read: true, write: false, execute: true },
  suid: false,
  sgid: false,
  sticky: false,
};

function permSetToNumber(perm: PermissionSet): number {
  return (perm.read ? 4 : 0) + (perm.write ? 2 : 0) + (perm.execute ? 1 : 0);
}

function numberToPermSet(num: number): PermissionSet {
  return {
    read: (num & 4) !== 0,
    write: (num & 2) !== 0,
    execute: (num & 1) !== 0,
  };
}

function permSetToSymbol(perm: PermissionSet): string {
  return `${perm.read ? "r" : "-"}${perm.write ? "w" : "-"}${perm.execute ? "x" : "-"}`;
}

function stateToNumeric(state: ChmodState): string {
  const special = (state.suid ? 4 : 0) + (state.sgid ? 2 : 0) + (state.sticky ? 1 : 0);
  const owner = permSetToNumber(state.owner);
  const group = permSetToNumber(state.group);
  const other = permSetToNumber(state.other);
  return special > 0 ? `${special}${owner}${group}${other}` : `${owner}${group}${other}`;
}

function stateToSymbolic(state: ChmodState): string {
  const special = [
    state.suid ? "u=s" : "",
    state.sgid ? "g=s" : "",
    state.sticky ? "o=t" : "",
  ].filter(Boolean).join(",");

  const base = permSetToSymbol(state.owner) + permSetToSymbol(state.group) + permSetToSymbol(state.other);
  return special ? `${base} (${special})` : base;
}

export function ChmodCalculatorTool() {
  const [state, setState] = useState<ChmodState>(defaultState);
  const [numericInput, setNumericInput] = useState("");
  const { copied, handleCopy } = useCopyState();

  const numeric = useMemo(() => stateToNumeric(state), [state]);
  const symbolic = useMemo(() => stateToSymbolic(state), [state]);

  const togglePerm = useCallback((group: "owner" | "group" | "other", perm: "read" | "write" | "execute") => {
    setState((prev) => ({
      ...prev,
      [group]: { ...prev[group], [perm]: !prev[group][perm] },
    }));
  }, []);

  const toggleSpecial = useCallback((perm: "suid" | "sgid" | "sticky") => {
    setState((prev) => ({ ...prev, [perm]: !prev[perm] }));
  }, []);

  const handleNumericInput = useCallback(() => {
    const input = numericInput.trim();
    const num = parseInt(input, 10);
    if (isNaN(num)) return;

    if (input.length === 3) {
      // 3-digit: no special
      setState({
        owner: numberToPermSet(Math.floor(num / 100) % 10),
        group: numberToPermSet(Math.floor(num / 10) % 10),
        other: numberToPermSet(num % 10),
        suid: false,
        sgid: false,
        sticky: false,
      });
    } else if (input.length === 4) {
      // 4-digit: with special
      const special = Math.floor(num / 1000) % 10;
      setState({
        owner: numberToPermSet(Math.floor(num / 100) % 10),
        group: numberToPermSet(Math.floor(num / 10) % 10),
        other: numberToPermSet(num % 10),
        suid: (special & 4) !== 0,
        sgid: (special & 2) !== 0,
        sticky: (special & 1) !== 0,
      });
    }
  }, [numericInput]);

  const permGroups: { key: "owner" | "group" | "other"; label: string }[] = [
    { key: "owner", label: "Owner（所有者）" },
    { key: "group", label: "Group（组）" },
    { key: "other", label: "Other（其他）" },
  ];

  const permLabels: { key: "read" | "write" | "execute"; label: string }[] = [
    { key: "read", label: "读 (r)" },
    { key: "write", label: "写 (w)" },
    { key: "execute", label: "执行 (x)" },
  ];

  return (
    <div className="space-y-4">
      {/* Result display */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">数字权限:</span>
              <code className="text-2xl font-bold font-mono">{numeric}</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">符号权限:</span>
              <code className="text-lg font-mono">{symbolic}</code>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(`chmod ${numeric}`)}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制命令"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Checkbox matrix */}
        <Card>
          <CardContent className="p-4">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-sm font-medium pb-2">权限</th>
                  {permLabels.map((p) => (
                    <th key={p.key} className="text-center text-sm font-medium pb-2">{p.label}</th>
                  ))}
                  <th className="text-center text-sm font-medium pb-2">数字</th>
                </tr>
              </thead>
              <tbody>
                {permGroups.map((g) => (
                  <tr key={g.key}>
                    <td className="py-2 text-sm">{g.label}</td>
                    {permLabels.map((p) => (
                      <td key={p.key} className="text-center py-2">
                        <input
                          type="checkbox"
                          checked={state[g.key][p.key]}
                          onChange={() => togglePerm(g.key, p.key)}
                          className="rounded border-border w-4 h-4 cursor-pointer"
                        />
                      </td>
                    ))}
                    <td className="text-center py-2">
                      <Badge variant="secondary">{permSetToNumber(state[g.key])}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Special permissions */}
            <div className="mt-4 pt-3 border-t">
              <Label className="text-sm font-medium mb-2 block">特殊权限</Label>
              <div className="flex gap-4">
                {[
                  { key: "suid" as const, label: "SUID (4)", desc: "以所有者身份执行" },
                  { key: "sgid" as const, label: "SGID (2)", desc: "以组身份执行" },
                  { key: "sticky" as const, label: "Sticky (1)", desc: "仅所有者可删除" },
                ].map((sp) => (
                  <label key={sp.key} className="flex items-center gap-2 cursor-pointer" title={sp.desc}>
                    <input
                      type="checkbox"
                      checked={state[sp.key]}
                      onChange={() => toggleSpecial(sp.key)}
                      className="rounded border-border w-4 h-4"
                    />
                    <span className="text-sm">{sp.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Numeric input */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label className="text-sm font-medium">从数字权限反推</Label>
            <p className="text-xs text-muted-foreground">输入 3 位或 4 位数字（如 755 或 4755）</p>
            <div className="flex gap-2">
              <Input
                value={numericInput}
                onChange={(e) => setNumericInput(e.target.value.replace(/[^0-7]/g, ""))}
                placeholder="755"
                className="font-mono h-9"
                maxLength={4}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNumericInput();
                }}
              />
              <Button onClick={handleNumericInput} size="sm" className="h-9">
                应用
              </Button>
            </div>

            {/* Common permissions */}
            <div className="pt-3 border-t">
              <Label className="text-sm font-medium mb-2 block">常用权限</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { num: "644", desc: "文件默认" },
                  { num: "755", desc: "目录默认" },
                  { num: "600", desc: "私有文件" },
                  { num: "700", desc: "私有目录" },
                  { num: "777", desc: "完全开放" },
                  { num: "400", desc: "只读文件" },
                  { num: "4755", desc: "SUID 程序" },
                  { num: "1777", desc: "/tmp 目录" },
                ].map((item) => (
                  <Button
                    key={item.num}
                    variant="outline"
                    size="sm"
                    className="justify-start h-8"
                    onClick={() => {
                      setNumericInput(item.num);
                      const num = parseInt(item.num, 10);
                      if (item.num.length === 3) {
                        setState({
                          owner: numberToPermSet(Math.floor(num / 100) % 10),
                          group: numberToPermSet(Math.floor(num / 10) % 10),
                          other: numberToPermSet(num % 10),
                          suid: false, sgid: false, sticky: false,
                        });
                      } else if (item.num.length === 4) {
                        const special = Math.floor(num / 1000) % 10;
                        setState({
                          owner: numberToPermSet(Math.floor(num / 100) % 10),
                          group: numberToPermSet(Math.floor(num / 10) % 10),
                          other: numberToPermSet(num % 10),
                          suid: (special & 4) !== 0,
                          sgid: (special & 2) !== 0,
                          sticky: (special & 1) !== 0,
                        });
                      }
                    }}
                  >
                    <code className="font-mono mr-2">{item.num}</code>
                    <span className="text-xs text-muted-foreground">{item.desc}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
