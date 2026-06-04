"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Copy, Check, Type } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

type FontName = "block" | "standard" | "shadow";

// ============ ASCII Font Definitions ============
// Each character is represented as an array of strings (lines).
// We define A-Z, 0-9, and space for each font.

const BLOCK_FONT: Record<string, string[]> = {};
const STANDARD_FONT: Record<string, string[]> = {};
const SHADOW_FONT: Record<string, string[]> = {};

// Block font using █ characters (5 lines tall)
(function initBlockFont() {
  const chars: Record<string, string[]> = {
    "A": [" ██ ", "█  █", "████", "█  █", "█  █"],
    "B": ["███ ", "█  █", "███ ", "█  █", "███ "],
    "C": [" ███", "█   ", "█   ", "█   ", " ███"],
    "D": ["███ ", "█  █", "█  █", "█  █", "███ "],
    "E": ["████", "█   ", "███ ", "█   ", "████"],
    "F": ["████", "█   ", "███ ", "█   ", "█   "],
    "G": [" ███", "█   ", "█ ██", "█  █", " ███"],
    "H": ["█  █", "█  █", "████", "█  █", "█  █"],
    "I": ["███", " █ ", " █ ", " █ ", "███"],
    "J": ["████", "   █", "   █", "█  █", " ██ "],
    "K": ["█  █", "█ █ ", "██  ", "█ █ ", "█  █"],
    "L": ["█   ", "█   ", "█   ", "█   ", "████"],
    "M": ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
    "N": ["█   █", "██  █", "█ █ █", "█  ██", "█   █"],
    "O": [" ██ ", "█  █", "█  █", "█  █", " ██ "],
    "P": ["███ ", "█  █", "███ ", "█   ", "█   "],
    "Q": [" ██ ", "█  █", "█ ██", " █ █", "  ██"],
    "R": ["███ ", "█  █", "███ ", "█ █ ", "█  █"],
    "S": [" ███", "█   ", " ██ ", "   █", "███ "],
    "T": ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
    "U": ["█  █", "█  █", "█  █", "█  █", " ██ "],
    "V": ["█   █", "█   █", " █ █ ", " █ █ ", "  █  "],
    "W": ["█   █", "█   █", "█ █ █", "██ ██", "█   █"],
    "X": ["█  █", "█  █", " ██ ", "█  █", "█  █"],
    "Y": ["█   █", " █ █ ", "  █  ", "  █  ", "  █  "],
    "Z": ["████", "   █", "  █ ", " █  ", "████"],
    "0": [" ██ ", "█ ██", "█ █ █", "██ █", " ██ "],
    "1": [" █ ", "██ ", " █ ", " █ ", "███"],
    "2": [" ██ ", "█  █", "  █ ", " █  ", "████"],
    "3": ["███ ", "   █", " ██ ", "   █", "███ "],
    "4": ["█  █", "█  █", "████", "   █", "   █"],
    "5": ["████", "█   ", "███ ", "   █", "███ "],
    "6": [" ███", "█   ", "███ ", "█  █", " ██ "],
    "7": ["████", "   █", "  █ ", " █  ", " █  "],
    "8": [" ██ ", "█  █", " ██ ", "█  █", " ██ "],
    "9": [" ██ ", "█  █", " ███", "   █", "███ "],
    " ": ["   ", "   ", "   ", "   ", "   "],
  };
  Object.assign(BLOCK_FONT, chars);
})();

