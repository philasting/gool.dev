"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

interface CurlParseResult {
  method: string;
  url: string;
  headers: Record<string, string>;
  data: string | null;
  auth: string | null;
}

function parseCurl(cmd: string): CurlParseResult {
  const result: CurlParseResult = {
    method: "GET",
    url: "",
    headers: {},
    data: null,
    auth: null,
  };

  const tokens = tokenize(cmd);
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token === "curl") {
      i++;
      continue;
    }

    if (token === "-X" || token === "--request") {
      i++;
      if (i < tokens.length) {
        result.method = tokens[i].toUpperCase();
        i++;
      }
      continue;
    }

    if (token === "-H" || token === "--header") {
      i++;
      if (i < tokens.length) {
        const headerStr = tokens[i];
        const colonIdx = headerStr.indexOf(":");
        if (colonIdx !== -1) {
          const name = headerStr.slice(0, colonIdx).trim();
          const value = headerStr.slice(colonIdx + 1).trim();
          result.headers[name] = value;
        }
        i++;
      }
      continue;
    }

    if (token === "-d" || token === "--data" || token === "--data-raw" || token === "--data-binary") {
      i++;
      if (i < tokens.length) {
        result.data = tokens[i];
        if (result.method === "GET") result.method = "POST";
        i++;
      }
      continue;
    }

    if (token === "-u" || token === "--user") {
      i++;
      if (i < tokens.length) {
        result.auth = tokens[i];
        i++;
      }
      continue;
    }

    if (token === "-F" || token === "--form") {
      i++;
      if (i < tokens.length) {
        if (!result.data) result.data = "";
        if (result.data) result.data += "&";
        result.data += tokens[i];
        if (result.method === "GET") result.method = "POST";
        i++;
      }
      continue;
    }

    if (token === "--url") {
      i++;
      if (i < tokens.length) {
        result.url = tokens[i];
        i++;
      }
      continue;
    }

    if (token.startsWith("-")) {
      i++;
      if (i < tokens.length && !tokens[i].startsWith("-")) {
        i++;
      }
      continue;
    }

    if (!result.url && (token.startsWith("http://") || token.startsWith("https://") || token.startsWith("'http") || token.startsWith('"http'))) {
      result.url = token.replace(/^['"]|['"]$/g, "");
      i++;
      continue;
    }

    i++;
  }

  return result;
}

function tokenize(cmd: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < cmd.length) {
    while (i < cmd.length && /\s/.test(cmd[i])) i++;
    if (i >= cmd.length) break;

    if (cmd[i] === "'") {
      i++;
      let token = "";
      while (i < cmd.length && cmd[i] !== "'") {
        token += cmd[i];
        i++;
      }
      if (i < cmd.length) i++;
      tokens.push(token);
    } else if (cmd[i] === '"') {
      i++;
      let token = "";
      while (i < cmd.length && cmd[i] !== '"') {
        if (cmd[i] === "\\" && i + 1 < cmd.length) {
          token += cmd[i + 1];
          i += 2;
        } else {
          token += cmd[i];
          i++;
        }
      }
      if (i < cmd.length) i++;
      tokens.push(token);
    } else {
      let token = "";
      while (i < cmd.length && !/\s/.test(cmd[i])) {
        token += cmd[i];
        i++;
      }
      tokens.push(token);
    }
  }

  return tokens;
}

function toFetchCode(parsed: CurlParseResult): string {
  const lines: string[] = [];
  const hasBody = parsed.data !== null;
  const isJson = parsed.data && (parsed.data.startsWith("{") || parsed.data.startsWith("["));
  const headers = { ...parsed.headers };

  if (parsed.auth) {
    const encoded = btoa(parsed.auth);
    headers["Authorization"] = `Basic ${encoded}`;
  }

  if (isJson && !headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }

  const options: string[] = [];
  options.push(`  method: "${parsed.method}"`);

  if (Object.keys(headers).length > 0) {
    const headerLines = Object.entries(headers)
      .map(([k, v]) => `    "${k}": "${v}"`)
      .join(",\n");
    options.push(`  headers: {\n${headerLines}\n  }`);
  }

  if (hasBody) {
    if (isJson) {
      options.push(`  body: JSON.stringify(${parsed.data})`);
    } else {
      options.push(`  body: "${parsed.data?.replace(/"/g, '\\"')}"`);
    }
  }

  lines.push(`fetch("${parsed.url}", {`);
  lines.push(options.join(",\n"));
  lines.push("})");
  lines.push("  .then(response => response.json())");
  lines.push("  .then(data => console.log(data))");
  lines.push("  .catch(error => console.error(error));");

  return lines.join("\n");
}

