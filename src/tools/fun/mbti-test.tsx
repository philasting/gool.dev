"use client";

import { useState, useMemo } from "react";
import { PageTitle } from "@/components/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Brain, Heart, Zap, Trophy, RotateCcw } from "lucide-react";

// ═══════════════════════════════════════════
// MBTI 16型人格数据库
// ═══════════════════════════════════════════

interface PersonalityType {
  code: string;
  name: string;
  emoji: string;
  nickname: string;
  desc: string;
  strengths: string[];
  weaknesses: string[];
  careers: string[];
  color: string;
}

const MBTI_TYPES: PersonalityType[] = [
  { code: "INTJ", name: "建筑师", emoji: "🏯", nickname: "万物皆可编程", desc: "独立思考者，拥有宏大的想象力和决心。", strengths: ["战略思维","独立自主","高标准","决心坚定"], weaknesses: ["过于批判","情感表达困难","完美主义"], careers: ["科学家","工程师","战略顾问","系统架构师"], color: "text-blue-600" },
  { code: "INTP", name: "逻辑学家", emoji: "🔬", nickname: "思考是唯一的信仰", desc: "具有创造力的发明家，对知识有着不可抑制的渴望。", strengths: ["分析能力强","开放思维","客观理性","富有创意"], weaknesses: ["不够实际","逃避情感","完美主义"], careers: ["程序员","数据科学家","哲学家","研究员"], color: "text-purple-600" },
  { code: "ENTJ", name: "指挥官", emoji: "👑", nickname: "天生领导者", desc: "大胆、富有想象力且意志强大的领导者，总能找到或创造解决方法。", strengths: ["天生领导","自信果断","战略眼光","高效执行"], weaknesses: ["不够耐心","过于强势","忽视情感"], careers: ["CEO","创业者","管理顾问","律师"], color: "text-red-600" },
  { code: "ENTP", name: "辩论家", emoji: "⚡", nickname: "聪明的大脑永不停歇", desc: "聪明好奇的思想家，不会放弃任何智力上的挑战。", strengths: ["思维敏捷","好奇心强","充满活力","善于辩论"], weaknesses: ["不够专注","回避规则","情感迟钝"], careers: ["创业者","产品经理","律师","创意总监"], color: "text-orange-600" },
  { code: "INFJ", name: "提倡者", emoji: "🌟", nickname: "理想主义的行动派", desc: "安静而神秘，同时鼓舞人心且不知疲倦地利他。", strengths: ["富有洞察","原则性强","热情利他","创造力强"], weaknesses: ["完美主义","过度私密","容易枯竭"], careers: ["心理咨询师","作家","设计师","非营利组织工作者"], color: "text-teal-600" },
  { code: "INFP", name: "调停者", emoji: "🦋", nickname: "诗意的小蝴蝶", desc: "诗意、善良的利他主义者，总是热情地为好的事业服务。", strengths: ["理想主义","共情能力强","创造力强","激情驱动"], weaknesses: ["过于自我牺牲","不切实际","情绪化"], careers: ["作家","艺术家","心理咨询师","社工"], color: "text-green-600" },
  { code: "ENFJ", name: "主人公", emoji: "🌈", nickname: "天生的凝聚者", desc: "富有魅力且鼓舞人心的领导者，能够迷住听众。", strengths: ["天生领袖","利他主义","天生老师","忠诚可靠"], weaknesses: ["过于理想","过于自我牺牲","不善于自我关怀"], careers: ["教师","教练","公关","人力资源"], color: "text-pink-600" },
  { code: "ENFP", name: "竞选者", emoji: "🎪", nickname: "快乐的小太阳", desc: "热情、有创造力且善于社交的自由精灵，总能找到理由微笑。", strengths: ["好奇心强","观察力敏锐","精力充沛","乐观积极"], weaknesses: ["难以专注","过于感性","依赖他人认可"], careers: ["记者","演员","顾问","创意工作者"], color: "text-yellow-600" },
  { code: "ISTJ", name: "物流师", emoji: "📋", nickname: "靠谱的定海神针", desc: "实际且注重事实的个人，其可靠性不容置疑。", strengths: ["诚实可靠","强烈的责任感","耐心且冷静","努力工作"], weaknesses: ["不够灵活","固执","情感表达困难"], careers: ["会计师","项目经理","法官","军官"], color: "text-slate-600" },
  { code: "ISFJ", name: "守卫者", emoji: "🛡️", nickname: "温柔的守护天使", desc: "非常专注且温暖的守护者，时刻准备保护爱的人。", strengths: ["支持他人","可靠值得信赖","耐心细致","善于观察"], weaknesses: ["过于谦逊","压抑情感","抗拒改变"], careers: ["护士","教师","行政","社工"], color: "text-emerald-600" },
  { code: "ESTJ", name: "总经理", emoji: "📊", nickname: "高效的组织机器", desc: "出色的管理者，在管理事务或人员方面无与伦比。", strengths: ["天生组织家","忠诚可靠","强壮且负责任","直接坦诚"], weaknesses: ["不够灵活","固执","情感表达不敏感"], careers: ["军官","项目经理","财务","律师"], color: "text-gray-700" },
  { code: "ESFJ", name: "执政官", emoji: "🤝", nickname: "温暖的人际润滑剂", desc: "极富同情心、善于交际且受人欢迎的人，总是不吝惜时间给旁人。", strengths: ["强社交技能","可靠值得信赖","热心助人"], weaknesses: ["需要他人的认可","过于敏感","抗拒改变"], careers: ["护士","教师","销售","活动策划"], color: "text-rose-600" },
  { code: "ISTP", name: "鉴赏家", emoji: "🔧", nickname: "低调的技术大牛", desc: "大胆且实际的实验家，擅长使用各种形式的工具。", strengths: ["乐观冷静","创造力强","很实际","擅长危机处理"], weaknesses: ["对情感关系冷漠","不喜承诺","冒险倾向"], careers: ["工程师","机械师","飞行员","运动员"], color: "text-cyan-600" },
  { code: "ISFP", name: "探险家", emoji: "🎨", nickname: "安静的艺术灵魂", desc: "灵活而有魅力的艺术家，时刻准备探索和体验新事物。", strengths: ["魅力十足","对美敏感","富有想象力","热情开放"], weaknesses: ["不喜承诺","过于竞争","过于自我批评"], careers: ["艺术家","设计师","厨师","兽医"], color: "text-fuchsia-600" },
  { code: "ESTP", name: "企业家", emoji: "🚀", nickname: "行动派的风云人物", desc: "聪明、精力充沛且善于感知的人，真的很喜欢生活在边缘。", strengths: ["大胆直接","理性务实","擅长交际"], weaknesses: ["不敏感","冲动","不擅长长远规划"], careers: ["企业家","销售","演员","消防员"], color: "text-red-500" },
  { code: "ESFP", name: "表演者", emoji: "🎤", nickname: "派对之魂", desc: "自发的、精力充沛且热情的表演者——生活在他们周围永远不会无聊。", strengths: ["大胆自信","独创性强","审美极佳","人际交往强"], weaknesses: ["注意力难以集中","不喜承诺","过于敏感"], careers: ["演员","活动策划","教练","导游"], color: "text-amber-500" },
];

