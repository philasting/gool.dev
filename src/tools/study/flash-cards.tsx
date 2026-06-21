"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { PageTitle } from "@/components/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Plus, RotateCcw, Check, X, BarChart3, Clock, Star, Trophy } from "lucide-react";

// ═══════════════════════════════════════════
// 间隔重复算法（SM-2 简化版）
// ═══════════════════════════════════════════

interface FlashCard {
  id: string;
  front: string;    // 正面（如英文）
  back: string;     // 背面（如中文）
  deckId: string;
  interval: number;  // 下次复习间隔（天）
  easeFactor: number; // 容易度因子（1.3-2.5）
  reps: number;      // 总复习次数
  lapses: number;    // 遗忘次数
  dueDate: string;   // 下次到期日期 YYYY-MM-DD
  lastReview: string | null;
  createdAt: string;
}

interface Deck {
  id: string;
  name: string;
  desc: string;
  cardCount: number;
  color: string;
}

const DEFAULT_DECKS: Deck[] = [
  { id: "cet4",  name: "CET-4 核心词",   desc: "大学英语四级高频词汇",   cardCount: 0, color: "text-blue-500" },
  { id: "cet6",  name: "CET-6 核心词",   desc: "大学英语六级高频词汇",   cardCount: 0, color: "text-purple-500" },
  { id: "toefl", name: "TOEFL 高频词",    desc: "托福考试核心词汇",       cardCount: 0, color: "text-emerald-500" },
  { id: "custom", name: "我的词库",        desc: "自定义单词列表",         cardCount: 0, color: "text-amber-500" },
];

// 示例单词（CET-4 前30个）
const SAMPLE_WORDS: Omit<FlashCard, "id" | "interval" | "easeFactor" | "reps" | "lapses" | "dueDate" | "lastReview" | "createdAt">[] = [
  { front: "abandon", back: "v. 放弃；遗弃 n. 狂热", deckId: "cet4" },
  { front: "ability",  back: "n. 能力；才能",          deckId: "cet4" },
  { front: "abroad",  back: "ad. 到国外；到处",       deckId: "cet4" },
  { front: "absence", back: "n. 缺席；缺乏",          deckId: "cet4" },
  { front: "absolute",back: "a. 绝对的；完全的",     deckId: "cet4" },
  { front: "absorb",  back: "v. 吸收；吸引；使全神贯注", deckId: "cet4" },
  { front: "abstract",back: "a. 抽象的 n. 摘要",    deckId: "cet4" },
  { front: "abundant",back: "a. 丰富的；大量的",     deckId: "cet4" },
  { front: "academy", back: "n. 学院；研究院",        deckId: "cet4" },
  { front: "accelerate", back: "v. 加速；促进",      deckId: "cet4" },
  { front: "accent",  back: "n. 口音；重音",         deckId: "cet4" },
  { front: "accept",  back: "v. 接受；同意",          deckId: "cet4" },
  { front: "access",  back: "n. 通道；使用权 v. 访问", deckId: "cet4" },
  { front: "accident",back: "n. 意外；事故",          deckId: "cet4" },
  { front: "accompany",back:"v. 陪伴；伴随",          deckId: "cet4" },
  { front: "accomplish",back:"v. 完成；实现",        deckId: "cet4" },
  { front: "accord",  back: "n. 一致；协议 v. 给予",deckId: "cet4" },
  { front: "account", back: "n. 账户；解释 v. 说明", deckId: "cet4" },
  { front: "accumulate",back:"v. 积累；堆积",        deckId: "cet4" },
  { front: "accurate",back: "a. 准确的；精确的",     deckId: "cet4" },
  { front: "accuse",  back: "v. 指控；责备",          deckId: "cet4" },
  { front: "accustom",back: "v. 使习惯",              deckId: "cet4" },
  { front: "achieve", back: "v. 达到；完成",          deckId: "cet4" },
  { front: "acid",    back: "n. 酸 a. 酸的",          deckId: "cet4" },
  { front: "acknowledge",back:"v. 承认；致谢",        deckId: "cet4" },
  { front: "acquire", back: "v. 获得；学到",          deckId: "cet4" },
  { front: "action",  back: "n. 行动；作用",          deckId: "cet4" },
  { front: "activate",back: "v. 激活；使活动",        deckId: "cet4" },
  { front: "actual",  back: "a. 实际的；真实的",     deckId: "cet4" },
  { front: "adapt",   back: "v. 使适应；改编",         deckId: "cet4" },
];

const STORAGE_KEY = "flash-cards-data";

