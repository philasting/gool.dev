"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, Trash2, Lock, Unlock, ShieldCheck, AlertTriangle } from "lucide-react";
import { PDFDocument } from "pdf-lib";

type EncryptMode = "encrypt" | "decrypt";

export function PdfEncryptTool() {
  const [mode, setMode] = useState<EncryptMode>("encrypt");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [userPassword, setUserPassword] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [decryptPassword, setDecryptPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("请上传 PDF 文件");
      return;
    }
    setPdfFile(file);
    setError("");
    setSuccess("");
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      setPageCount(pdf.getPageCount());
    } catch {
      setPageCount(0);
    }
  }, []);

  const handleEncrypt = async () => {
    if (!pdfFile) return;
    if (!userPassword) {
      setError("请输入用户密码（打开密码）");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const buffer = await pdfFile.arrayBuffer();
      const sourcePdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
      pages.forEach((p) => newPdf.addPage(p));

      const pdfBytes = await newPdf.save({
        userPassword: userPassword,
        ownerPassword: ownerPassword || userPassword,
      } as any);

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFile.name.replace(/\.pdf$/i, "_encrypted.pdf");
      a.click();
      URL.revokeObjectURL(url);

      setSuccess("加密成功！PDF 已添加密码保护");
    } catch (e) {
      setError(`加密失败：${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async () => {
    if (!pdfFile) return;
    if (!decryptPassword) {
      setError("请输入密码以解密 PDF");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const buffer = await pdfFile.arrayBuffer();
      const sourcePdf = await PDFDocument.load(buffer, { password: decryptPassword } as any);
      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
      pages.forEach((p) => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFile.name.replace(/\.pdf$/i, "_decrypted.pdf");
      a.click();
      URL.revokeObjectURL(url);

      setSuccess("解密成功！密码保护已移除");
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("password") || msg.includes("Password") || msg.includes("decrypt")) {
        setError("解密失败：密码不正确或 PDF 无法解密");
      } else {
        setError(`解密失败：${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPdfFile(null);
    setPageCount(0);
    setUserPassword("");
    setOwnerPassword("");
    setDecryptPassword("");
    setError("");
    setSuccess("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">点击或拖拽 PDF 文件到此处</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {pdfFile && (
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium truncate">{pdfFile.name}</p>
                <p className="text-xs text-muted-foreground">{pageCount} 页</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClear}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {pdfFile && (
        <Tabs value={mode} onValueChange={(v) => { setMode(v as EncryptMode); setError(""); setSuccess(""); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="encrypt">
              <Lock className="h-3.5 w-3.5 mr-1" /> 加密
            </TabsTrigger>
            <TabsTrigger value="decrypt">
              <Unlock className="h-3.5 w-3.5 mr-1" /> 解密
            </TabsTrigger>
          </TabsList>

          <TabsContent value="encrypt" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>用户密码（打开密码）*</Label>
              <Input
                type="password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="输入打开 PDF 时需要的密码"
              />
              <p className="text-xs text-muted-foreground">打开 PDF 文件时需要输入此密码</p>
            </div>
            <div className="space-y-2">
              <Label>所有者密码（权限密码）</Label>
              <Input
                type="password"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="可选，默认与用户密码相同"
              />
              <p className="text-xs text-muted-foreground">用于控制打印、编辑等权限，不填则与用户密码相同</p>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-xs">请牢记密码，忘记密码后将无法恢复文件内容</p>
            </div>

            <Button onClick={handleEncrypt} disabled={loading || !userPassword} className="w-full">
              {loading ? "加密中..." : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" /> 加密并下载
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="decrypt" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>输入密码</Label>
              <Input
                type="password"
                value={decryptPassword}
                onChange={(e) => setDecryptPassword(e.target.value)}
                placeholder="输入 PDF 的打开密码"
              />
              <p className="text-xs text-muted-foreground">输入正确密码后，将生成一个无密码保护的 PDF</p>
            </div>

            <Button onClick={handleDecrypt} disabled={loading || !decryptPassword} className="w-full">
              {loading ? "解密中..." : (
                <>
                  <Download className="h-4 w-4 mr-2" /> 解密并下载
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}
    </div>
  );
}
