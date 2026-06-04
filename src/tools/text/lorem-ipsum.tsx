"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check, Shuffle, FileText } from "lucide-react";
import { useCopyState, copyToClipboard } from "@/components/tool/ToolLayout";

// ─── Lorem Ipsum Words ───

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum", "perspiciatis", "unde",
  "omnis", "iste", "natus", "error", "voluptatem", "accusantium", "doloremque",
  "laudantium", "totam", "rem", "aperiam", "eaque", "ipsa", "quae", "ab", "illo",
  "inventore", "veritatis", "quasi", "architecto", "beatae", "vitae", "dicta",
  "explicabo", "nemo", "ipsam", "voluptas", "aspernatur", "aut", "odit",
  "fugit", "consequuntur", "magni", "dolores", "eos", "ratione", "sequi",
  "nesciunt", "neque", "porro", "quisquam", "dolorem", "adipisci",
];

// ─── Chinese placeholder components ───

const ZH_SUBJECTS = [
  "据我所知", "众所周知", "不可否认", "一般来说", "从某种意义上说",
  "研究表明", "统计数据表明", "专家指出", "有观点认为", "事实证明",
  "可以说", "众所周知的是", "学界普遍认为", "历史告诉我们", "经验表明",
];

const ZH_PREDICATES = [
  "这个问题具有重要意义", "我们需要深入思考", "相关方面应予以重视",
  "这引发了广泛讨论", "各方意见不一", "需要综合考量多方面因素",
  "这一问题值得进一步探讨", "实践证明了这一点", "这体现了深刻的道理",
  "相关研究仍在进行中", "未来发展值得期待", "这已成为社会关注的焦点",
];

const ZH_TRANSITIONS = [
  "与此同时", "此外", "另一方面", "不仅如此", "更重要的是",
  "从另一个角度看", "在此基础上", "值得注意的是", "进一步来说",
  "归根结底", "总的来说", "综上所述", "由此可见", "换言之",
  "与此同时", "实际上", "事实上", "当然", "然而", "不过",
];

/** Generate a random item from array */
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generate a random English sentence */
function generateEnglishSentence(): string {
  const wordCount = 8 + Math.floor(Math.random() * 12);
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(randomPick(LOREM_WORDS));
  }
  // Capitalize first letter
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(" ") + ".";
}

/** Generate a random English paragraph */
function generateEnglishParagraph(sentenceCount: number): string {
  const sentences: string[] = [];
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(generateEnglishSentence());
  }
  return sentences.join(" ");
}

/** Generate a random Chinese sentence */
function generateChineseSentence(): string {
  const subject = randomPick(ZH_SUBJECTS);
  const predicate = randomPick(ZH_PREDICATES);
  return `${subject}，${predicate}。`;
}

/** Generate a random Chinese paragraph */
function generateChineseParagraph(sentenceCount: number): string {
  const sentences: string[] = [];
  for (let i = 0; i < sentenceCount; i++) {
    if (i > 0 && Math.random() > 0.5) {
      sentences.push(randomPick(ZH_TRANSITIONS));
    }
    sentences.push(generateChineseSentence());
  }
  return sentences.join("");
}

type Language = "en" | "zh";

export function LoremIpsumTool() {
  const [paragraphCount, setParagraphCount] = useState("3");
  const [sentenceCount, setSentenceCount] = useState("5");
  const [language, setLanguage] = useState<Language>("en");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const pCount = Math.max(1, Math.min(10, parseInt(paragraphCount, 10) || 3));
    const sCount = Math.max(3, Math.min(10, parseInt(sentenceCount, 10) || 5));
    const paragraphs: string[] = [];

    for (let i = 0; i < pCount; i++) {
      if (language === "en") {
        paragraphs.push(generateEnglishParagraph(sCount));
      } else {
        paragraphs.push(generateChineseParagraph(sCount));
      }
    }

    setOutput(paragraphs.join("\n\n"));
  };

  const handleCopy = async () => {
    if (!output) return;
    await copyToClipboard(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Options */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-sm">段落数</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={paragraphCount}
                onChange={(e) => setParagraphCount(e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <Label className="text-sm">每段句子数</Label>
              <Input
                type="number"
                min={3}
                max={10}
                value={sentenceCount}
                onChange={(e) => setSentenceCount(e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <Label className="text-sm">语言</Label>
              <Select
                value={language}
                onValueChange={(v) => setLanguage(v as Language)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={generate} size="sm">
              <Shuffle className="h-4 w-4 mr-1" /> 生成
            </Button>
            <Button
              onClick={handleCopy}
              variant="secondary"
              size="sm"
              disabled={!output}
            >
              {copied ? (
                <Check className="h-4 w-4 mr-1" />
              ) : (
                <Copy className="h-4 w-4 mr-1" />
              )}
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Output */}
      <Card>
        <CardContent className="p-4">
          {output ? (
            <div className="space-y-4">
              {output.split("\n\n").map((para, i) => (
                <p key={i} className="text-sm leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mb-2" />
              <p className="text-sm">点击生成按钮创建占位文本</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
