"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Copy, Check } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

interface MetaField {
  key: string;
  label: string;
  placeholder: string;
}

const META_FIELDS: MetaField[] = [
  { key: "title", label: "Title", placeholder: "页面标题" },
  { key: "description", label: "Description", placeholder: "页面描述" },
  { key: "keywords", label: "Keywords", placeholder: "关键词1, 关键词2" },
  { key: "author", label: "Author", placeholder: "作者" },
  { key: "og:title", label: "OG Title", placeholder: "Open Graph 标题" },
  { key: "og:description", label: "OG Description", placeholder: "Open Graph 描述" },
  { key: "og:image", label: "OG Image", placeholder: "https://example.com/image.png" },
  { key: "og:url", label: "OG URL", placeholder: "https://example.com" },
  { key: "twitter:card", label: "Twitter Card", placeholder: "summary / summary_large_image" },
  { key: "twitter:title", label: "Twitter Title", placeholder: "Twitter 标题" },
  { key: "twitter:description", label: "Twitter Description", placeholder: "Twitter 描述" },
  { key: "twitter:image", label: "Twitter Image", placeholder: "https://example.com/image.png" },
  { key: "viewport", label: "Viewport", placeholder: "width=device-width, initial-scale=1" },
  { key: "robots", label: "Robots", placeholder: "index, follow" },
];

export function MetaTagGeneratorTool() {
  const [values, setValues] = useState<Record<string, string>>({
    viewport: "width=device-width, initial-scale=1",
    robots: "index, follow",
    "twitter:card": "summary_large_image",
  });
  const { copied, handleCopy } = useCopyState();

  const updateValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const htmlCode = useMemo(() => {
    const lines: string[] = [];
    const v = values;

    if (v.title) lines.push(`<title>${v.title}</title>`);
    if (v.description) lines.push(`<meta name="description" content="${v.description}" />`);
    if (v.keywords) lines.push(`<meta name="keywords" content="${v.keywords}" />`);
    if (v.author) lines.push(`<meta name="author" content="${v.author}" />`);
    if (v.viewport) lines.push(`<meta name="viewport" content="${v.viewport}" />`);
    if (v.robots) lines.push(`<meta name="robots" content="${v.robots}" />`);

    // Open Graph
    if (v["og:title"] || v["og:description"] || v["og:image"] || v["og:url"]) {
      lines.push("");
      lines.push("<!-- Open Graph -->");
      if (v["og:title"]) lines.push(`<meta property="og:title" content="${v["og:title"]}" />`);
      if (v["og:description"]) lines.push(`<meta property="og:description" content="${v["og:description"]}" />`);
      if (v["og:image"]) lines.push(`<meta property="og:image" content="${v["og:image"]}" />`);
      if (v["og:url"]) lines.push(`<meta property="og:url" content="${v["og:url"]}" />`);
    }

    // Twitter
    if (v["twitter:card"] || v["twitter:title"] || v["twitter:description"] || v["twitter:image"]) {
      lines.push("");
      lines.push("<!-- Twitter Card -->");
      if (v["twitter:card"]) lines.push(`<meta name="twitter:card" content="${v["twitter:card"]}" />`);
      if (v["twitter:title"]) lines.push(`<meta name="twitter:title" content="${v["twitter:title"]}" />`);
      if (v["twitter:description"]) lines.push(`<meta name="twitter:description" content="${v["twitter:description"]}" />`);
      if (v["twitter:image"]) lines.push(`<meta name="twitter:image" content="${v["twitter:image"]}" />`);
    }

    return lines.join("\n");
  }, [values]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Form */}
        <div className="space-y-3">
          {/* Basic */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">基本标签</h3>
            {META_FIELDS.filter((f) => !f.key.startsWith("og:") && !f.key.startsWith("twitter:")).map((field) => (
              <div key={field.key} className="space-y-1">
                <Label className="text-xs">{field.label}</Label>
                <Input
                  value={values[field.key] ?? ""}
                  onChange={(e) => updateValue(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="text-sm h-9"
                />
              </div>
            ))}
          </div>

          <Separator />

          {/* Open Graph */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Open Graph</h3>
            {META_FIELDS.filter((f) => f.key.startsWith("og:")).map((field) => (
              <div key={field.key} className="space-y-1">
                <Label className="text-xs">{field.label}</Label>
                <Input
                  value={values[field.key] ?? ""}
                  onChange={(e) => updateValue(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="text-sm h-9"
                />
              </div>
            ))}
          </div>

          <Separator />

          {/* Twitter */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Twitter Card</h3>
            {META_FIELDS.filter((f) => f.key.startsWith("twitter:")).map((field) => (
              <div key={field.key} className="space-y-1">
                <Label className="text-xs">{field.label}</Label>
                <Input
                  value={values[field.key] ?? ""}
                  onChange={(e) => updateValue(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="text-sm h-9"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">生成的 HTML</label>
            <Button variant="ghost" size="sm" onClick={() => handleCopy(htmlCode)} disabled={!htmlCode}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          <Card>
            <CardContent className="p-3">
              <pre className="text-sm font-mono whitespace-pre-wrap break-all max-h-[500px] overflow-auto custom-scrollbar">
                {htmlCode || "填写左侧表单，实时生成 Meta 标签代码"}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
