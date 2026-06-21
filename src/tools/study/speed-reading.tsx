"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PageTitle } from "@/components/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Pause, Play, RotateCcw, BarChart3, Eye, Trophy } from "lucide-react";

// ═══════════════════════════════════════════
// 速读训练：动态文字显示（RSVP 技术）
// ═══════════════════════════════════════════

const SAMPLE_TEXTS = [
  { title: "科学与自然", text: "在遥远的银河系中，科学家们发现了一颗与地球极为相似的行星。这颗行星拥有丰富的水资源和多样化的生态系统，大气成分也与地球惊人地一致。研究团队通过大型射电望远镜，持续监听来自宇宙深处的信号，希望找到地外文明的踪迹。这项伟大的探索不仅是科学的进步，更是人类好奇心的体现。" },
  { title: "文学与诗意", text: "月光洒在静谧的湖面上，微风拂过，激起层层涟漪。远处的山峦在夜色中若隐若现，仿佛一幅泼墨山水画。这样的夜晚，人们常常会想起遥远故乡的亲人和朋友，思念如潮水般涌上心头。诗意不仅存在于文字中，更存在于每个人对美好的感知之中。" },
  { title: "科技与未来", text: "人工智能正在以前所未有的速度改变我们的世界。从语音助手到自动驾驶，从医疗诊断到金融分析，AI 的触角已经延伸到生活的每个角落。专家们预测，未来十年将是人工智能发展的黄金时期。然而技术的进步也带来了新的挑战，如何在创新与伦理之间找到平衡，是摆在全人类面前的重大课题。" },
  { title: "历史与人文", text: "丝绸之路不仅是古代贸易的通道，更是东西方文明交流的桥梁。沿着这条漫长的道路，中国的丝绸、瓷器和火药传向西方，而西方的玻璃、宝石和宗教也传入东方。文化在交流中融合，文明在碰撞中进步。今天的一带一路倡议，正是对古代丝绸之路精神的传承与发扬。" },
];

// ═══════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════

