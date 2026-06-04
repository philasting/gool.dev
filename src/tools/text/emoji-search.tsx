"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

interface EmojiEntry {
  emoji: string;
  name: string;
  keywords: string[];
}

interface EmojiCategory {
  name: string;
  emojis: EmojiEntry[];
}

const EMOJI_DATA: EmojiCategory[] = [
  {
    name: "😀 表情",
    emojis: [
      { emoji: "😀", name: "笑脸", keywords: ["开心", "微笑", "happy"] },
      { emoji: "😁", name: "露齿笑", keywords: ["开心", "happy"] },
      { emoji: "😂", name: "笑哭", keywords: ["笑死", "太好笑", "joy"] },
      { emoji: "🤣", name: "笑倒", keywords: ["大笑", "rofl"] },
      { emoji: "😊", name: "害羞笑", keywords: ["害羞", "blush"] },
      { emoji: "😇", name: "天使", keywords: ["善良", "innocent"] },
      { emoji: "🙂", name: "微笑", keywords: ["微笑", "slight smile"] },
      { emoji: "😉", name: "眨眼", keywords: ["wink", "眨眼"] },
      { emoji: "😋", name: "馋嘴", keywords: ["好吃", "yummy"] },
      { emoji: "😌", name: "如释重负", keywords: ["放松", "relieved"] },
      { emoji: "😍", name: "花痴", keywords: ["喜欢", "爱", "love"] },
      { emoji: "🥰", name: "被爱", keywords: ["爱心", "love"] },
      { emoji: "😘", name: "飞吻", keywords: ["亲亲", "kiss"] },
      { emoji: "😗", name: "亲亲", keywords: ["kiss"] },
      { emoji: "😙", name: "微笑亲", keywords: ["kiss"] },
      { emoji: "😚", name: "闭眼亲", keywords: ["kiss"] },
      { emoji: "😜", name: "吐舌眨眼", keywords: ["调皮", "wink"] },
      { emoji: "😝", name: "闭眼吐舌", keywords: ["调皮"] },
      { emoji: "😛", name: "吐舌", keywords: ["调皮"] },
      { emoji: "🤑", name: "发财", keywords: ["钱", "money"] },
      { emoji: "🤗", name: "拥抱", keywords: ["hug", "抱抱"] },
      { emoji: "🤭", name: "捂嘴笑", keywords: ["偷笑"] },
      { emoji: "🤫", name: "嘘", keywords: ["安静", "secret"] },
      { emoji: "🤔", name: "思考", keywords: ["想", "thinking"] },
      { emoji: "🤐", name: "闭嘴", keywords: ["沉默"] },
      { emoji: "🤨", name: "挑眉", keywords: ["怀疑"] },
      { emoji: "😐", name: "面无表情", keywords: ["neutral"] },
      { emoji: "😑", name: "无语", keywords: ["expressionless"] },
      { emoji: "😶", name: "沉默", keywords: ["no mouth"] },
      { emoji: "😏", name: "坏笑", keywords: ["smirk"] },
      { emoji: "😒", name: "不高兴", keywords: ["unamused"] },
      { emoji: "🙄", name: "翻白眼", keywords: ["eye roll"] },
      { emoji: "😬", name: "尴尬", keywords: ["grimace"] },
      { emoji: "😮‍💨", name: "叹气", keywords: ["exhale"] },
      { emoji: "🤥", name: "说谎", keywords: ["pinocchio"] },
      { emoji: "😔", name: "沮丧", keywords: ["sad", "pensive"] },
      { emoji: "😪", name: "困", keywords: ["sleepy"] },
      { emoji: "🤤", name: "流口水", keywords: ["drool"] },
      { emoji: "😴", name: "睡觉", keywords: ["zzz", "sleep"] },
      { emoji: "😷", name: "口罩", keywords: ["mask", "sick"] },
      { emoji: "🤒", name: "发烧", keywords: ["sick"] },
      { emoji: "🤕", name: "受伤", keywords: ["hurt"] },
      { emoji: "🤢", name: "恶心", keywords: ["nauseated"] },
      { emoji: "🤮", name: "呕吐", keywords: ["vomit"] },
      { emoji: "🥵", name: "热", keywords: ["hot"] },
      { emoji: "🥶", name: "冷", keywords: ["cold"] },
      { emoji: "😱", name: "吓到", keywords: ["恐惧", "scream"] },
      { emoji: "😨", name: "害怕", keywords: ["fearful"] },
      { emoji: "😰", name: "焦虑", keywords: ["anxious"] },
      { emoji: "😥", name: "失望", keywords: ["disappointed"] },
      { emoji: "😢", name: "哭", keywords: ["cry"] },
      { emoji: "😭", name: "大哭", keywords: ["sob"] },
      { emoji: "😤", name: "生气", keywords: ["triumph"] },
      { emoji: "😠", name: "愤怒", keywords: ["angry"] },
      { emoji: "😡", name: "暴怒", keywords: ["rage"] },
      { emoji: "🤬", name: "骂人", keywords: ["cursing"] },
      { emoji: "😈", name: "小恶魔", keywords: ["devil"] },
      { emoji: "👿", name: "恶魔", keywords: ["devil", "angry"] },
      { emoji: "💀", name: "骷髅", keywords: ["skull", "dead"] },
      { emoji: "☠️", name: "骷髅旗", keywords: ["danger"] },
      { emoji: "👻", name: "幽灵", keywords: ["ghost"] },
      { emoji: "👽", name: "外星人", keywords: ["alien"] },
      { emoji: "🤖", name: "机器人", keywords: ["robot"] },
      { emoji: "💩", name: "便便", keywords: ["poop"] },
      { emoji: "🤡", name: "小丑", keywords: ["clown"] },
    ],
  },
  {
    name: "👋 手势",
    emojis: [
      { emoji: "👋", name: "挥手", keywords: ["hi", "bye"] },
      { emoji: "🤚", name: "举手背", keywords: ["stop"] },
      { emoji: "✋", name: "举手", keywords: ["stop", "high five"] },
      { emoji: "🖖", name: "分指手", keywords: ["spock"] },
      { emoji: "👌", name: "OK", keywords: ["ok", "完美"] },
      { emoji: "🤌", name: "捏手指", keywords: ["italian"] },
      { emoji: "✌️", name: "耶", keywords: ["victory", "peace"] },
      { emoji: "🤞", name: "交叉手指", keywords: ["luck"] },
      { emoji: "🤟", name: "爱你手势", keywords: ["love you"] },
      { emoji: "🤘", name: "摇滚", keywords: ["rock"] },
      { emoji: "🤙", name: "打电话手势", keywords: ["call"] },
      { emoji: "👈", name: "向左指", keywords: ["left"] },
      { emoji: "👉", name: "向右指", keywords: ["right"] },
      { emoji: "👆", name: "向上指", keywords: ["up"] },
      { emoji: "👇", name: "向下指", keywords: ["down"] },
      { emoji: "☝️", name: "向上指一", keywords: ["one"] },
      { emoji: "👍", name: "赞", keywords: ["好", "like", "thumbs up"] },
      { emoji: "👎", name: "踩", keywords: ["差", "dislike", "thumbs down"] },
      { emoji: "✊", name: "握拳", keywords: ["fist"] },
      { emoji: "👊", name: "出拳", keywords: ["punch"] },
      { emoji: "🤛", name: "左拳", keywords: ["fist"] },
      { emoji: "🤜", name: "右拳", keywords: ["fist"] },
      { emoji: "👏", name: "鼓掌", keywords: ["clap"] },
      { emoji: "🙌", name: "举双手", keywords: ["celebration"] },
      { emoji: "🫶", name: "比心手", keywords: ["heart hands"] },
      { emoji: "👐", name: "张开双手", keywords: ["open"] },
      { emoji: "🤲", name: "掌心向上", keywords: ["palms up"] },
      { emoji: "🤝", name: "握手", keywords: ["handshake"] },
      { emoji: "🙏", name: "合十", keywords: ["pray", "please"] },
      { emoji: "✍️", name: "写字", keywords: ["write"] },
      { emoji: "💅", name: "涂指甲", keywords: ["nail polish"] },
      { emoji: "🦶", name: "脚", keywords: ["foot"] },
    ],
  },
  {
    name: "🐱 动物",
    emojis: [
      { emoji: "🐶", name: "狗", keywords: ["dog"] },
      { emoji: "🐱", name: "猫", keywords: ["cat"] },
      { emoji: "🐭", name: "老鼠", keywords: ["mouse"] },
      { emoji: "🐹", name: "仓鼠", keywords: ["hamster"] },
      { emoji: "🐰", name: "兔子", keywords: ["rabbit"] },
      { emoji: "🦊", name: "狐狸", keywords: ["fox"] },
      { emoji: "🐻", name: "熊", keywords: ["bear"] },
      { emoji: "🐼", name: "熊猫", keywords: ["panda"] },
      { emoji: "🐨", name: "考拉", keywords: ["koala"] },
      { emoji: "🐯", name: "老虎", keywords: ["tiger"] },
      { emoji: "🦁", name: "狮子", keywords: ["lion"] },
      { emoji: "🐮", name: "牛", keywords: ["cow"] },
      { emoji: "🐷", name: "猪", keywords: ["pig"] },
      { emoji: "🐸", name: "青蛙", keywords: ["frog"] },
      { emoji: "🐵", name: "猴子", keywords: ["monkey"] },
      { emoji: "🐔", name: "鸡", keywords: ["chicken"] },
      { emoji: "🐧", name: "企鹅", keywords: ["penguin"] },
      { emoji: "🐦", name: "鸟", keywords: ["bird"] },
      { emoji: "🦅", name: "鹰", keywords: ["eagle"] },
      { emoji: "🦆", name: "鸭子", keywords: ["duck"] },
      { emoji: "🦉", name: "猫头鹰", keywords: ["owl"] },
      { emoji: "🐺", name: "狼", keywords: ["wolf"] },
      { emoji: "🐗", name: "野猪", keywords: ["boar"] },
      { emoji: "🐴", name: "马", keywords: ["horse"] },
      { emoji: "🦄", name: "独角兽", keywords: ["unicorn"] },
      { emoji: "🐝", name: "蜜蜂", keywords: ["bee"] },
      { emoji: "🐛", name: "毛毛虫", keywords: ["bug"] },
      { emoji: "🦋", name: "蝴蝶", keywords: ["butterfly"] },
      { emoji: "🐌", name: "蜗牛", keywords: ["snail"] },
      { emoji: "🐙", name: "章鱼", keywords: ["octopus"] },
      { emoji: "🐠", name: "鱼", keywords: ["fish"] },
      { emoji: "🐬", name: "海豚", keywords: ["dolphin"] },
      { emoji: "🐳", name: "鲸鱼", keywords: ["whale"] },
      { emoji: "🦈", name: "鲨鱼", keywords: ["shark"] },
      { emoji: "🐊", name: "鳄鱼", keywords: ["crocodile"] },
      { emoji: "🐢", name: "乌龟", keywords: ["turtle"] },
      { emoji: "🦎", name: "蜥蜴", keywords: ["lizard"] },
      { emoji: "🐍", name: "蛇", keywords: ["snake"] },
      { emoji: "🐲", name: "龙", keywords: ["dragon"] },
    ],
  },
  {
    name: "🍎 食物",
    emojis: [
      { emoji: "🍎", name: "红苹果", keywords: ["apple"] },
      { emoji: "🍐", name: "梨", keywords: ["pear"] },
      { emoji: "🍊", name: "橘子", keywords: ["orange"] },
      { emoji: "🍋", name: "柠檬", keywords: ["lemon"] },
      { emoji: "🍌", name: "香蕉", keywords: ["banana"] },
      { emoji: "🍉", name: "西瓜", keywords: ["watermelon"] },
      { emoji: "🍇", name: "葡萄", keywords: ["grapes"] },
      { emoji: "🍓", name: "草莓", keywords: ["strawberry"] },
      { emoji: "🫐", name: "蓝莓", keywords: ["blueberry"] },
      { emoji: "🍒", name: "樱桃", keywords: ["cherries"] },
      { emoji: "🍑", name: "桃子", keywords: ["peach"] },
      { emoji: "🥭", name: "芒果", keywords: ["mango"] },
      { emoji: "🍍", name: "菠萝", keywords: ["pineapple"] },
      { emoji: "🥥", name: "椰子", keywords: ["coconut"] },
      { emoji: "🥝", name: "猕猴桃", keywords: ["kiwi"] },
      { emoji: "🍅", name: "番茄", keywords: ["tomato"] },
      { emoji: "🥑", name: "牛油果", keywords: ["avocado"] },
      { emoji: "🍔", name: "汉堡", keywords: ["burger"] },
      { emoji: "🍟", name: "薯条", keywords: ["fries"] },
      { emoji: "🍕", name: "披萨", keywords: ["pizza"] },
      { emoji: "🌭", name: "热狗", keywords: ["hotdog"] },
      { emoji: "🥪", name: "三明治", keywords: ["sandwich"] },
      { emoji: "🌮", name: "墨西哥卷", keywords: ["taco"] },
      { emoji: "🍜", name: "面条", keywords: ["noodle"] },
      { emoji: "🍲", name: "火锅", keywords: ["pot"] },
      { emoji: "🍣", name: "寿司", keywords: ["sushi"] },
      { emoji: "🍱", name: "便当", keywords: ["bento"] },
      { emoji: "🍛", name: "咖喱", keywords: ["curry"] },
      { emoji: "🍚", name: "米饭", keywords: ["rice"] },
      { emoji: "🍰", name: "蛋糕", keywords: ["cake"] },
      { emoji: "🧁", name: "纸杯蛋糕", keywords: ["cupcake"] },
      { emoji: "🍩", name: "甜甜圈", keywords: ["donut"] },
      { emoji: "🍪", name: "饼干", keywords: ["cookie"] },
      { emoji: "🍫", name: "巧克力", keywords: ["chocolate"] },
      { emoji: "🍬", name: "糖果", keywords: ["candy"] },
      { emoji: "☕", name: "咖啡", keywords: ["coffee"] },
      { emoji: "🍵", name: "茶", keywords: ["tea"] },
      { emoji: "🧃", name: "果汁盒", keywords: ["juice"] },
      { emoji: "🍺", name: "啤酒", keywords: ["beer"] },
      { emoji: "🍷", name: "红酒", keywords: ["wine"] },
    ],
  },
  {
    name: "🚗 交通",
    emojis: [
      { emoji: "🚗", name: "小汽车", keywords: ["car"] },
      { emoji: "🚕", name: "出租车", keywords: ["taxi"] },
      { emoji: "🚌", name: "公交车", keywords: ["bus"] },
      { emoji: "🚎", name: "电车", keywords: ["trolley"] },
      { emoji: "🏎️", name: "赛车", keywords: ["race car"] },
      { emoji: "🚓", name: "警车", keywords: ["police"] },
      { emoji: "🚑", name: "救护车", keywords: ["ambulance"] },
      { emoji: "🚒", name: "消防车", keywords: ["fire truck"] },
      { emoji: "🚐", name: "面包车", keywords: ["van"] },
      { emoji: "🛻", name: "皮卡", keywords: ["pickup"] },
      { emoji: "🚚", name: "货车", keywords: ["truck"] },
      { emoji: "🚛", name: "拖车", keywords: ["trailer"] },
      { emoji: "🚜", name: "拖拉机", keywords: ["tractor"] },
      { emoji: "🛵", name: "摩托车", keywords: ["scooter"] },
      { emoji: "🏍️", name: "机车", keywords: ["motorcycle"] },
      { emoji: "🚲", name: "自行车", keywords: ["bicycle"] },
      { emoji: "🛴", name: "滑板车", keywords: ["scooter"] },
      { emoji: "✈️", name: "飞机", keywords: ["airplane"] },
      { emoji: "🚀", name: "火箭", keywords: ["rocket"] },
      { emoji: "🛸", name: "飞碟", keywords: ["UFO"] },
      { emoji: "🚢", name: "轮船", keywords: ["ship"] },
      { emoji: "⛵", name: "帆船", keywords: ["sailboat"] },
      { emoji: "🚤", name: "快艇", keywords: ["speedboat"] },
      { emoji: "🚂", name: "火车", keywords: ["train"] },
      { emoji: "🚇", name: "地铁", keywords: ["metro"] },
    ],
  },
  {
    name: "💡 物品",
    emojis: [
      { emoji: "⌚", name: "手表", keywords: ["watch"] },
      { emoji: "📱", name: "手机", keywords: ["phone"] },
      { emoji: "💻", name: "笔记本电脑", keywords: ["laptop"] },
      { emoji: "🖥️", name: "台式电脑", keywords: ["desktop"] },
      { emoji: "🖨️", name: "打印机", keywords: ["printer"] },
      { emoji: "⌨️", name: "键盘", keywords: ["keyboard"] },
      { emoji: "🖱️", name: "鼠标", keywords: ["mouse"] },
      { emoji: "💾", name: "软盘", keywords: ["floppy"] },
      { emoji: "📷", name: "相机", keywords: ["camera"] },
      { emoji: "📹", name: "摄像机", keywords: ["video"] },
      { emoji: "📺", name: "电视", keywords: ["TV"] },
      { emoji: "📻", name: "收音机", keywords: ["radio"] },
      { emoji: "🎙️", name: "麦克风", keywords: ["microphone"] },
      { emoji: "🎧", name: "耳机", keywords: ["headphones"] },
      { emoji: "📚", name: "书", keywords: ["books"] },
      { emoji: "📖", name: "翻开的书", keywords: ["book"] },
      { emoji: "✏️", name: "铅笔", keywords: ["pencil"] },
      { emoji: "🖊️", name: "钢笔", keywords: ["pen"] },
      { emoji: "💡", name: "灯泡", keywords: ["idea", "light"] },
      { emoji: "🔦", name: "手电筒", keywords: ["flashlight"] },
      { emoji: "🔋", name: "电池", keywords: ["battery"] },
      { emoji: "🔑", name: "钥匙", keywords: ["key"] },
      { emoji: "🔒", name: "锁", keywords: ["lock"] },
      { emoji: "🔧", name: "扳手", keywords: ["wrench"] },
      { emoji: "🔨", name: "锤子", keywords: ["hammer"] },
      { emoji: "🛠️", name: "工具", keywords: ["tools"] },
      { emoji: "💰", name: "钱袋", keywords: ["money"] },
      { emoji: "💳", name: "信用卡", keywords: ["card"] },
      { emoji: "📧", name: "邮件", keywords: ["email"] },
      { emoji: "📦", name: "包裹", keywords: ["package"] },
    ],
  },
  {
    name: "❤️ 符号",
    emojis: [
      { emoji: "❤️", name: "红心", keywords: ["love", "爱"] },
      { emoji: "🧡", name: "橙心", keywords: ["love"] },
      { emoji: "💛", name: "黄心", keywords: ["love"] },
      { emoji: "💚", name: "绿心", keywords: ["love"] },
      { emoji: "💙", name: "蓝心", keywords: ["love"] },
      { emoji: "💜", name: "紫心", keywords: ["love"] },
      { emoji: "🖤", name: "黑心", keywords: ["love"] },
      { emoji: "🤍", name: "白心", keywords: ["love"] },
      { emoji: "🤎", name: "棕心", keywords: ["love"] },
      { emoji: "💔", name: "心碎", keywords: ["broken heart"] },
      { emoji: "💕", name: "两颗心", keywords: ["love"] },
      { emoji: "💞", name: "旋转的心", keywords: ["love"] },
      { emoji: "💓", name: "跳动的心", keywords: ["heartbeat"] },
      { emoji: "💗", name: "心在长大", keywords: ["love"] },
      { emoji: "💖", name: "闪亮的心", keywords: ["love"] },
      { emoji: "💘", name: "箭心", keywords: ["cupid"] },
      { emoji: "✅", name: "对号", keywords: ["check", "完成"] },
      { emoji: "❌", name: "叉号", keywords: ["cross", "错误"] },
      { emoji: "⭐", name: "星星", keywords: ["star"] },
      { emoji: "🌟", name: "闪亮星", keywords: ["glowing star"] },
      { emoji: "💫", name: "头晕星", keywords: ["dizzy"] },
      { emoji: "🔥", name: "火", keywords: ["fire", "hot"] },
      { emoji: "💧", name: "水滴", keywords: ["water", "drop"] },
      { emoji: "⚡", name: "闪电", keywords: ["lightning"] },
      { emoji: "🌈", name: "彩虹", keywords: ["rainbow"] },
      { emoji: "☀️", name: "太阳", keywords: ["sun"] },
      { emoji: "🌙", name: "月亮", keywords: ["moon"] },
      { emoji: "⭕", name: "圆", keywords: ["circle"] },
      { emoji: "❗", name: "感叹号", keywords: ["exclamation"] },
      { emoji: "❓", name: "问号", keywords: ["question"] },
      { emoji: "💯", name: "满分", keywords: ["100", "perfect"] },
      { emoji: "🔝", name: "顶部", keywords: ["top"] },
      { emoji: "🆕", name: "新", keywords: ["new"] },
      { emoji: "🆗", name: "OK", keywords: ["ok"] },
      { emoji: "🆘", name: "求救", keywords: ["SOS", "help"] },
      { emoji: "⚠️", name: "警告", keywords: ["warning"] },
      { emoji: "🚫", name: "禁止", keywords: ["prohibited"] },
      { emoji: "♻️", name: "回收", keywords: ["recycle"] },
      { emoji: "🔰", name: "初心者", keywords: ["beginner"] },
      { emoji: "♾️", name: "无限", keywords: ["infinity"] },
    ],
  },
];