function loadCards(): FlashCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // 首次使用：初始化示例卡片
  const today = new Date().toISOString().slice(0, 10);
  const cards: FlashCard[] = SAMPLE_WORDS.map((w, i) => ({
    ...w,
    id: `card-${Date.now()}-${i}`,
    interval: 1,
    easeFactor: 2.5,
    reps: 0,
    lapses: 0,
    dueDate: today,
    lastReview: null,
    createdAt: today,
  }));
  saveCards(cards);
  return cards;
}

function saveCards(cards: FlashCard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

// SM-2 算法
function scheduleCard(card: FlashCard, quality: 0|1|2|3|4|5): FlashCard {
  let { easeFactor, interval, reps } = card;
  if (quality >= 3) {
    // 回答正确
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    reps++;
  } else {
    // 回答错误：重置
    interval = 1;
    reps = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }
  const due = new Date();
  due.setDate(due.getDate() + interval);
  return {
    ...card,
    interval,
    easeFactor: +easeFactor.toFixed(2),
    reps,
    lapses: quality < 3 ? card.lapses + 1 : card.lapses,
    dueDate: due.toISOString().slice(0, 10),
    lastReview: new Date().toISOString().slice(0, 10),
  };
}

// ═══════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════

export function FlashCardTool() {
  const [cards, setCards] = useState<FlashCard[]>(loadCards);
  const [decks, setDecks] = useState<Deck[]>(DEFAULT_DECKS);
  const [activeDeck, setActiveDeck] = useState("cet4");
  const [mode, setMode] = useState<"browse" | "study" | "add" | "stats">("browse");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [studyQueue, setStudyQueue] = useState<FlashCard[]>([]);
  const [results, setResults] = useState<{ cardId: string; quality: number }[]>([]);
  const [showBack, setShowBack] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const dueCards = cards.filter(c => c.deckId === activeDeck && c.dueDate <= today);
  const allDeckCards = cards.filter(c => c.deckId === activeDeck);

  const startStudy = useCallback(() => {
    const queue = [...dueCards].sort(() => Math.random() - 0.5);
    setStudyQueue(queue);
    setCurrentIdx(0);
    setFlipped(false);
    setResults([]);
    setMode("study");
  }, [dueCards, activeDeck]);

  const handleAnswer = useCallback((quality: 0|1|2|3|4|5) => {
    const card = studyQueue[currentIdx];
    const updated = scheduleCard(card, quality);
    const newCards = cards.map(c => c.id === updated.id ? updated : c);
    setCards(newCards);
    saveCards(newCards);
    setResults(r => [...r, { cardId: card.id, quality }]);
    if (currentIdx < studyQueue.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setFlipped(false);
    } else {
      setMode("browse");
    }
  }, [studyQueue, currentIdx, cards]);

  const addCard = useCallback((front: string, back: string) => {
    const newCard: FlashCard = {
      id: `card-${Date.now()}`,
      front, back,
      deckId: activeDeck,
      interval: 1, easeFactor: 2.5, reps: 0, lapses: 0,
      dueDate: today, lastReview: null, createdAt: today,
    };
    const newCards = [...cards, newCard];
    setCards(newCards);
    saveCards(newCards);
  }, [activeDeck, cards, today]);

  // 统计
  const totalReviews = cards.filter(c => c.lastReview).length;
  const mastered = cards.filter(c => c.interval >= 21).length;
  const dueCount = dueCards.length;

  return (
    <div className="space-y-6">
      <PageTitle
        icon={<BookOpen className="w-6 h-6" />}
        title="单词卡片"
        subtitle="间隔重复算法 · 本地存储 · 自定义词库"
      />

      {/* 统计概览 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "今日待复习", value: dueCount, icon: <Clock className="w-4 h-4" />, color: "text-orange-500" },
          { label: "词库总数", value: allDeckCards.length, icon: <BookOpen className="w-4 h-4" />, color: "text-blue-500" },
          { label: "已掌握", value: mastered, icon: <Trophy className="w-4 h-4" />, color: "text-emerald-500" },
          { label: "总复习次数", value: cards.reduce((s, c) => s + c.reps, 0), icon: <BarChart3 className="w-4 h-4" />, color: "text-purple-500" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted/50 ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 词库选择 */}
      <div className="flex gap-2 flex-wrap">
        {decks.map(d => (
          <Button
            key={d.id}
            variant={activeDeck === d.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveDeck(d.id)}
          >
            {d.name} ({cards.filter(c => c.deckId === d.id).length})
          </Button>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <Button onClick={startStudy} disabled={dueCount === 0} className="flex-1">
          <RotateCcw className="w-4 h-4 mr-2" />
          开始复习 ({dueCount} 张)
        </Button>
        <Button variant="outline" onClick={() => setMode("add")}>
          <Plus className="w-4 h-4 mr-2" /> 添加单词
        </Button>
        <Button variant="outline" onClick={() => setMode("stats")}>
          <BarChart3 className="w-4 h-4 mr-2" /> 统计
        </Button>
      </div>

      {/* 学习模式 */}
      {mode === "study" && studyQueue.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline">{currentIdx + 1} / {studyQueue.length}</Badge>
              <span className="text-xs text-muted-foreground">
                掌握度：{studyQueue[currentIdx].reps}次 · 间隔{studyQueue[currentIdx].interval}天
              </span>
            </div>
            <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${((currentIdx) / studyQueue.length) * 100}%` }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="min-h-48 flex items-center justify-center p-8 rounded-xl border cursor-pointer select-none"
              onClick={() => setFlipped(!flipped)}
            >
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">{flipped ? "点击翻回正面" : "点击翻转查看答案"}</p>
                <p className="text-3xl font-bold">{flipped ? studyQueue[currentIdx].back : studyQueue[currentIdx].front}</p>
              </div>
            </div>
            {flipped && (
              <div className="grid grid-cols-3 gap-2">
                <Button variant="destructive" size="sm" onClick={() => handleAnswer(0)}>
                  <X className="w-3 h-3 mr-1" /> 忘记
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAnswer(3)}>
                  困难
                </Button>
                <Button variant="default" size="sm" onClick={() => handleAnswer(5)}>
                  <Check className="w-3 h-3 mr-1" /> 熟练
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 添加单词 */}
      {mode === "add" && (
        <AddCardForm onAdd={addCard} onDone={() => setMode("browse")} />
      )}

      {/* 统计 */}
      {mode === "stats" && (
        <StudyStats cards={cards} />
      )}

      {/* 词库浏览 */}
      {mode === "browse" && (
        <div className="space-y-2">
          <h3 className="font-semibold">词库浏览</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {allDeckCards.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm">
                <div>
                  <span className="font-medium">{c.front}</span>
                  <span className="text-muted-foreground ml-2">{c.back}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {c.interval}天
                </Badge>
              </div>
            ))}
          </div>
          {allDeckCards.length === 0 && (
            <p className="text-center text-muted-foreground py-8">词库为空，点击"添加单词"开始建立你的词库</p>
          )}
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        💾 数据保存在浏览器本地，清除浏览器数据会丢失，建议定期导出备份。
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════
// 添加单词表单
// ═══════════════════════════════════════════

function AddCardForm({ onAdd, onDone }: { onAdd: (f: string, b: string) => void; onDone: () => void }) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  return (
    <Card>
      <CardHeader><CardTitle>添加新单词</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs font-medium">正面（如英文单词）</label>
          <Input value={front} onChange={e => setFront(e.target.value)} placeholder="abandon" />
        </div>
        <div>
          <label className="text-xs font-medium">背面（如中文释义）</label>
          <Input value={back} onChange={e => setBack(e.target.value)} placeholder="v. 放弃；遗弃" />
        </div>
        <div className="flex gap-2">
          <Button onClick={onDone} variant="outline" className="flex-1">取消</Button>
          <Button
            onClick={() => { onAdd(front.trim(), back.trim()); setFront(""); setBack(""); }}
            disabled={!front.trim() || !back.trim()}
            className="flex-1"
          >添加</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════
// 学习统计
// ═══════════════════════════════════════════

function StudyStats({ cards }: { cards: FlashCard[] }) {
  const bins = [0, 0, 0, 0, 0]; // 1天, 2-6天, 7-20天, 21+天, 未学
  cards.forEach(c => {
    if (c.reps === 0) bins[4]++;
    else if (c.interval < 2) bins[0]++;
    else if (c.interval < 7) bins[1]++;
    else if (c.interval < 21) bins[2]++;
    else bins[3]++;
  });
  return (
    <Card>
      <CardHeader><CardTitle>学习统计</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {["1天内（新学）", "2-6天（熟悉）", "7-20天（巩固）", "21天+（已掌握）", "未学习"].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-24 text-xs text-muted-foreground">{label}</div>
              <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${cards.length ? (bins[i] / cards.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs w-8 text-right">{bins[i]}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          使用 SM-2 间隔重复算法，科学安排复习时间，最大化记忆留存率。
        </p>
      </CardContent>
    </Card>
  );
}
