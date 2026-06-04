"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Search } from "lucide-react";
import { copyToClipboard } from "@/components/tool/ToolLayout";

interface TraditionalColor {
  name: string;
  hex: string;
  pinyin: string;
}

const COLOR_CATEGORIES: Record<string, TraditionalColor[]> = {
  "红": [
    { name: "朱砂", hex: "#FF461F", pinyin: "zhū shā" },
    { name: "胭脂", hex: "#C93756", pinyin: "yān zhī" },
    { name: "绯红", hex: "#C83C23", pinyin: "fēi hóng" },
    { name: "朱红", hex: "#ED5736", pinyin: "zhū hóng" },
    { name: "丹红", hex: "#BE2F27", pinyin: "dān hóng" },
    { name: "殷红", hex: "#A12830", pinyin: "yān hóng" },
    { name: "茜色", hex: "#CB3A56", pinyin: "qiàn sè" },
    { name: "火红", hex: "#E75033", pinyin: "huǒ hóng" },
    { name: "石榴红", hex: "#F20C00", pinyin: "shí liú hóng" },
    { name: "银红", hex: "#F05654", pinyin: "yín hóng" },
    { name: "酡红", hex: "#DC3023", pinyin: "tuó hóng" },
    { name: "海棠红", hex: "#DB5A6B", pinyin: "hǎi táng hóng" },
  ],
  "橙": [
    { name: "橘黄", hex: "#FFB61E", pinyin: "jú huáng" },
    { name: "橙黄", hex: "#FFA631", pinyin: "chéng huáng" },
    { name: "杏黄", hex: "#FFA400", pinyin: "xìng huáng" },
    { name: "姜黄", hex: "#FFC773", pinyin: "jiāng huáng" },
    { name: "缃色", hex: "#F0C239", pinyin: "xiāng sè" },
    { name: "橘红", hex: "#FF7500", pinyin: "jú hóng" },
    { name: "赭色", hex: "#9C5333", pinyin: "zhě sè" },
    { name: "驼色", hex: "#A88462", pinyin: "tuó sè" },
    { name: "秋香色", hex: "#D9B611", pinyin: "qiū xiāng sè" },
    { name: "黄栌", hex: "#E29C45", pinyin: "huáng lú" },
  ],
  "黄": [
    { name: "藤黄", hex: "#FFB61E", pinyin: "téng huáng" },
    { name: "鹅黄", hex: "#FFF143", pinyin: "é huáng" },
    { name: "鸭黄", hex: "#FAFF72", pinyin: "yā huáng" },
    { name: "樱草色", hex: "#EAFF56", pinyin: "yīng cǎo sè" },
    { name: "杏黄", hex: "#FFA400", pinyin: "xìng huáng" },
    { name: "蛋黄", hex: "#FFA631", pinyin: "dàn huáng" },
    { name: "明黄", hex: "#F2CE2B", pinyin: "míng huáng" },
    { name: "硫华黄", hex: "#F2BE45", pinyin: "liú huá huáng" },
    { name: "枯黄", hex: "#D3B17D", pinyin: "kū huáng" },
    { name: "黄碧", hex: "#F8E5A0", pinyin: "huáng bì" },
  ],
  "绿": [
    { name: "松花绿", hex: "#057748", pinyin: "sōng huā lǜ" },
    { name: "松柏绿", hex: "#21A675", pinyin: "sōng bǎi lǜ" },
    { name: "竹青", hex: "#789262", pinyin: "zhú qīng" },
    { name: "翡翠色", hex: "#3DE1AD", pinyin: "fěi cuì sè" },
    { name: "艾绿", hex: "#A4E2C6", pinyin: "ài lǜ" },
    { name: "豆青", hex: "#96CE54", pinyin: "dòu qīng" },
    { name: "豆绿", hex: "#9ED048", pinyin: "dòu lǜ" },
    { name: "石绿", hex: "#16A951", pinyin: "shí lǜ" },
    { name: "铜绿", hex: "#549688", pinyin: "tóng lǜ" },
    { name: "柳绿", hex: "#A8D8B9", pinyin: "liǔ lǜ" },
    { name: "葱绿", hex: "#9ED900", pinyin: "cōng lǜ" },
    { name: "碧色", hex: "#1BD1A5", pinyin: "bì sè" },
  ],
  "蓝": [
    { name: "石青", hex: "#1685A9", pinyin: "shí qīng" },
    { name: "花青", hex: "#003472", pinyin: "huā qīng" },
    { name: "靛青", hex: "#177CB0", pinyin: "diàn qīng" },
    { name: "湛蓝", hex: "#7093DB", pinyin: "zhàn lán" },
    { name: "碧蓝", hex: "#3EEDE7", pinyin: "bì lán" },
    { name: "蔚蓝", hex: "#70F3FF", pinyin: "wèi lán" },
    { name: "群青", hex: "#4C8DAE", pinyin: "qún qīng" },
    { name: "藏蓝", hex: "#3B2E7E", pinyin: "zàng lán" },
    { name: "景泰蓝", hex: "#2775B6", pinyin: "jǐng tài lán" },
    { name: "天青", hex: "#7EC8E3", pinyin: "tiān qīng" },
    { name: "缥色", hex: "#7FECAD", pinyin: "piǎo sè" },
    { name: "蓝灰", hex: "#6D6F7B", pinyin: "lán huī" },
  ],
  "紫": [
    { name: "酱紫", hex: "#815476", pinyin: "jiàng zǐ" },
    { name: "紫酱", hex: "#815463", pinyin: "zǐ jiàng" },
    { name: "绛紫", hex: "#8C4356", pinyin: "jiàng zǐ" },
    { name: "青莲", hex: "#801DAE", pinyin: "qīng lián" },
    { name: "紫棠", hex: "#56004F", pinyin: "zǐ táng" },
    { name: "魏紫", hex: "#7A266C", pinyin: "wèi zǐ" },
    { name: "藕荷", hex: "#E4C6D0", pinyin: "ǒu hé" },
    { name: "紫草", hex: "#9B1E64", pinyin: "zǐ cǎo" },
    { name: "丁香油", hex: "#A7566F", pinyin: "dīng xiāng yóu" },
    { name: "雪青", hex: "#B0A4E3", pinyin: "xuě qīng" },
  ],
  "黑": [
    { name: "玄色", hex: "#622A1D", pinyin: "xuán sè" },
    { name: "乌黑", hex: "#392F41", pinyin: "wū hēi" },
    { name: "漆黑", hex: "#161823", pinyin: "qī hēi" },
    { name: "墨灰", hex: "#758A99", pinyin: "mò huī" },
    { name: "墨色", hex: "#50616D", pinyin: "mò sè" },
    { name: "黝黑", hex: "#665757", pinyin: "yǒu hēi" },
    { name: "黧色", hex: "#5D513C", pinyin: "lí sè" },
    { name: "黎色", hex: "#75664D", pinyin: "lí sè" },
    { name: "煤黑", hex: "#2B2B2B", pinyin: "méi hēi" },
    { name: "鸦青", hex: "#424C50", pinyin: "yā qīng" },
  ],
  "白": [
    { name: "月白", hex: "#D6ECF0", pinyin: "yuè bái" },
    { name: "缟素", hex: "#F0ECE2", pinyin: "gǎo sù" },
    { name: "素色", hex: "#E0F0E9", pinyin: "sù sè" },
    { name: "荼白", hex: "#F3F9F1", pinyin: "tú bái" },
    { name: "霜色", hex: "#E9E7EF", pinyin: "shuāng sè" },
    { name: "花白", hex: "#C2CCD0", pinyin: "huā bái" },
    { name: "鱼肚白", hex: "#FCEFE8", pinyin: "yú dǔ bái" },
    { name: "莹白", hex: "#E8F0F2", pinyin: "yíng bái" },
    { name: "象牙白", hex: "#FFFBF0", pinyin: "xiàng yá bái" },
    { name: "铅白", hex: "#F0F0F4", pinyin: "qiān bái" },
  ],
};

