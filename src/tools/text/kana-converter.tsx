"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, Languages } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

type ConversionMode = "hira-to-kata" | "kata-to-hira" | "romaji-to-hira" | "romaji-to-kata";

// Hiragana to Katakana mapping (Gojūon)
const HIRA_TO_KATA: Record<string, string> = {
  "あ":"ア","い":"イ","う":"ウ","え":"エ","お":"オ",
  "か":"カ","き":"キ","く":"ク","け":"ケ","こ":"コ",
  "さ":"サ","し":"シ","す":"ス","せ":"セ","そ":"ソ",
  "た":"タ","ち":"チ","つ":"ツ","て":"テ","と":"ト",
  "な":"ナ","に":"ニ","ぬ":"ヌ","ね":"ネ","の":"ノ",
  "は":"ハ","ひ":"ヒ","ふ":"フ","へ":"ヘ","ほ":"ホ",
  "ま":"マ","み":"ミ","む":"ム","め":"メ","も":"モ",
  "や":"ヤ","ゆ":"ユ","よ":"ヨ",
  "ら":"ラ","り":"リ","る":"ル","れ":"レ","ろ":"ロ",
  "わ":"ワ","を":"ヲ","ん":"ン",
  // Dakuten
  "が":"ガ","ぎ":"ギ","ぐ":"グ","げ":"ゲ","ご":"ゴ",
  "ざ":"ザ","じ":"ジ","ず":"ズ","ぜ":"ゼ","ぞ":"ゾ",
  "だ":"ダ","ぢ":"ヂ","づ":"ヅ","で":"デ","ど":"ド",
  "ば":"バ","び":"ビ","ぶ":"ブ","べ":"ベ","ぼ":"ボ",
  // Handakuten
  "ぱ":"パ","ぴ":"ピ","ぷ":"プ","ぺ":"ペ","ぽ":"ポ",
  // Small characters
  "ぁ":"ァ","ぃ":"ィ","ぅ":"ゥ","ぇ":"ェ","ぉ":"ォ",
  "ゃ":"ャ","ゅ":"ュ","ょ":"ョ","っ":"ッ","ゎ":"ヮ",
  // Special
  "ゐ":"ヰ","ゑ":"ヱ",
};

const KATA_TO_HIRA: Record<string, string> = {};
for (const [h, k] of Object.entries(HIRA_TO_KATA)) {
  KATA_TO_HIRA[k] = h;
}

// Romaji to Hiragana mapping (ordered by length for correct matching)
const ROMAJI_TO_HIRA: [string, string][] = [
  // Double consonants
  ["kka","っか"],["kki","っき"],["kku","っく"],["kke","っけ"],["kko","っこ"],
  ["ssa","っさ"],["ssi","っし"],["ssu","っす"],["sse","っせ"],["sso","っそ"],
  ["tta","った"],["tti","っち"],["ttu","っつ"],["tte","って"],["tto","っと"],
  ["nna","っな"],["nni","っに"],["nnu","っぬ"],["nne","っね"],["nno","っの"],
  ["hha","っは"],["hhi","っひ"],["hhu","っふ"],["hhe","っへ"],["hho","っほ"],
  ["mma","っま"],["mmi","っみ"],["mmu","っむ"],["mme","っめ"],["mmo","っも"],
  ["yya","っや"],["yyu","っゆ"],["yyo","っよ"],
  ["rra","っら"],["rri","っり"],["rru","っる"],["rre","っれ"],["rro","っろ"],
  ["gga","っが"],["ggi","っぎ"],["ggu","っぐ"],["gge","っげ"],["ggo","っご"],
  ["zza","っざ"],["zzi","っじ"],["zzu","っず"],["zze","っぜ"],["zzo","っぞ"],
  ["dda","っだ"],["ddi","っぢ"],["ddu","っづ"],["dde","っで"],["ddo","っど"],
  ["bba","っば"],["bbi","っび"],["bbu","っぶ"],["bbe","っべ"],["bbo","っぼ"],
  ["ppa","っぱ"],["ppi","っぴ"],["ppu","っぷ"],["ppe","っぺ"],["ppo","っぽ"],
  // 3-char
  ["sha","しゃ"],["shi","し"],["shu","しゅ"],["she","しぇ"],["sho","しょ"],
  ["cha","ちゃ"],["chi","ち"],["chu","ちゅ"],["che","ちぇ"],["cho","ちょ"],
  ["tsa","つぁ"],["tsi","つぃ"],["tsu","つ"],["tse","つぇ"],["tso","つぉ"],
  ["nya","にゃ"],["nyu","にゅ"],["nyo","にょ"],
  ["hya","ひゃ"],["hyu","ひゅ"],["hyo","ひょ"],
  ["mya","みゃ"],["myu","みゅ"],["myo","みょ"],
  ["rya","りゃ"],["ryu","りゅ"],["ryo","りょ"],
  ["gya","ぎゃ"],["gyu","ぎゅ"],["gyo","ぎょ"],
  ["zya","じゃ"],["zyu","じゅ"],["zyo","じょ"],
  ["bya","びゃ"],["byu","びゅ"],["byo","びょ"],
  ["pya","ぴゃ"],["pyu","ぴゅ"],["pyo","ぴょ"],
  // Special ja/ju/jo
  ["ja","じゃ"],["ju","じゅ"],["je","じぇ"],["jo","じょ"],
  // 2-char
  ["ka","か"],["ki","き"],["ku","く"],["ke","け"],["ko","こ"],
  ["sa","さ"],["si","し"],["su","す"],["se","せ"],["so","そ"],
  ["ta","た"],["ti","ち"],["tu","つ"],["te","て"],["to","と"],
  ["na","な"],["ni","に"],["nu","ぬ"],["ne","ね"],["no","の"],
  ["ha","は"],["hi","ひ"],["hu","ふ"],["fu","ふ"],["he","へ"],["ho","ほ"],
  ["ma","ま"],["mi","み"],["mu","む"],["me","め"],["mo","も"],
  ["ya","や"],["yu","ゆ"],["yo","よ"],
  ["ra","ら"],["ri","り"],["ru","る"],["re","れ"],["ro","ろ"],
  ["wa","わ"],["wo","を"],
  ["ga","が"],["gi","ぎ"],["gu","ぐ"],["ge","げ"],["go","ご"],
  ["za","ざ"],["zi","じ"],["zu","ず"],["ze","ぜ"],["zo","ぞ"],
  ["da","だ"],["di","ぢ"],["du","づ"],["de","で"],["do","ど"],
  ["ba","ば"],["bi","び"],["bu","ぶ"],["be","べ"],["bo","ぼ"],
  ["pa","ぱ"],["pi","ぴ"],["pu","ぷ"],["pe","ぺ"],["po","ぽ"],
  // Small vowels
  ["xa","ぁ"],["xi","ぃ"],["xu","ぅ"],["xe","ぇ"],["xo","ぉ"],
  ["xtu","っ"],
  // n
  ["nn","ん"],
  // 1-char
  ["a","あ"],["i","い"],["u","う"],["e","え"],["o","お"],
  ["n","ん"],
];