function toAxiosCode(parsed: CurlParseResult): string {
  const lines: string[] = [];
  const isJson = parsed.data && (parsed.data.startsWith("{") || parsed.data.startsWith("["));
  const headers: Record<string, string> = { ...parsed.headers };

  if (parsed.auth) {
    const encoded = btoa(parsed.auth);
    headers["Authorization"] = `Basic ${encoded}`;
  }

  if (isJson && !headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }

  const config: string[] = [];
  if (Object.keys(headers).length > 0) {
    const headerLines = Object.entries(headers)
      .map(([k, v]) => `      "${k}": "${v}"`)
      .join(",\n");
    config.push(`    headers: {\n${headerLines}\n    }`);
  }

  const method = parsed.method.toLowerCase();
  const hasData = ["post", "put", "patch"].includes(method);

  if (hasData && parsed.data) {
    if (isJson) {
      config.push(`    data: ${parsed.data}`);
    } else {
      config.push(`    data: "${parsed.data.replace(/"/g, '\\"')}"`);
    }
  }

  if (config.length > 0) {
    lines.push(`axios.${method}("${parsed.url}", {`);
    lines.push(config.join(",\n"));
    lines.push("})");
  } else {
    lines.push(`axios.${method}("${parsed.url}")`);
  }

  lines.push("  .then(response => console.log(response.data))");
  lines.push("  .catch(error => console.error(error));");

  return lines.join("\n");
}

function toPythonCode(parsed: CurlParseResult): string {
  const lines: string[] = [];
  const headers: Record<string, string> = { ...parsed.headers };

  if (parsed.auth) {
    const parts = parsed.auth.split(":");
    lines.push("import requests");
    lines.push("");
    lines.push(`url = "${parsed.url}"`);
    if (Object.keys(headers).length > 0) {
      lines.push("headers = {");
      for (const [k, v] of Object.entries(headers)) {
        lines.push(`    "${k}": "${v}",`);
      }
      lines.push("}");
    }
    lines.push(`auth = ("${parts[0] || ""}", "${parts[1] || ""}")`);
    lines.push("");

    const method = parsed.method.toLowerCase();
    const kwargs: string[] = [];
    if (Object.keys(headers).length > 0) kwargs.push("headers=headers");
    if (parsed.data) kwargs.push(`data='${parsed.data}'`);
    kwargs.push("auth=auth");

    lines.push(`response = requests.${method}(url, ${kwargs.join(", ")})`);
  } else {
    lines.push("import requests");
    lines.push("");
    lines.push(`url = "${parsed.url}"`);
    if (Object.keys(headers).length > 0) {
      lines.push("headers = {");
      for (const [k, v] of Object.entries(headers)) {
        lines.push(`    "${k}": "${v}",`);
      }
      lines.push("}");
    }
    if (parsed.data) {
      lines.push(`data = '${parsed.data}'`);
    }
    lines.push("");

    const method = parsed.method.toLowerCase();
    const kwargs: string[] = [];
    if (Object.keys(headers).length > 0) kwargs.push("headers=headers");
    if (parsed.data) kwargs.push("data=data");

    lines.push(`response = requests.${method}(url, ${kwargs.join(", ")})`);
  }

  lines.push("");
  lines.push("print(response.status_code)");
  lines.push("print(response.text)");

  return lines.join("\n");
}