const ALL_COLORS: (TraditionalColor & { category: string })[] = [];
for (const [category, list] of Object.entries(COLOR_CATEGORIES)) {
  for (const color of list) {
    ALL_COLORS.push({ ...color, category });
  }
}

export function ChineseTraditionalColorsTool() {
  const [search, setSearch] = useState("");
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredColors = useMemo(() => {
    const q = search.toLowerCase().trim();
    const results: (TraditionalColor & { category: string })[] = [];

    for (const [category, list] of Object.entries(COLOR_CATEGORIES)) {
      if (activeCategory && activeCategory !== category) continue;
      for (const color of list) {
        if (
          !q ||
          color.name.includes(q) ||
          color.pinyin.toLowerCase().includes(q) ||
          color.hex.toLowerCase().includes(q)
        ) {
          results.push({ ...color, category });
        }
      }
    }
    return results;
  }, [search, activeCategory]);

  const handleCopy = async (hex: string) => {
    await copyToClipboard(hex.toUpperCase());
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const totalColors = ALL_COLORS.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索颜色名称、拼音或 HEX..."
            className="pl-9"
          />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          共 {totalColors} 色 · 显示 {filteredColors.length} 色
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant={activeCategory === null ? "default" : "secondary"}
          className="cursor-pointer"
          onClick={() => setActiveCategory(null)}
        >
          全部
        </Badge>
        {Object.keys(COLOR_CATEGORIES).map((cat) => (
          <Badge
            key={cat}
            variant={activeCategory === cat ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {!activeCategory && !search ? (
        <div className="space-y-6">
          {Object.entries(COLOR_CATEGORIES).map(([category, colors]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-sm font-semibold">{category}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {colors.map((color) => (
                  <Card
                    key={color.hex + color.name}
                    className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                    onClick={() => handleCopy(color.hex)}
                  >
                    <div
                      className="h-12"
                      style={{ backgroundColor: color.hex }}
                    />
                    <CardContent className="p-1.5 text-center">
                      <p className="text-xs font-medium truncate">{color.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {copiedHex === color.hex ? (
                          <span className="text-green-600">已复制</span>
                        ) : (
                          color.hex.toUpperCase()
                        )}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {filteredColors.map((color) => (
            <Card
              key={color.hex + color.name + color.category}
              className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
              onClick={() => handleCopy(color.hex)}
            >
              <div
                className="h-12"
                style={{ backgroundColor: color.hex }}
              />
              <CardContent className="p-1.5 text-center">
                <p className="text-xs font-medium truncate">{color.name}</p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  {copiedHex === color.hex ? (
                    <Check className="h-3 w-3 mx-auto text-green-600" />
                  ) : (
                    color.hex.toUpperCase()
                  )}
                </p>
              </CardContent>
            </Card>
          ))}
          {filteredColors.length === 0 && (
            <div className="col-span-full text-center text-sm text-muted-foreground py-8">
              未找到匹配的颜色
            </div>
          )}
        </div>
      )}
    </div>
  );
}