function romajiToHiragana(romaji: string): string {
  let result = "";
  let i = 0;
  const lower = romaji.toLowerCase();

  while (i < lower.length) {
    let matched = false;
    // Try longest match first (4 chars down to 1)
    for (let len = 4; len >= 1; len--) {
      const sub = lower.substring(i, i + len);
      const entry = ROMAJI_TO_HIRA.find(([r]) => r === sub);
      if (entry) {
        result += entry[1];
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Keep non-romaji characters as-is
      result += romaji[i];
      i++;
    }
  }

  return result;
}

function convertHiraganaToKatakana(text: string): string {
  return text
    .split("")
    .map((ch) => HIRA_TO_KATA[ch] || ch)
    .join("");
}

function convertKatakanaToHiragana(text: string): string {
  return text
    .split("")
    .map((ch) => KATA_TO_HIRA[ch] || ch)
    .join("");
}

const MODE_OPTIONS: { value: ConversionMode; label: string }[] = [
  { value: "hira-to-kata", label: "平假名 → 片假名" },
  { value: "kata-to-hira", label: "片假名 → 平假名" },
  { value: "romaji-to-hira", label: "罗马音 → 平假名" },
  { value: "romaji-to-kata", label: "罗马音 → 片假名" },
];

export function KanaConverterTool() {
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState<ConversionMode>("hira-to-kata");
  const { copied, handleCopy } = useCopyState();

  const outputText = useMemo(() => {
    if (!inputText) return "";
    switch (mode) {
      case "hira-to-kata":
        return convertHiraganaToKatakana(inputText);
      case "kata-to-hira":
        return convertKatakanaToHiragana(inputText);
      case "romaji-to-hira":
        return romajiToHiragana(inputText);
      case "romaji-to-kata":
        return convertHiraganaToKatakana(romajiToHiragana(inputText));
      default:
        return inputText;
    }
  }, [inputText, mode]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-2">
          <Label>输入文本</Label>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              mode.startsWith("romaji")
                ? "输入罗马音，如：konnichiwa"
                : mode === "hira-to-kata"
                ? "输入平假名，如：こんにちは"
                : "输入片假名，如：コンニチハ"
            }
          />
        </div>
        <div className="w-full sm:w-52 space-y-2">
          <Label>转换模式</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as ConversionMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {outputText && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">转换结果</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCopy(outputText)}
              >
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "已复制" : "复制"}
              </Button>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-lg whitespace-pre-wrap break-all">
              {outputText}
            </div>
          </CardContent>
        </Card>
      )}

      {!outputText && (
        <div className="text-center text-muted-foreground py-8">
          <Languages className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">输入日语假名或罗马音进行转换</p>
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-2">
          <Label className="text-sm font-medium">五十音图参考</Label>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>あ行：あいうえお → アイウエオ (a i u e o)</p>
            <p>か行：かきくけこ → カキクケコ (ka ki ku ke ko)</p>
            <p>さ行：さしすせそ → サシスセソ (sa shi su se so)</p>
            <p>た行：たちつてと → タチツテト (ta chi tsu te to)</p>
            <p>な行：なにぬねの → ナニヌネノ (na ni nu ne no)</p>
            <p>は行：はひふへほ → ハヒフヘホ (ha hi fu he ho)</p>
            <p>ま行：まみむめも → マミムメモ (ma mi mu me mo)</p>
            <p>や行：やゆよ → ヤユヨ (ya yu yo)</p>
            <p>ら行：らりるれろ → ラリルレロ (ra ri ru re ro)</p>
            <p>わ行：わをん → ワヲン (wa wo n)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