export function EmojiSearchTool() {
  const [search, setSearch] = useState("");
  const [copiedEmoji, setCopiedEmoji] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const filteredData = useMemo(() => {
    if (!search.trim()) return EMOJI_DATA;
    const q = search.toLowerCase().trim();
    return EMOJI_DATA.map((cat) => ({
      ...cat,
      emojis: cat.emojis.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.emoji.includes(q) ||
          e.keywords.some((k) => k.toLowerCase().includes(q))
      ),
    })).filter((cat) => cat.emojis.length > 0);
  }, [search]);

  const handleCopyEmoji = async (emoji: string) => {
    try {
      await navigator.clipboard.writeText(emoji);
      setCopiedEmoji(emoji);
      setTimeout(() => setCopiedEmoji(null), 1500);
    } catch {
      // fallback
    }
  };

  const toggleCategory = (name: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索 Emoji（名称/关键词）..."
        className="max-w-md"
      />

      <div className="space-y-4 max-h-[600px] overflow-auto custom-scrollbar">
        {filteredData.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">未找到匹配的 Emoji</p>
        ) : (
          filteredData.map((cat) => (
            <Card key={cat.name}>
              <CardContent className="p-3">
                <button
                  onClick={() => toggleCategory(cat.name)}
                  className="flex items-center gap-2 w-full text-left mb-2"
                >
                  <span className="text-sm font-semibold">{cat.name}</span>
                  <Badge variant="secondary" className="text-xs">{cat.emojis.length}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {collapsed.has(cat.name) ? "展开" : "收起"}
                  </span>
                </button>
                {!collapsed.has(cat.name) && (
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1">
                    {cat.emojis.map((e) => (
                      <button
                        key={e.emoji + e.name}
                        onClick={() => handleCopyEmoji(e.emoji)}
                        className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-accent transition-colors group relative"
                        title={e.name}
                      >
                        <span className="text-2xl leading-none">{e.emoji}</span>
                        {copiedEmoji === e.emoji && (
                          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
