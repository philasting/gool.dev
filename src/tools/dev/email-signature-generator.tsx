"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

interface SignatureData {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
}

type TemplateType = "minimal" | "business" | "creative";

function generateMinimalHtml(data: SignatureData): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;color:#333;">
  <tr>
    <td style="padding-bottom:4px;">
      <strong style="font-size:16px;">${data.name || "你的名字"}</strong>
    </td>
  </tr>
  <tr>
    <td style="color:#666;padding-bottom:4px;">${data.title || "职位"}${data.company ? " · " + data.company : ""}</td>
  </tr>
  <tr>
    <td style="font-size:12px;color:#888;">
      ${data.phone ? data.phone : ""}
      ${data.phone && data.email ? " | " : ""}
      ${data.email ? `<a href="mailto:${data.email}" style="color:#4A90D9;text-decoration:none;">${data.email}</a>` : ""}
      ${(data.phone || data.email) && data.website ? " | " : ""}
      ${data.website ? `<a href="${data.website}" style="color:#4A90D9;text-decoration:none;">${data.website}</a>` : ""}
    </td>
  </tr>
</table>`;
}

function generateBusinessHtml(data: SignatureData): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;color:#333;">
  <tr>
    <td style="padding-right:16px;border-right:3px solid #2563EB;vertical-align:top;">
      <strong style="font-size:18px;color:#2563EB;">${data.name || "你的名字"}</strong>
      <br/>
      <span style="color:#666;font-size:13px;">${data.title || "职位"}</span>
      <br/>
      <span style="color:#999;font-size:12px;">${data.company || "公司"}</span>
    </td>
    <td style="padding-left:16px;font-size:12px;color:#666;vertical-align:top;">
      ${data.phone ? `<div style="margin-bottom:4px;">📞 ${data.phone}</div>` : ""}
      ${data.email ? `<div style="margin-bottom:4px;">✉️ <a href="mailto:${data.email}" style="color:#2563EB;text-decoration:none;">${data.email}</a></div>` : ""}
      ${data.website ? `<div>🌐 <a href="${data.website}" style="color:#2563EB;text-decoration:none;">${data.website}</a></div>` : ""}
    </td>
  </tr>
</table>`;
}

function generateCreativeHtml(data: SignatureData): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Georgia,serif;font-size:14px;color:#2D2D2D;">
  <tr>
    <td style="padding-bottom:8px;">
      <span style="font-size:22px;font-weight:bold;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
        ${data.name || "你的名字"}
      </span>
    </td>
  </tr>
  <tr>
    <td style="padding-bottom:6px;font-size:13px;">
      ${data.title || "职位"}<span style="color:#999;"> ✦ </span>${data.company || "公司"}
    </td>
  </tr>
  <tr>
    <td style="font-size:12px;color:#666;">
      ${data.phone ? data.phone : ""}
      ${data.phone && data.email ? " &bull; " : ""}
      ${data.email ? `<a href="mailto:${data.email}" style="color:#667eea;text-decoration:none;">${data.email}</a>` : ""}
      ${(data.phone || data.email) && data.website ? " &bull; " : ""}
      ${data.website ? `<a href="${data.website}" style="color:#667eea;text-decoration:none;">${data.website}</a>` : ""}
    </td>
  </tr>
</table>`;
}

function generateHtml(data: SignatureData, template: TemplateType): string {
  switch (template) {
    case "minimal": return generateMinimalHtml(data);
    case "business": return generateBusinessHtml(data);
    case "creative": return generateCreativeHtml(data);
  }
}

export function EmailSignatureGeneratorTool() {
  const [data, setData] = useState<SignatureData>({
    name: "",
    title: "",
    company: "",
    phone: "",
    email: "",
    website: "",
  });
  const [template, setTemplate] = useState<TemplateType>("minimal");
  const { copied, handleCopy } = useCopyState();

  const htmlOutput = useMemo(() => generateHtml(data, template), [data, template]);

  const updateField = (field: keyof SignatureData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const fields: { key: keyof SignatureData; label: string; placeholder: string; type?: string }[] = [
    { key: "name", label: "姓名", placeholder: "张三" },
    { key: "title", label: "职位", placeholder: "高级前端工程师" },
    { key: "company", label: "公司", placeholder: "Gool 科技" },
    { key: "phone", label: "电话", placeholder: "+86 138-0000-0000", type: "tel" },
    { key: "email", label: "邮箱", placeholder: "zhangsan@example.com", type: "email" },
    { key: "website", label: "网站", placeholder: "https://example.com", type: "url" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label className="text-sm">{field.label}</Label>
            <Input
              type={field.type || "text"}
              value={data[field.key]}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label className="text-sm">选择模板</Label>
        <Tabs value={template} onValueChange={(v) => { if (v !== null) setTemplate(v as TemplateType); }}>
          <TabsList>
            <TabsTrigger value="minimal">简洁</TabsTrigger>
            <TabsTrigger value="business">商务</TabsTrigger>
            <TabsTrigger value="creative">创意</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardContent className="p-4">
          <Label className="text-sm mb-2 block">预览效果</Label>
          <div
            className="border border-border rounded-lg p-4 bg-white"
            dangerouslySetInnerHTML={{ __html: htmlOutput }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">HTML 代码</Label>
            <Button variant="ghost" size="sm" onClick={() => handleCopy(htmlOutput)}>
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? "已复制" : "复制 HTML"}
            </Button>
          </div>
          <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-muted p-2 rounded max-h-[200px] overflow-auto">
            {htmlOutput}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