function toGoCode(parsed: CurlParseResult): string {
  const lines: string[] = [];
  const headers: Record<string, string> = { ...parsed.headers };

  if (parsed.auth) {
    const encoded = btoa(parsed.auth);
    headers["Authorization"] = `Basic ${encoded}`;
  }

  lines.push('package main');
  lines.push("");
  lines.push("import (");
  lines.push('\t"fmt"');
  lines.push('\t"io"');
  lines.push('\t"net/http"');
  if (parsed.data) lines.push('\t"strings"');
  lines.push(")");
  lines.push("");

  lines.push("func main() {");
  const method = parsed.method;
  const hasBody = parsed.data !== null;

  if (hasBody) {
    lines.push(`\tbody := strings.NewReader(\`${parsed.data}\`)`);
    lines.push(`\treq, err := http.NewRequest("${method}", "${parsed.url}", body)`);
  } else {
    lines.push(`\treq, err := http.NewRequest("${method}", "${parsed.url}", nil)`);
  }
  lines.push("\tif err != nil {");
  lines.push("\t\tpanic(err)");
  lines.push("\t}");

  for (const [k, v] of Object.entries(headers)) {
    lines.push(`\treq.Header.Set("${k}", "${v}")`);
  }

  lines.push("");
  lines.push("\tresp, err := http.DefaultClient.Do(req)");
  lines.push("\tif err != nil {");
  lines.push("\t\tpanic(err)");
  lines.push("\t}");
  lines.push("\tdefer resp.Body.Close()");
  lines.push("");
  lines.push("\tbodyBytes, err := io.ReadAll(resp.Body)");
  lines.push("\tif err != nil {");
  lines.push("\t\tpanic(err)");
  lines.push("\t}");
  lines.push('');
  lines.push('\tfmt.Println(resp.StatusCode)');
  lines.push('\tfmt.Println(string(bodyBytes))');
  lines.push("}");

  return lines.join("\n");
}

type OutputLang = "fetch" | "axios" | "python" | "go";

export function CurlConverterTool() {
  const [curlInput, setCurlInput] = useState("");
  const [parsed, setParsed] = useState<CurlParseResult | null>(null);
  const [activeTab, setActiveTab] = useState<OutputLang>("fetch");
  const { copied, handleCopy } = useCopyState();

  const handleParse = () => {
    if (!curlInput.trim()) return;
    const result = parseCurl(curlInput);
    setParsed(result);
  };

  const outputCode = useMemo(() => {
    if (!parsed) return "";
    switch (activeTab) {
      case "fetch": return toFetchCode(parsed);
      case "axios": return toAxiosCode(parsed);
      case "python": return toPythonCode(parsed);
      case "go": return toGoCode(parsed);
    }
  }, [parsed, activeTab]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>cURL 命令</Label>
        <Textarea
          value={curlInput}
          onChange={(e) => setCurlInput(e.target.value)}
          placeholder={`输入 cURL 命令，例如：\ncurl -X POST https://api.example.com/data \\\n  -H "Content-Type: application/json" \\\n  -d '{"name": "test"}'`}
          className="min-h-[120px] font-mono text-sm"
        />
      </div>

      <Button onClick={handleParse} size="sm">
        解析并转换
      </Button>

      {parsed && (
        <>
          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge>{parsed.method}</Badge>
                <code className="text-xs font-mono break-all">{parsed.url}</code>
              </div>
              {Object.keys(parsed.headers).length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Headers:</span>
                  {Object.entries(parsed.headers).map(([k, v]) => (
                    <div key={k} className="text-xs font-mono">
                      <span className="font-semibold">{k}:</span> {v}
                    </div>
                  ))}
                </div>
              )}
              {parsed.data && (
                <div className="text-xs font-mono">
                  <span className="font-semibold">Data:</span> {parsed.data}
                </div>
              )}
              {parsed.auth && (
                <div className="text-xs font-mono">
                  <span className="font-semibold">Auth:</span> {parsed.auth}
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={(v) => { if (v !== null) setActiveTab(v as OutputLang); }}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="fetch">Fetch</TabsTrigger>
                <TabsTrigger value="axios">Axios</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="go">Go</TabsTrigger>
              </TabsList>
              <Button variant="ghost" size="sm" onClick={() => handleCopy(outputCode)}>
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "已复制" : "复制"}
              </Button>
            </div>
            {(["fetch", "axios", "python", "go"] as const).map((lang) => (
              <TabsContent key={lang} value={lang}>
                <Card>
                  <CardContent className="p-3">
                    <pre className="text-sm font-mono whitespace-pre-wrap break-all max-h-[400px] overflow-auto">
                      {outputCode}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  );
}
