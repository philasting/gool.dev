"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

interface FontTransform {
  name: string;
  description: string;
  transform: (char: string) => string;
}

const UPPERCASE_START = 0x41;
const UPPERCASE_END = 0x5a;
const LOWERCASE_START = 0x61;
const LOWERCASE_END = 0x7a;
const DIGIT_START = 0x30;
const DIGIT_END = 0x39;

function mapChar(char: string, upperOffset: number, lowerOffset: number, digitOffset: number): string {
  const code = char.codePointAt(0);
  if (code === undefined) return char;
  if (code >= UPPERCASE_START && code <= UPPERCASE_END) {
    return String.fromCodePoint(upperOffset + (code - UPPERCASE_START));
  }
  if (code >= LOWERCASE_START && code <= LOWERCASE_END) {
    return String.fromCodePoint(lowerOffset + (code - LOWERCASE_START));
  }
  if (code >= DIGIT_START && code <= DIGIT_END && digitOffset > 0) {
    return String.fromCodePoint(digitOffset + (code - DIGIT_START));
  }
  return char;
}

const FONT_TRANSFORMS: FontTransform[] = [
  {
    name: "Math Bold",
    description: "𝐁𝐨𝐥𝐝",
    transform: (c) => mapChar(c, 0x1d400, 0x1d41a, 0x1d7ce),
  },
  {
    name: "Math Italic",
    description: "𝐼𝑡𝑎𝑙𝑖𝑐",
    transform: (c) => mapChar(c, 0x1d434, 0x1d44e, 0),
  },
  {
    name: "Math Bold Italic",
    description: "𝑩𝒐𝒍𝒅 𝑰𝒕𝒂𝒍𝒊𝒄",
    transform: (c) => mapChar(c, 0x1d468, 0x1d482, 0x1d7ec),
  },
  {
    name: "Math Script",
    description: "𝒮𝒸𝓇𝒾𝓅𝓉",
    transform: (c) => {
      const code = c.codePointAt(0);
      if (code === undefined) return c;
      if (code >= UPPERCASE_START && code <= UPPERCASE_END) {
        const upperScriptOffsets = [
          0x1d49c, 0x1d49e, 0x1d49f, 0x2130, 0x2131,
          0x1d4a2, 0x210b, 0x2110, 0x2111, 0x1d4a6,
          0x2112, 0x2133, 0x2113, 0x2114, 0x1d4a9,
          0x211c, 0x211d, 0x1d4ac, 0x2128, 0x1d4ae,
          0x1d4af, 0x1d4b0, 0x1d4b1, 0x1d4b2, 0x1d4b3,
          0x1d4b4, 0x1d4b5,
        ];
        return String.fromCodePoint(upperScriptOffsets[code - UPPERCASE_START]);
      }
      return mapChar(c, 0, 0x1d4b6, 0);
    },
  },
  {
    name: "Math Bold Script",
    description: "𝓑𝓸𝓵𝓭 𝓢𝓬𝓻𝓲𝓹𝓽",
    transform: (c) => mapChar(c, 0x1d4d0, 0x1d4ea, 0),
  },
  {
    name: "Fraktur",
    description: "𝔉𝔯𝔞𝔨𝔱𝔲𝔯",
    transform: (c) => {
      const code = c.codePointAt(0);
      if (code === undefined) return c;
      if (code >= UPPERCASE_START && code <= UPPERCASE_END) {
        const upperFrakturOffsets = [
          0x1d504, 0x1d505, 0x212d, 0x1d507, 0x1d508,
          0x1d509, 0x1d50a, 0x210c, 0x2111, 0x1d50d,
          0x1d50e, 0x1d50f, 0x1d510, 0x1d511, 0x1d512,
          0x1d513, 0x211c, 0x1d515, 0x1d516, 0x1d517,
          0x1d518, 0x1d519, 0x1d51a, 0x1d51b, 0x1d51c,
          0x2128,
        ];
        return String.fromCodePoint(upperFrakturOffsets[code - UPPERCASE_START]);
      }
      return mapChar(c, 0, 0x1d51e, 0);
    },
  },
  {
    name: "Bold Fraktur",
    description: "𝕭𝖔𝖑𝖉 𝕱𝖗𝖆𝖐𝖙𝖚𝖗",
    transform: (c) => mapChar(c, 0x1d56c, 0x1d586, 0),
  },
  {
    name: "Double-Struck",
    description: "𝔻𝕠𝕦𝕓𝕝𝕖",
    transform: (c) => {
      const code = c.codePointAt(0);
      if (code === undefined) return c;
      if (code >= UPPERCASE_START && code <= UPPERCASE_END) {
        const upperDoubleOffsets = [
          0x1d538, 0x1d539, 0x2102, 0x1d53b, 0x1d53c,
          0x1d53d, 0x1d53e, 0x210d, 0x1d540, 0x1d541,
          0x1d542, 0x1d543, 0x1d544, 0x2115, 0x1d546,
          0x2119, 0x211a, 0x211d, 0x1d54a, 0x1d54b,
          0x1d54c, 0x1d54d, 0x1d54e, 0x1d54f, 0x1d550,
          0x2124,
        ];
        return String.fromCodePoint(upperDoubleOffsets[code - UPPERCASE_START]);
      }
      return mapChar(c, 0, 0x1d552, 0x1d7d8);
    },
  },
  {
    name: "Monospace",
    description: "𝙼𝚘𝚗𝚘",
    transform: (c) => mapChar(c, 0x1d670, 0x1d68a, 0x1d7f6),
  },
  {
    name: "Circled",
    description: "Ⓒⓘⓡⓒⓛⓔⓓ",
    transform: (c) => {
      const code = c.codePointAt(0);
      if (code === undefined) return c;
      if (code >= UPPERCASE_START && code <= UPPERCASE_END) {
        return String.fromCodePoint(0x24b6 + (code - UPPERCASE_START));
      }
      if (code >= LOWERCASE_START && code <= LOWERCASE_END) {
        return String.fromCodePoint(0x24d0 + (code - LOWERCASE_START));
      }
      if (code >= DIGIT_START && code <= DIGIT_END) {
        if (code === 0x30) return String.fromCodePoint(0x24ea);
        return String.fromCodePoint(0x2460 + (code - 0x31));
      }
      return c;
    },
  },
  {
    name: "Negative Circled",
    description: "🅂🅄🄱🅂🄴🅃",
    transform: (c) => {
      const code = c.codePointAt(0);
      if (code === undefined) return c;
      if (code >= UPPERCASE_START && code <= UPPERCASE_END) {
        return String.fromCodePoint(0x1f150 + (code - UPPERCASE_START));
      }
      return c;
    },
  },
  {
    name: "Squared",
    description: "🅂🅀🅄🄰🅁🄴🄳",
    transform: (c) => {
      const code = c.codePointAt(0);
      if (code === undefined) return c;
      if (code >= UPPERCASE_START && code <= UPPERCASE_END) {
        return String.fromCodePoint(0x1f130 + (code - UPPERCASE_START));
      }
      return c;
    },
  },
  {
    name: "Negative Squared",
    description: "🅱🅻🅾🅲🅺",
    transform: (c) => {
      const code = c.codePointAt(0);
      if (code === undefined) return c;
      if (code >= UPPERCASE_START && code <= UPPERCASE_END) {
        return String.fromCodePoint(0x1f170 + (code - UPPERCASE_START));
      }
      return c;
    },
  },
  {
    name: "Small Caps",
    description: "sᴍᴀʟʟ ᴄᴀᴘs",
    transform: (c) => {
      const code = c.codePointAt(0);
      if (code === undefined) return c;
      if (code >= LOWERCASE_START && code <= LOWERCASE_END) {
        const smallCapsMap: Record<number, number> = {
          0x61: 0x1d00, 0x62: 0x299, 0x63: 0x1d04, 0x64: 0x1d05,
          0x65: 0x1d07, 0x66: 0xa799, 0x67: 0x261, 0x68: 0x29c,
          0x69: 0x26a, 0x6a: 0x1d0a, 0x6b: 0x1d0b, 0x6c: 0x29f,
          0x6d: 0x1d0d, 0x6e: 0x274, 0x6f: 0x1d0f, 0x70: 0x1d18,
          0x71: 0x01eb, 0x72: 0x280, 0x73: 0xa731, 0x74: 0x1d1b,
          0x75: 0x1d1c, 0x76: 0x28b, 0x77: 0x1d1d, 0x78: 0x1d1e,
          0x79: 0x28f, 0x7a: 0x224,
        };
        const mapped = smallCapsMap[code];
        if (mapped) return String.fromCodePoint(mapped);
      }
      if (code >= UPPERCASE_START && code <= UPPERCASE_END) {
        return c;
      }
      return c;
    },
  },
  {
    name: "Fullwidth",
    description: "Ｆｕｌｌｗｉｄｔｈ",
    transform: (c) => {
      const code = c.codePointAt(0);
      if (code === undefined) return c;
      if (code >= UPPERCASE_START && code <= UPPERCASE_END) {
        return String.fromCodePoint(0xff21 + (code - UPPERCASE_START));
      }
      if (code >= LOWERCASE_START && code <= LOWERCASE_END) {
        return String.fromCodePoint(0xff41 + (code - LOWERCASE_START));
      }
      if (code >= DIGIT_START && code <= DIGIT_END) {
        return String.fromCodePoint(0xff10 + (code - DIGIT_START));
      }
      if (code === 0x20) return String.fromCodePoint(0x3000);
      return c;
    },
  },
];

export function FancyFontGeneratorTool() {
  const [input, setInput] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const results = useMemo(() => {
    if (!input) return [];
    return FONT_TRANSFORMS.map((font) => ({
      name: font.name,
      description: font.description,
      output: Array.from(input).map((ch) => font.transform(ch)).join(""),
    }));
  }, [input]);

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>输入文字</Label>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入要转换的文字，如 Hello World"
          className="text-lg"
        />
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result) => (
            <Card key={result.name} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">{result.name}</Badge>
                      <span className="text-xs text-muted-foreground">{result.description}</span>
                    </div>
                    <p className="text-lg break-all whitespace-pre-wrap">{result.output}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => handleCopy(result.output, result.name)}
                  >
                    {copiedKey === result.name ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!input && (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              输入文字后，将实时显示所有 Unicode 字体变换结果
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {FONT_TRANSFORMS.map((font) => (
                <Badge key={font.name} variant="outline" className="text-xs">
                  {font.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
