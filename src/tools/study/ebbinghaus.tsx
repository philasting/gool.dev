"use client";

import { useState, useMemo } from "react";
import { PageTitle } from "@/components/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Trash2, Download, Brain, CheckCircle2, Clock, BarChart3 } from "lucide-react";

// ═══════════════════════════════════════════
// 艾宾浩斯遗忘曲线：标准复习间隔
// ═══════════════════════════════════════════

const EB_REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30, 60, 90]; // 天
const EB_LABELS = ["当天", "1天", "2天", "4天", "7天", "15天", "30天", "60天", "90天"];

interface MemoryTask {
  id: string;
  name: string;
  createdAt: string;       // 创建日期
  reviewDates: string[];    // 所有复习日期
  nextReview: string;       // 下次复习日期
  completedReviews: number;  // 已完成复习次数
  status: "pending" | "review-today" | "overdue" | "done";
}

const STORAGE_KEY = "ebbinghaus-tasks";

function loadTasks(): MemoryTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveTasks(tasks: MemoryTask[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function computeNextReview(createdAt: string, completedReviews: number): string {
  if (completedReviews >= EB_REVIEW_INTERVALS.length) {
    // 完成所有标准复习，改为每90天复习一次
    const d = new Date(createdAt);
    d.setDate(d.getDate() + 90 * (completedReviews - EB_REVIEW_INTERVALS.length + 1));
    return d.toISOString().slice(0, 10);
  }
  const interval = EB_REVIEW_INTERVALS[completedReviews];
  const d = new Date(createdAt);
  d.setDate(d.getDate() + interval);
  return d.toISOString().slice(0, 10);
}

function getStatus(task: MemoryTask, today: string): MemoryTask["status"] {
  if (task.completedReviews >= EB_REVIEW_INTERVALS.length + 2) return "done";
  if (task.nextReview < today) return "overdue";
  if (task.nextReview === today) return "review-today";
  return "pending";
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ═══════════════════════════════════════════
// 遗忘曲线可视化数据
// ═══════════════════════════════════════════

const FORGETTING_CURVE = [
  { time: "立即", retention: 100 },
  { time: "20分钟后", retention: 58 },
  { time: "1小时后", retention: 44 },
  { time: "8小时后", retention: 36 },
  { time: "1天后", retention: 33 },
  { time: "2天后", retention: 28 },
  { time: "6天后", retention: 25 },
  { time: "31天后", retention: 21 },
];

// ═══════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════

export function EbbinghausTool() {
  const [tasks, setTasks] = useState<MemoryTask[]>(loadTasks);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [activeTab, setActiveTab] = useState<"tasks" | "curve" | "plan">("tasks");

  const today = todayStr();

  const tasksWithStatus = useMemo(() =>
    tasks.map(t => ({ ...t, status: getStatus(t, today) }))
  , [tasks, today]);

  const reviewToday = tasksWithStatus.filter(t => t.status === "review-today" || t.status === "overdue");
  const upcoming = tasksWithStatus.filter(t => t.status === "pending");
  const done = tasksWithStatus.filter(t => t.status === "done");

  const addTask = () => {
    if (!newName.trim()) return;
    const task: MemoryTask = {
      id: `task-${Date.now()}`,
      name: newName.trim(),
      createdAt: today,
      reviewDates: [today],
      nextReview: computeNextReview(today, 0),
      completedReviews: 0,
      status: "review-today",
    };
    const newTasks = [...tasks, task];
    setTasks(newTasks);
    saveTasks(newTasks);
    setNewName("");
    setShowAdd(false);
  };

  const completeReview = (id: string) => {
    const newTasks = tasks.map(t => {
      if (t.id !== id) return t;
      const newCompleted = t.completedReviews + 1;
      return {
        ...t,
        completedReviews: newCompleted,
        reviewDates: [...t.reviewDates, today],
        nextReview: computeNextReview(t.createdAt, newCompleted),
      };
    });
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const deleteTask = (id: string) => {
    const newTasks = tasks.filter(t => t.id !== id);
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  return (
    <div className="space-y-6">
      <PageTitle
        icon={<Brain className="w-6 h-6" />}
        title="艾宾浩斯记忆曲线"
        subtitle="科学复习计划 · 遗忘曲线可视化 · 复习提醒"
      />

      {/* 标签切换 */}
      <div className="flex gap-2">
        {[
          { key: "tasks" as const, label: "复习任务", icon: <Calendar className="w-4 h-4" /> },
          { key: "curve" as const, label: "遗忘曲线", icon: <BarChart3 className="w-4 h-4" /> },
          { key: "plan" as const, label: "复习计划", icon: <Clock className="w-4 h-4" /> },
        ].map(tab => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            <span className="ml-1">{tab.label}</span>
          </Button>
        ))}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "今日待复习", value: reviewToday.length, color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "已掌握", value: done.length, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "即将到期", value: upcoming.filter(t => {
            const days = Math.ceil((new Date(t.nextReview).getTime() - new Date(today).getTime()) / 86400000);
            return days <= 3 && days >= 0;
          }).length, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "总任务数", value: tasks.length, color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg} ${s.color}`}>
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 复习任务列表 */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          {/* 今日待复习 */}
          {reviewToday.length > 0 && (
            <div>
              <h3 className="font-semibold text-orange-500 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                今日待复习（{reviewToday.length}）
              </h3>
              <div className="space-y-2">
                {reviewToday.map(t => (
                  <Card key={t.id} className="border-orange-500/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          已复习 {t.completedReviews}/{EB_REVIEW_INTERVALS.length} 次
                          {t.status === "overdue" && (
                            <span className="text-red-500 ml-2">已逾期 {Math.ceil((new Date(today).getTime() - new Date(t.nextReview).getTime()) / 86400000)} 天</span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => completeReview(t.id)}>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          完成复习
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteTask(t.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 即将到期 */}
          {upcoming.length > 0 && (
            <div>
              <h3 className="font-semibold text-muted-foreground mb-2">即将到期</h3>
              <div className="space-y-2">
                {upcoming.map(t => {
                  const daysLeft = Math.ceil((new Date(t.nextReview).getTime() - new Date(today).getTime()) / 86400000);
                  return (
                    <Card key={t.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground">
                            下次复习：{t.nextReview}（{daysLeft} 天后）
                          </p>
                        </div>
                        <Badge variant="outline" className={daysLeft <= 1 ? "text-orange-500" : ""}>
                          {daysLeft} 天
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* 添加按钮 */}
          <Button onClick={() => setShowAdd(!showAdd)} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            添加新学习任务
          </Button>

          {showAdd && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <Input
                  placeholder="例如：背诵唐诗300首、复习线性代数第3章..."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTask()}
                />
                <div className="flex gap-2">
                  <Button onClick={addTask} disabled={!newName.trim()} className="flex-1">添加</Button>
                  <Button variant="outline" onClick={() => setShowAdd(false)}>取消</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  添加后系统将自动按艾宾浩斯遗忘曲线安排复习时间：1天、2天、4天、7天、15天、30天、60天、90天
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 遗忘曲线可视化 */}
      {activeTab === "curve" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              艾宾浩斯遗忘曲线
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 柱状图：记忆留存率 */}
            <div>
              <h4 className="text-sm font-medium mb-3">记忆留存率随时间下降</h4>
              <div className="space-y-3">
                {FORGETTING_CURVE.map((d, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{d.time}</span>
                      <span className={d.retention > 50 ? "text-emerald-500" : "text-red-500"}>
                        {d.retention}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${d.retention > 50 ? "bg-emerald-500" : "bg-red-500"}`}
                        style={{ width: `${d.retention}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 复习时间线 */}
            <div>
              <h4 className="text-sm font-medium mb-3">标准复习时间线</h4>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {EB_LABELS.map((label, i) => (
                  <div key={i} className="flex flex-col items-center min-w-16">
                    <div className={`w-3 h-3 rounded-full ${i === 0 ? "bg-primary" : "bg-primary/60"}`} />
                    <span className="text-[10px] text-muted-foreground mt-1">{label}</span>
                    {i < EB_LABELS.length - 1 && (
                      <div className="w-12 h-0.5 bg-primary/30 mt-1.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg text-sm text-muted-foreground space-y-1">
              <p>📊 <strong>艾宾浩斯遗忘曲线</strong>由德国心理学家赫尔曼·艾宾浩斯于1885年提出。</p>
              <p>💡 研究表明，如果不复习，1小时后记忆留存率仅为44%，1天后降至33%。</p>
              <p>✅ 在关键时间点（1天、2天、4天...）进行复习，可将记忆永久固化。</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 复习计划 */}
      {activeTab === "plan" && (
        <div className="space-y-4">
          <h3 className="font-semibold">未来 30 天复习计划</h3>
          {Array.from({ length: 30 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().slice(0, 10);
            const dayTasks = tasksWithStatus.filter(t => t.nextReview === dateStr);
            if (dayTasks.length === 0) return null;
            return (
              <Card key={dateStr} className="border-primary/20">
                <CardContent className="p-3 flex items-center gap-3">
                  <Badge variant="outline">{dateStr.slice(5)}</Badge>
                  <div className="flex-1">
                    {dayTasks.map(t => (
                      <p key={t.id} className="text-sm">{t.name}</p>
                    ))}
                  </div>
                  <Badge>{dayTasks.length} 项</Badge>
                </CardContent>
              </Card>
            );
          })}
          {tasks.length === 0 && (
            <p className="text-center text-muted-foreground py-8">暂无任务，点击"添加新学习任务"开始</p>
          )}
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        🧠 基于艾宾浩斯遗忘曲线的科学复习工具，数据保存在浏览器本地。
      </p>
    </div>
  );
}