// Standard font using ASCII characters (6 lines tall)
(function initStandardFont() {
  const chars: Record<string, string[]> = {
    "A": ["    #    ", "   # #   ", "  #   #  ", " ####### ", "#       #", "#       #"],
    "B": ["###### ", "#     #", "###### ", "#     #", "#     #", "###### "],
    "C": [" ##### ", "#     #", "#      ", "#      ", "#     #", " ##### "],
    "D": ["###### ", "#     #", "#     #", "#     #", "#     #", "###### "],
    "E": ["#######", "#      ", "#####  ", "#      ", "#      ", "#######"],
    "F": ["#######", "#      ", "#####  ", "#      ", "#      ", "#      "],
    "G": [" ##### ", "#     #", "#      ", "#  ####", "#     #", " ##### "],
    "H": ["#     #", "#     #", "#######", "#     #", "#     #", "#     #"],
    "I": ["#####", "  #  ", "  #  ", "  #  ", "  #  ", "#####"],
    "J": ["#######", "      #", "      #", "#     #", "#     #", " ##### "],
    "K": ["#    #", "#  # ", "###  ", "#  # ", "#   #", "#    #"],
    "L": ["#      ", "#      ", "#      ", "#      ", "#      ", "#######"],
    "M": ["#     #", "##   ##", "# # # #", "#  #  #", "#     #", "#     #"],
    "N": ["#     #", "##    #", "# #   #", "#  #  #", "#   # #", "#    ##"],
    "O": [" ##### ", "#     #", "#     #", "#     #", "#     #", " ##### "],
    "P": ["###### ", "#     #", "###### ", "#      ", "#      ", "#      "],
    "Q": [" ##### ", "#     #", "#     #", "#   # #", "#    # ", " #### #"],
    "R": ["###### ", "#     #", "###### ", "#  #   ", "#   #  ", "#    # "],
    "S": [" ##### ", "#      ", " ##### ", "      #", "      #", " ##### "],
    "T": ["#######", "   #   ", "   #   ", "   #   ", "   #   ", "   #   "],
    "U": ["#     #", "#     #", "#     #", "#     #", "#     #", " ##### "],
    "V": ["#     #", "#     #", " #   # ", " #   # ", "  # #  ", "   #   "],
    "W": ["#     #", "#     #", "#  #  #", "# # # #", "##   ##", "#     #"],
    "X": ["#     #", " #   # ", "  # #  ", "  # #  ", " #   # ", "#     #"],
    "Y": ["#     #", " #   # ", "  # #  ", "   #   ", "   #   ", "   #   "],
    "Z": ["#######", "     # ", "    #  ", "   #   ", "  #    ", "#######"],
    "0": [" ##### ", "#    ##", "#   # #", "#  #  #", "# #   #", " ##### "],
    "1": ["  #  ", " ##  ", "  #  ", "  #  ", "  #  ", "#####"],
    "2": [" ##### ", "#     #", "     # ", "   #   ", " #     ", "#######"],
    "3": ["######", "     #", " #####", "     #", "     #", "######"],
    "4": ["#     #", "#     #", "#######", "      #", "      #", "      #"],
    "5": ["#######", "#      ", "###### ", "      #", "      #", "###### "],
    "6": [" ##### ", "#      ", "###### ", "#     #", "#     #", " ##### "],
    "7": ["#######", "     # ", "    #  ", "   #   ", "  #    ", "  #    "],
    "8": [" ##### ", "#     #", " ##### ", "#     #", "#     #", " ##### "],
    "9": [" ##### ", "#     #", " ######", "      #", "      #", " ##### "],
    " ": ["    ", "    ", "    ", "    ", "    ", "    "],
  };
  Object.assign(STANDARD_FONT, chars);
})();