// ═══════════════════════════════════════════
// 测试题目（12道题，每题测一个维度倾向）
// ═══════════════════════════════════════════

const QUESTIONS = [
  { id: 1,  dim: "EI", text: "周末你更倾向于：", a: "和朋友出去聚会，认识新朋友", b: "独自在家看书或追剧，充电休息" },
  { id: 2,  dim: "EI", text: "在一群陌生人面前演讲，你的感觉是：", a: "兴奋！这是我展示的舞台", b: "紧张，巴不得赶快结束" },
  { id: 3,  dim: "SN", text: "你更信任哪种信息？", a: "实际经验和具体事实", b: "直觉和整体印象" },
  { id: 4,  dim: "SN", text: "面对一份新工作，你更关注：", a: "具体的职责、薪资、工作时间", b: "这份工作的意义和未来发展" },
  { id: 5,  dim: "TF", text: "做决定时，你更依赖：", a: "逻辑分析和客观事实", b: "个人价值观和他人感受" },
  { id: 6,  dim: "TF", text: "朋友向你倾诉情感问题，你会：", a: "给出理性的分析和建议", b: "先共情，陪伴和倾听" },
  { id: 7,  dim: "JP", text: "对于计划，你的态度是：", a: "喜欢按计划行事，讨厌突发变化", b: "计划是灵活的，随时可以调整" },
  { id: 8,  dim: "JP", text: "你的工作桌面/房间通常是：", a: "整整齐齐，东西都有固定位置", b: "有点乱，但我知道每件东西在哪" },
  { id: 9,  dim: "EI", text: "认识新朋友后，你通常：", a: "主动保持联系，约出来玩", b: "等对方联系，不主动打扰" },
  { id: 10, dim: "SN", text: "你更喜欢哪种学习方式？", a: "一步一步来，先掌握基础", b: "先理解大框架，再填充细节" },
  { id: 11, dim: "TF", text: "当团队出现分歧，你倾向于：", a: "客观分析对错，给出公平结论", b: "照顾每个人的感受，寻求和谐" },
  { id: 12, dim: "JP", text: "面对截止日期，你通常：", a: "提前完成，不喜欢拖延", b: "最后一刻效率最高" },
];

// ═══════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════

