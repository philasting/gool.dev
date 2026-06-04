"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator } from "lucide-react";

interface CidrResult {
  ipClass: string;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  prefixLength: number;
  totalHosts: number;
  usableHosts: number;
  firstUsableIp: string;
  lastUsableIp: string;
  addressRange: string;
  binaryMask: string;
}

/** Parse IPv4 address to 32-bit unsigned integer */
function ipToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/** Convert 32-bit unsigned integer to IPv4 string */
function intToIp(num: number): string {
  return [
    (num >>> 24) & 0xff,
    (num >>> 16) & 0xff,
    (num >>> 8) & 0xff,
    num & 0xff,
  ].join(".");
}

/** Determine IP class */
function getIpClass(firstOctet: number): string {
  if (firstOctet < 128) return "A";
  if (firstOctet < 192) return "B";
  if (firstOctet < 224) return "C";
  if (firstOctet < 240) return "D (组播)";
  return "E (保留)";
}

/** Calculate CIDR subnet info */
function calculateCidr(cidr: string): CidrResult | null {
  const match = cidr.trim().match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
  if (!match) return null;

  const ip = match[1];
  const prefix = parseInt(match[2], 10);

  if (prefix < 0 || prefix > 32) return null;

  const ipParts = ip.split(".").map(Number);
  if (ipParts.some((p) => p < 0 || p > 255)) return null;

  const ipInt = ipToInt(ip);
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const networkInt = (ipInt & mask) >>> 0;
  const broadcastInt = (networkInt | ~mask) >>> 0;
  const totalHosts = Math.pow(2, 32 - prefix);
  const usableHosts = prefix <= 30 ? totalHosts - 2 : prefix === 31 ? 2 : 1;
  const firstUsable = prefix <= 30 ? (networkInt + 1) >>> 0 : networkInt;
  const lastUsable = prefix <= 30 ? (broadcastInt - 1) >>> 0 : broadcastInt;

  const binaryMask = mask.toString(2).padStart(32, "0").replace(/(.{8})/g, "$1.").slice(0, -1);

  return {
    ipClass: getIpClass(ipParts[0]),
    networkAddress: intToIp(networkInt),
    broadcastAddress: intToIp(broadcastInt),
    subnetMask: intToIp(mask),
    prefixLength: prefix,
    totalHosts,
    usableHosts,
    firstUsableIp: intToIp(firstUsable),
    lastUsableIp: intToIp(lastUsable),
    addressRange: `${intToIp(firstUsable)} - ${intToIp(lastUsable)}`,
    binaryMask,
  };
}

export function CidrCalculatorTool() {
  const [cidr, setCidr] = useState("192.168.1.0/24");
  const [calculated, setCalculated] = useState<CidrResult | null>(null);
  const [error, setError] = useState("");

  const handleCalculate = () => {
    if (!cidr.trim()) {
      setError("请输入 CIDR 地址");
      setCalculated(null);
      return;
    }
    const result = calculateCidr(cidr);
    if (!result) {
      setError("无效的 CIDR 格式，请使用如 192.168.1.0/24 的格式");
      setCalculated(null);
      return;
    }
    setError("");
    setCalculated(result);
  };

  const resultRows = useMemo(() => {
    if (!calculated) return [];
    return [
      { label: "IP 类别", value: calculated.ipClass },
      { label: "网络地址", value: calculated.networkAddress },
      { label: "广播地址", value: calculated.broadcastAddress },
      { label: "子网掩码", value: calculated.subnetMask },
      { label: "前缀长度", value: `/${calculated.prefixLength}` },
      { label: "二进制掩码", value: calculated.binaryMask },
      { label: "地址总数", value: calculated.totalHosts.toLocaleString() },
      { label: "可用主机数", value: calculated.usableHosts.toLocaleString() },
      { label: "第一个可用 IP", value: calculated.firstUsableIp },
      { label: "最后可用 IP", value: calculated.lastUsableIp },
      { label: "地址范围", value: calculated.addressRange },
    ];
  }, [calculated]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div className="space-y-1 flex-1">
          <Label className="text-sm">CIDR 地址</Label>
          <Input
            value={cidr}
            onChange={(e) => setCidr(e.target.value)}
            placeholder="192.168.1.0/24"
            className="font-mono h-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCalculate();
            }}
          />
        </div>
        <Button onClick={handleCalculate} size="sm" className="h-9">
          <Calculator className="h-4 w-4 mr-1" /> 计算
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="p-3">
            <Badge variant="destructive">{error}</Badge>
          </CardContent>
        </Card>
      )}

      {calculated && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resultRows.map((row) => (
                <div key={row.label} className="flex justify-between items-center py-1.5 px-3 rounded bg-muted/50">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <code className="text-sm font-mono font-medium">{row.value}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