// Shadow font (5 lines, with shadow effect)
(function initShadowFont() {
  const chars: Record<string, string[]> = {
    "A": ["  ___  ", " / _ \\ ", "| |_| |", "|  _  |", "|_| |_|"],
    "B": ["|___  |", "|   \\ |", "| |\\ ||", "| | \\||", "|___|||"],
    "C": [" ____ ", "/ ___|", "| |   ", "| |___", " \\____|"],
    "D": ["|===\\ ", "| |  |", "| |__|", "| |   ", "|===\\/"],
    "E": ["|====", "|  __", "|===_", "|  __", "|===="],
    "F": ["|====", "|  __", "|===_", "|    ", "|    "],
    "G": [" ____ ", "|  __|", "| |___", "|  _  |", "|_____|"],
    "H": ["|  |  |", "|  |  |", "|=====|", "|  |  |", "|  |  |"],
    "I": [" ___ ", "|_ _|", " | | ", " | | ", "|___|"],
    "J": ["  ____", " |  _|", " | |  ", "_| |_ ", "|_____|"],
    "K": ["|  /|", "| / |", "|/  |", "|\\  |", "| \\ |"],
    "L": ["|    ", "|    ", "|    ", "|    ", "|____"],
    "M": ["|\\     /|", "| \\   / |", "|  \\ /  |", "|   V   |", "|       |"],
    "N": ["|\\   |", "| \\  |", "|  \\ |", "|   \\|", "|    |"],
    "O": [" ____ ", "|    |", "|    |", "|    |", "|____|"],
    "P": ["|===\\ ", "|   | |", "|===|/", "|    ", "|    "],
    "Q": [" ____ ", "|    |", "|  | |", "|  \\ |", " \\__\\|"],
    "R": ["|===\\ ", "|   | |", "|===|/", "|  \\ |", "|   \\|"],
    "S": [" ____", "/ ___|", "\\___ \\", " ___| |", "\\____/"],
    "T": ["=======", "  | |  ", "  | |  ", "  | |  ", "  |_|  "],
    "U": ["|    |", "|    |", "|    |", "|    |", "|____|"],
    "V": ["\\    /", " \\  / ", "  \\/  ", "  /\\  ", " /  \\ "],
    "W": ["|        |", "|   /\\   |", "|  /  \\  |", "| /    \\ |", "|/      \\|"],
    "X": ["\\   /", " \\ / ", "  X  ", " / \\ ", "/   \\"],
    "Y": ["\\   /", " \\ / ", "  |  ", "  |  ", "  |  "],
    "Z": ["_____", "  /  ", " /   ", "/    ", "_____/"],
    "0": [" ___ ", "|  /|", "| | |", "|  \\|", " --- "],
    "1": [" _ ", "/|", " |", " |", " |_|"],
    "2": [" ___ ", "|__  ", "  / |", " / / ", "|_/  "],
    "3": [" ___ ", "|__ |", "  _| ", " |__ ", "|___|"],
    "4": ["|  |", "|  |", "|__|", " / |", "   |"],
    "5": [" ____", "| __ ", "||__|", " |  |", "|____|"],
    "6": [" ___ ", "|   |", "|___|", "|   |", "|___|"],
    "7": ["_____", "   / ", "  /  ", " /   ", "/    "],
    "8": [" ___ ", "|   |", "|___|", "|   |", "|___|"],
    "9": [" ___ ", "|   |", "|___|", "   / ", "  /  "],
    " ": ["   ", "   ", "   ", "   ", "   "],
  };
  Object.assign(SHADOW_FONT, chars);
})();

const FONT_MAP: Record<FontName, Record<string, string[]>> = {
  block: BLOCK_FONT,
  standard: STANDARD_FONT,
  shadow: SHADOW_FONT,
};

const FONT_LABELS: Record<FontName, string> = {
  block: "Block（块状）",
  standard: "Standard（标准）",
  shadow: "Shadow（阴影）",
};

function generateAsciiArt(text: string, fontName: FontName): string {
  const font = FONT_MAP[fontName];
  const upperText = text.toUpperCase();
  const chars = upperText.split("");

  // Determine line count from first available char
  const lineCount = Object.values(font)[0]?.length ?? 5;
  const lines: string[] = [];

  for (let line = 0; line < lineCount; line++) {
    const lineParts: string[] = [];
    for (const ch of chars) {
      const charDef = font[ch];
      if (charDef && charDef[line] !== undefined) {
        lineParts.push(charDef[line]);
      } else {
        // Unknown char: use space equivalent width
        const defaultWidth = Object.values(font)[0]?.[0]?.length ?? 3;
        lineParts.push(" ".repeat(defaultWidth));
      }
    }
    lines.push(lineParts.join("  "));
  }

  return lines.join("\n");
}

export function AsciiArtTool() {
  const [inputText, setInputText] = useState("HELLO");
  const [fontName, setFontName] = useState<FontName>("block");
  const { copied, handleCopy } = useCopyState();

  const asciiArt = useMemo(() => {
    if (!inputText.trim()) return "";
    return generateAsciiArt(inputText, fontName);
  }, [inputText, fontName]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-2">
          <Label>输入文字</Label>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="输入英文/数字"
            maxLength={20}
          />
          <p className="text-xs text-muted-foreground">支持 A-Z、0-9，最多 20 个字符</p>
        </div>
        <div className="w-full sm:w-48 space-y-2">
          <Label>字体</Label>
          <Select value={fontName} onValueChange={(v) => setFontName(v as FontName)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FONT_LABELS) as FontName[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {FONT_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {asciiArt && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">ASCII 艺术字</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCopy(asciiArt)}
              >
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "已复制" : "复制"}
              </Button>
            </div>
            <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-xs sm:text-sm leading-tight font-mono whitespace-pre">
              {asciiArt}
            </pre>
          </CardContent>
        </Card>
      )}

      {!asciiArt && inputText.trim() === "" && (
        <div className="text-center text-muted-foreground py-8">
          <Type className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">输入文字生成 ASCII 艺术字横幅</p>
        </div>
      )}
    </div>
  );
}