export function SpeedReadingTool() {
  const [mode, setMode] = useState<"setup" | "training" | "result">("setup");
  const [wpm, setWpm] = useState(300); // 字/分钟
  const [textIdx, setTextIdx] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [comprehensionScore, setComprehensionScore] = useState(-1);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const words = SAMPLE_TEXTS[textIdx].text.split("");

  const startTraining = useCallback(() => {
    setIsRunning(true);
    setCurrentWordIdx(0);
    setStartTime(Date.now());
    setComprehensionScore(-1);
    const intervalMs = 60000 / wpm; // 每个字显示多少毫秒
    intervalRef.current = setInterval(() => {
      setCurrentWordIdx(prev => {
        if (prev >= words.length - 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsRunning(false);
          setEndTime(Date.now());
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);
  }, [wpm, words.length]);

  const pauseTraining = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
  };

  const resetTraining = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setCurrentWordIdx(0);
    setComprehensionScore(-1);
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const wpmLevels = [
    { wpm: 200, label: "入门", desc: "适合初学者" },
    { wpm: 300, label: "进阶", desc: "经过练习可达到" },
    { wpm: 500, label: "熟练", desc: "速读爱好者水平" },
    { wpm: 700, label: "高手", desc: "挑战极限" },
    { wpm: 1000, label: "极速", desc: "播音员语速" },
  ];

  const questions = [
    { q: "本文主要讨论了什么主题？", options: ["科技发展", "文化交流", "根据文章内容判断"], answer: -1 },
  ];

  return (
    <div className="space-y-6">
      <PageTitle
        icon={<Zap className="w-6 h-6" />}
        title="速读训练器"
        subtitle="RSVP 技术 · 动态文字显示 · 提升阅读速度"
      />

      {/* 模式：设置 */}
      {mode === "setup" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>选择训练速度</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">当前速度：{wpm} 字/分钟</span>
                  <Badge>{wpmLevels.find(l => wpm <= l.wpm)?.label || "自定义"}</Badge>
                </div>
                <input
                  type="range"
                  min={100}
                  max={1200}
                  step={50}
                  value={wpm}
                  onChange={e => setWpm(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>100</span>
                  <span>400</span>
                  <span>700</span>
                  <span>1000</span>
                  <span>1200</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {wpmLevels.map(l => (
                  <Card
                    key={l.wpm}
                    className={`cursor-pointer text-center p-3 ${wpm === l.wpm ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/50"}`}
                    onClick={() => setWpm(l.wpm)}
                  >
                    <p className="font-bold text-lg">{l.wpm}</p>
                    <p className="text-xs font-medium">{l.label}</p>
                    <p className="text-[10px] text-muted-foreground">{l.desc}</p>
                  </Card>
                ))}
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">选择文章</h4>
                <div className="space-y-2">
                  {SAMPLE_TEXTS.map((t, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg cursor-pointer border ${textIdx === i ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                      onClick={() => setTextIdx(i)}
                    >
                      <span className="font-medium text-sm">{t.title}</span>
                      <span className="text-xs text-muted-foreground ml-2">（{t.text.length} 字）</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={() => { setMode("training"); startTraining(); }} className="w-full" size="lg">
                <Play className="w-4 h-4 mr-2" />
                开始训练
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-4 h-4" />
                什么是 RSVP 速读？
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p><strong>RSVP（Rapid Serial Visual Presentation）</strong>是一种速读技术，通过逐字/逐词快速显示文本，消除眼睛的扫视运动，从而提升阅读速度。</p>
              <p>💡 正常人阅读速度约 200-300 字/分钟，经过训练可达到 500-800 字/分钟。</p>
              <p>⚠️ 速度与理解率需要平衡，建议从 300 字/分钟开始逐步提升。</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 模式：训练中 */}
      {mode === "training" && (
        <div className="space-y-4">
          <Card className="border-primary/30">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                {/* 进度 */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{Math.round((currentWordIdx / words.length) * 100)}%</span>
                  <span>{currentWordIdx}/{words.length} 字</span>
                </div>
                <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(currentWordIdx / words.length) * 100}%` }}
                  />
                </div>

                {/* 当前字显示 */}
                <div className="min-h-32 flex items-center justify-center">
                  <span className="text-6xl font-bold text-primary font-mono">
                    {words[currentWordIdx] || ""}
                  </span>
                </div>

                {/* 上下文预览（前后各5个字）*/}
                <p className="text-xs text-muted-foreground">
                  {currentWordIdx > 0 && (
                    <span className="opacity-40">
                      {words.slice(Math.max(0, currentWordIdx - 8), currentWordIdx).join("")}
                    </span>
                  )}
                  <span className="text-primary font-bold mx-1">
                    {words[currentWordIdx]}
                  </span>
                  {currentWordIdx < words.length - 1 && (
                    <span className="opacity-40">
                      {words.slice(currentWordIdx + 1, Math.min(words.length, currentWordIdx + 9)).join("")}
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            {isRunning ? (
              <Button variant="outline" onClick={pauseTraining} className="flex-1">
                <Pause className="w-4 h-4 mr-2" /> 暂停
              </Button>
            ) : (
              <Button onClick={startTraining} className="flex-1">
                <Play className="w-4 h-4 mr-2" /> 继续
              </Button>
            )}
            <Button variant="outline" onClick={resetTraining}>
              <RotateCcw className="w-4 h-4 mr-2" /> 重置
            </Button>
            <Button variant="outline" onClick={() => { resetTraining(); setMode("setup"); }}>
              退出
            </Button>
          </div>
        </div>
      )}

      {/* 模式：结果 */}
      {mode === "result" && (
        <div className="space-y-4">
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-6 text-center space-y-3">
              <Trophy className="w-12 h-12 mx-auto text-yellow-500" />
              <h3 className="text-xl font-bold">训练完成！</h3>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                {[
                  { label: "阅读速度", value: `${wpm}`, unit: "字/分" },
                  { label: "用时", value: `${Math.round((endTime - startTime) / 1000)}`, unit: "秒" },
                  { label: "文章字数", value: `${words.length}`, unit: "字" },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-bold">{s.value}<span className="text-xs font-normal text-muted-foreground">{s.unit}</span></p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={() => { setMode("setup"); resetTraining(); }} className="flex-1">
              再次训练
            </Button>
          </div>
        </div>
      )}

      {/* 自动切换到结果 */}
      {mode === "training" && !isRunning && currentWordIdx >= words.length - 1 && (
        <>
          {(() => { setMode("result"); return null; })()}
        </>
      )}

      <p className="text-xs text-center text-muted-foreground">
        📖 速读训练是一个长期过程，建议每天练习 10-15 分钟，一个月后可见明显效果。
      </p>
    </div>
  );
}