export function MBTITestTool() {
  const [step, setStep] = useState<"intro" | "test" | "result">("intro");
  const [answers, setAnswers] = useState<number[]>([]); // 0=a, 1=b
  const [currentQ, setCurrentQ] = useState(0);

  const scores = useMemo(() => {
    const s = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    answers.forEach((a, i) => {
      const dim = QUESTIONS[i].dim;
      if (dim === "EI") a === 0 ? s.E++ : s.I++;
      if (dim === "SN") a === 0 ? s.S++ : s.N++;
      if (dim === "TF") a === 0 ? s.T++ : s.F++;
      if (dim === "JP") a === 0 ? s.J++ : s.P++;
    });
    return s;
  }, [answers]);

  const typeCode = [
    scores.E >= scores.I ? "E" : "I",
    scores.S >= scores.N ? "S" : "N",
    scores.T >= scores.F ? "T" : "F",
    scores.J >= scores.P ? "J" : "P",
  ].join("");

  const resultType = MBTI_TYPES.find(t => t.code === typeCode)!;

  const handleAnswer = (choice: 0 | 1) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = choice;
    setAnswers(newAnswers);
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setStep("result");
    }
  };

  const restart = () => {
    setAnswers([]);
    setCurrentQ(0);
    setStep("intro");
  };

  return (
    <div className="space-y-6">
      <PageTitle
        icon={<Brain className="w-6 h-6" />}
        title="MBTI 性格测试"
        subtitle="12道题快速测出你的 16 型人格"
      />

      {/* 介绍页 */}
      {step === "intro" && (
        <Card className="border-primary/20">
          <CardContent className="p-8 text-center space-y-4">
            <span className="text-6xl">{resultType?.emoji || "🧠"}</span>
            <h2 className="text-xl font-bold">发现真实的自己</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              MBTI 是全球最流行的性格分类工具之一，将人格分为 16 种类型。
              本测试共 12 道题，约 2 分钟完成。
            </p>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              {["E/I 外向·内向", "S/N 实感·直觉", "T/F 思考·情感", "J/P 判断·感知"].map(t => (
                <Badge key={t} variant="outline">{t}</Badge>
              ))}
            </div>
            <Button onClick={() => setStep("test")} size="lg" className="mt-4">
              开始测试
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 测试页 */}
      {step === "test" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline">第 {currentQ + 1} / {QUESTIONS.length} 题</Badge>
            <span className="text-xs text-muted-foreground">
              {Math.round(((currentQ) / QUESTIONS.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${((currentQ) / QUESTIONS.length) * 100}%` }}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {QUESTIONS[currentQ].text}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-4 px-6"
                onClick={() => handleAnswer(0)}
              >
                <span className="mr-3 font-bold text-primary">A.</span>
                {QUESTIONS[currentQ].a}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-4 px-6"
                onClick={() => handleAnswer(1)}
              >
                <span className="mr-3 font-bold text-primary">B.</span>
                {QUESTIONS[currentQ].b}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 结果页 */}
      {step === "result" && resultType && (
        <div className="space-y-6">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardContent className="p-8 text-center space-y-4">
              <span className="text-6xl">{resultType.emoji}</span>
              <div>
                <h2 className="text-2xl font-bold">{resultType.code}</h2>
                <p className="text-lg text-muted-foreground">{resultType.name} · {resultType.nickname}</p>
              </div>

              {/* 四个维度进度条 */}
              <div className="max-w-sm mx-auto space-y-3 text-sm">
                {[
                  { label: "E 外向", revLabel: "I 内向", score: scores.E, revScore: scores.I },
                  { label: "S 实感", revLabel: "N 直觉", score: scores.S, revScore: scores.N },
                  { label: "T 思考", revLabel: "F 情感", score: scores.T, revScore: scores.F },
                  { label: "J 判断", revLabel: "P 感知", score: scores.J, revScore: scores.P },
                ].map((d, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={d.score >= d.revScore ? "font-bold text-primary" : ""}>{d.label}</span>
                      <span className={d.revScore > d.score ? "font-bold text-primary" : ""}>{d.revLabel}</span>
                    </div>
                    <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden flex">
                      <div className="bg-primary transition-all" style={{ width: `${d.score / (d.score + d.revScore || 1) * 100}%` }} />
                      <div className="bg-muted/50 transition-all" style={{ width: `${d.revScore / (d.score + d.revScore || 1) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 详细描述 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                性格分析
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="leading-relaxed text-muted-foreground">{resultType.desc}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-emerald-600 mb-2">✅ 优势特质</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    {resultType.strengths.map(s => <li key={s}>• {s}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-orange-600 mb-2">⚠️ 需要注意</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    {resultType.weaknesses.map(s => <li key={s}>• {s}</li>)}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">💼 适合的职业方向</h4>
                <div className="flex flex-wrap gap-1">
                  {resultType.careers.map(c => (
                    <Badge key={c} variant="secondary">{c}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 16型总览 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">16 型人格总览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MBTI_TYPES.map(t => (
                  <div
                    key={t.code}
                    className={`p-2 rounded-lg text-xs cursor-pointer transition-all
                      ${t.code === resultType.code ? "bg-primary/10 border border-primary/30 font-bold" : "bg-muted/30 hover:bg-muted/50"}`}
                  >
                    <span className="mr-1">{t.emoji}</span>
                    {t.code} {t.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={restart} variant="outline" className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            重新测试
          </Button>
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        🧠 MBTI 测试仅供娱乐和自我探索参考，真实性格比任何标签都更丰富。
      </p>
    </div>
  );
}
