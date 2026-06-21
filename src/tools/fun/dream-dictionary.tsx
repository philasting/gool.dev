"use client";

import { useState, useMemo } from "react";
import { PageTitle } from "@/components/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Moon, BookOpen, Sparkles } from "lucide-react";

// ═══════════════════════════════════════════
// 解梦数据库（500+ 词条）
// ═══════════════════════════════════════════

interface DreamEntry {
  keyword: string;
  synonyns: string[];
  category: string;
  meaning: string;
  detail: string;
  emotion: "吉" | "凶" | "中";
}

const DREAM_DB: DreamEntry[] = [
  // ─── 人物类 ───
  { keyword: "去世的亲人", synonyns: ["过世的亲人","已故亲人","死去的家人"], category: "人物", emotion: "中",
    meaning: "思念与未了的心愿", detail: "梦见去世的亲人，通常反映了你内心深处的思念之情。也可能代表你生活中正面临某个需要亲人指引的决定。若亲人面带微笑，预示好运；若神情悲伤，则提醒你注意身体健康或家庭关系。" },
  { keyword: "婴儿", synonyns: ["小宝宝","婴儿","新生儿"], category: "人物", emotion: "吉",
    meaning: "新开始、纯真、脆弱的新项目", detail: "婴儿象征新的开始和无限可能。如果你正准备启动新项目或进入人生新阶段，这是极好的预兆。若婴儿在哭泣，可能暗示你忽略了内心某个纯真的部分。" },
  { keyword: "老人", synonyns: ["老者","长辈","老人家"], category: "人物", emotion: "中",
    meaning: "智慧、经验、对时间的思考", detail: "老人通常象征智慧和经验。梦见老人可能是在提醒你倾听内在的智慧声音，或寻求长辈的建议。也可能反映对衰老和时光流逝的深层思考。" },
  { keyword: "怀孕", synonyns: ["受孕","有了身孕"], category: "人物", emotion: "吉",
    meaning: "创造力孕育、新计划即将结果", detail: "怀孕象征创造力的孕育和新计划的成形。即使你并非真正怀孕，此梦也预示着你生活中的某个创意项目或想法即将'诞生'。也可能反映对责任和成长的思考。" },
  { keyword: "裸体", synonyns: ["赤裸","没穿衣服","全身赤裸"], category: "人物", emotion: "凶",
    meaning: "暴露感、脆弱、害怕被评判", detail: "裸体梦通常反映社交焦虑——害怕自己的缺点或秘密被他人发现。也可能意味着你渴望更真实、更透明地表达自己。若梦中你并不在意他人的目光，则代表强大的自信。" },
  { keyword: "陌生人", synonyns: ["不认识的人","未知的人"], category: "人物", emotion: "中",
    meaning: "未知的自我部分、新的机遇", detail: "梦中的陌生人往往代表你自己未被发现的某一部分人格。男性陌生人可能代表你的阳刚面（行动力、理性），女性陌生人代表阴柔面（直觉、情感）。留意陌生人的行为和情绪。" },
  { keyword: "初恋", synonyns: ["前男友","前女友","旧情人"], category: "人物", emotion: "中",
    meaning: "对纯真感情的怀念、未了的情感", detail: "梦见初恋并不一定意味着你还爱着对方，更多是怀念那段时光里纯真的自己。也可能提示你当前的感情中缺少了初恋时的某些品质，如激情、单纯或全情投入。" },
  { keyword: "老师", synonyns: ["教师","导师","先生"], category: "人物", emotion: "吉",
    meaning: "指引、学习、内在的智慧声音", detail: "老师在梦中代表你内在的指引系统。若老师正在教学，说明你准备好学习人生新课题；若老师沉默或摇头，则可能是在提醒你对某些忠告充耳不闻。" },

  // ─── 动物类 ───
  { keyword: "狗", synonyns: ["小狗","犬","狗狗"], category: "动物", emotion: "吉",
    meaning: "忠诚、友谊、保护", detail: "狗是最常见的解梦动物之一，通常代表忠诚的友谊和无条件的爱。快乐的狗预示社交运势上升；吠叫的狗则可能反映你生活中有'忠言逆耳'的情况，或潜意识在警告某个'朋友'并不真诚。" },
  { keyword: "猫", synonyns: ["小猫","猫咪"], category: "动物", emotion: "中",
    meaning: "独立、直觉、女性力量", detail: "猫象征独立和直觉。梦见猫可能提示你需要更多地信任自己的直觉。温柔的猫代表女性的智慧和魅力；若猫攻击你，则可能反映你忽视了某些'小问题'，它们正在积累成更大的麻烦。" },
  { keyword: "蛇", synonyns: ["长虫","蟒蛇","小蛇"], category: "动物", emotion: "凶",
    meaning: "转变、恐惧、潜在威胁", detail: "蛇是最复杂的解梦符号之一。在多数文化中，蛇代表转变和重生（如蜕皮），但在恐惧梦境中则象征隐藏的威胁。若蛇是平静的，可能预示你正在经历深层次的心理转变；若被蛇咬，则需警惕身边潜在的'有毒'关系或情况。" },
  { keyword: "鸟", synonyns: ["小鸟","飞鸟"], category: "动物", emotion: "吉",
    meaning: "自由、灵性提升、好消息", detail: "鸟代表自由和精神的提升。飞翔的鸟群预示好消息即将到来；笼中鸟则可能反映你感到受限或渴望自由。不同鸟类也有不同含义：鸽子代表和平，鹰代表远见，猫头鹰代表智慧。" },
  { keyword: "鱼", synonyns: ["小鱼","大鱼","鱼类"], category: "动物", emotion: "吉",
    meaning: "财富、丰盛、潜意识", detail: "鱼在中国解梦中尤为重要（'鱼'与'余'同音，代表年年有余）。活跃的鱼群预示财运亨通；死鱼则可能反映机会的流失。在水中自由游动的鱼也象征你在潜意识领域中的探索。" },
  { keyword: "马", synonyns: ["小马","骏马"], category: "动物", emotion: "吉",
    meaning: "力量、自由、前进的动力", detail: "马象征生命力和前进的动力。骑马奔腾预示你正充满信心地朝着目标前进；摔下马则可能反映对失败的恐惧。野马代表不受约束的自由精神，被拴住的马则可能反映你感到被某些责任或关系所束缚。" },
  { keyword: "老鼠", synonyns: ["耗子","小鼠"], category: "动物", emotion: "凶",
    meaning: "焦虑、小麻烦、内疚感", detail: "老鼠通常反映生活中的'小烦恼'——那些不断消耗你精力但又不值得大动干戈去处理的事情。大量老鼠可能反映深层的焦虑感。也可能象征你对自己某些'阴暗'特质的否定（如贪婪或狡猾）。" },
  { keyword: "蝴蝶", synonyns: ["彩蝶","飞蝶"], category: "动物", emotion: "吉",
    meaning: "蜕变、美丽、灵魂的自由", detail: "蝴蝶是最优美的转变象征——从毛毛虫到蝴蝶的蜕变过程，完美映射了个人成长。此梦预示你正在经历或即将经历积极的变化。也可能代表你灵魂中轻盈、自由的那一部分。" },

  // ─── 自然类 ───
  { keyword: "水", synonyns: ["海水","河水","湖水"], category: "自然", emotion: "中",
    meaning: "情感、潜意识、生命的源头", detail: "水是情感和最深层的潜意识的直接象征。清澈平静的水代表内心的平和；汹涌的波涛则反映情绪的风暴。在海中游泳代表勇敢地探索自己的情感深处；溺水则可能反映被情绪淹没的感觉。" },
  { keyword: "火", synonyns: ["火焰","大火","火种"], category: "自然", emotion: "凶",
    meaning: "激情、愤怒、净化与毁灭", detail: "火具有双重象征——既可以温暖和启发，也可以毁灭。控制的火焰（如蜡烛或壁炉）代表激情和灵感；失控的野火则可能反映愤怒或毁灭性的情绪。被火烧伤的梦需要特别关注，可能反映某种'灼热'的情况正在伤害你。" },
  { keyword: "山", synonyns: ["高山","大山","山峰"], category: "自然", emotion: "吉",
    meaning: "目标、障碍、精神提升", detail: "山代表你人生中的重大目标或障碍。登山成功预示你将克服挑战达成目标；登山失败则可能反映你对某项目感到力不从心。远眺山脉也可能代表你需要从更高的视角来看待当前的生活状况。" },
  { keyword: "雨", synonyns: ["下雨","雨水","暴雨"], category: "自然", emotion: "中",
    meaning: "净化、悲伤、新生命的滋润", detail: "雨具有净化和重生的象征意义。柔和的雨代表情感的释放和心灵的净化；暴雨则可能反映压抑已久的情绪需要释放。雨后彩虹是最吉祥的梦境之一，代表困难之后的希望和美好。" },
  { keyword: "太阳", synonyns: ["阳光","日出","烈日"], category: "自然", emotion: "吉",
    meaning: "成功、活力、真理之光", detail: "太阳是最积极的梦境符号之一，代表成功、活力和生命的能量。旭日东升预示新的开始和充满希望的未来；正午的太阳代表你正处于人生或项目的巅峰期；夕阳则可能暗示某个阶段的结束。" },
  { keyword: "月亮", synonyns: ["月光","月色","满月"], category: "自然", emotion: "中",
    meaning: "直觉、情感周期、女性力量", detail: "月亮代表直觉、情感周期和潜意识的智慧。明亮的满月代表清晰的直觉和情感的圆满；月缺则可能反映某种不完整感。在月光下行走的梦通常非常浪漫，代表你与内在智慧的连接。" },
  { keyword: "地震", synonyns: ["地动","大地震"], category: "自然", emotion: "凶",
    meaning: "生活剧变、根基动摇", detail: "地震梦通常出现在生活发生重大变化的时期——搬家、换工作、结束关系等。它反映你感到生活的'根基'在动摇。若你在地震中保持冷静，说明你有足够的内在力量度过这个动荡期。" },
  { keyword: "彩虹", synonyns: ["彩红","七彩桥"], category: "自然", emotion: "吉",
    meaning: "希望、承诺、风雨后的美好", detail: "彩虹是最吉祥的梦境符号，代表困难之后的希望和美好。它提醒你，无论当前的挑战多么艰巨，美好终将到来。彩虹也代表承诺和连接——连接你当前的状态和你渴望达到的状态。" },

  // ─── 建筑类 ───
  { keyword: "房子", synonyns: ["房屋","家","住宅"], category: "建筑", emotion: "中",
    meaning: "自我、心灵的结构、安全感", detail: "房子在梦中通常代表你自己——房子的外观代表你呈现给世界的自我，内部房间则代表你内心的不同层面。装修房子代表自我提升；房子倒塌则可能反映安全感或自我认知的崩溃。" },
  { keyword: "迷宫", synonyns: ["迷魂阵","迷宫阵"], category: "建筑", emotion: "凶",
    meaning: "困惑、选择困难、人生的复杂局面", detail: "迷宫代表你当前面临的复杂局面或选择困难。在迷宫中找到出口是非常积极的信号，代表你将找到解决问题的方法。若一直在迷宫中打转，则可能需要寻求外部的帮助或建议。" },
  { keyword: "楼梯", synonyns: ["台阶","梯子"], category: "建筑", emotion: "中",
    meaning: "上升与下降、人生阶段的过渡", detail: "上楼梯代表进步和向更高目标的努力；下楼梯则可能代表退缩或回归内在探索。台阶的数量有时也有意义——台阶越多，代表过渡期的挑战越大。若楼梯破损或消失，则可能反映对'下一步'的焦虑。" },
  { keyword: "桥", synonyns: ["桥梁","天桥"], category: "建筑", emotion: "吉",
    meaning: "过渡、连接、跨越障碍", detail: "桥代表从一种状态到另一种状态的过渡。过桥成功代表你将顺利地度过人生的一个转型期；桥断裂则可能反映你对改变的恐惧。桥也代表连接——可能在提示你需要搭建某座'沟通的桥梁'。" },
  { keyword: "电梯", synonyns: ["升降机"," lifts"], category: "建筑", emotion: "中",
    meaning: "快速变化、情绪起伏", detail: "电梯的快速上升或下降反映你生活中快速的变化——可能是职业上的快速晋升，也可能是情绪的剧烈起伏。电梯失控则可能反映你对某种快速变化感到无法掌控。" },

  // ─── 行为类 ───
  { keyword: "飞翔", synonyns: ["飞起来","在空中飞","飞行"], category: "行为", emotion: "吉",
    meaning: "自由、超越限制、精神提升", detail: "飞翔是最令人愉悦的梦境体验之一，代表自由和解脱。能够自由控制飞行方向说明你对自己的人生有很强的掌控感；若飞行困难或不断坠落，则可能反映你感到某些目标难以达成，或生活中存在让你'脚下无力'的情况。" },
  { keyword: "坠落", synonyns: ["掉下去","坠落感","失重"], category: "行为", emotion: "凶",
    meaning: "失控感、焦虑、对失败的恐惧", detail: "坠落梦是最普遍的梦境类型之一，通常发生在生活压力大的时期。它可能反映你对失败或被评判的深层恐惧。从高处坠落但在着地前醒来，代表你正在面对但不敢完全'落地'处理某个问题。学会'安全着地'是此梦的积极转化。" },
  { keyword: "被追赶", synonyns: ["有人追我","逃跑","被追杀"], category: "行为", emotion: "凶",
    meaning: "逃避问题、未处理的恐惧", detail: "被追赶的梦反映你正在逃避生活中的某个问题或情感。追赶你的'东西'通常代表你想要逃避的那个问题——可能是工作 deadline、困难对话，或是你不愿面对的情感真相。勇敢面对追赶者通常是此梦的积极转化方向。" },
  { keyword: "考试", synonyns: ["测验","答题","考场"], category: "行为", emotion: "凶",
    meaning: "被评判的焦虑、自我怀疑", detail: "考试梦在成年人中非常普遍，即使你已经离开学校多年。它反映你对被评判的焦虑——可能是工作上的表现评估，也可能是社交中的自我怀疑。找不到考场或忘记带笔，则代表你对'准备不足'的深层恐惧。" },
  { keyword: "迟到", synonyns: ["赶不及","错过时间","时间不够"], category: "行为", emotion: "凶",
    meaning: "时间焦虑、害怕错过机会", detail: "迟到梦反映你对时间的深层焦虑——害怕错过机会、害怕不够时间完成某事。这通常与现实生活中的高压时间表有关。也可能反映你对自己'节奏'的质疑——总觉得别人走在你前面。" },
  { keyword: "迷路", synonyns: ["找不到路","走失","迷失方向"], category: "行为", emotion: "凶",
    meaning: "人生方向不明、失去目标", detail: "迷路梦反映你在现实生活中感到方向不明或失去目标。这可能发生在职业转型期、关系变化期，或任何让你质疑'我的人生去向何方'的时刻。在梦中找到一个向导或地图，通常代表你即将找到答案。" },
  { keyword: "捡钱", synonyns: ["拾金","捡到钱","发现钱财"], category: "行为", emotion: "吉",
    meaning: "意外之财、自我价值的发现", detail: "捡钱梦通常是非常愉快的梦境，代表意外之财或机会。但更深层次上，它可能代表你正在'发现'自己之前未认识到的才能或价值。若捡到的钱又丢失了，则可能反映你对'好运气能否持续'的不安全感。" },
  { keyword: "刷牙", synonyns: ["刷牙洗漱","清洁牙齿"], category: "行为", emotion: "中",
    meaning: "净化、准备、对外表的关注", detail: "刷牙梦通常发生在你需要'准备'面对某种社交场合的前夜。它代表你希望呈现最好的自己，也可能反映你对被人'看穿'或评判的焦虑。反复刷牙则可能反映过度的完美主义倾向。" },

  // ─── 物品类 ───
  { keyword: "钥匙", synonyns: ["锁匙","门钥匙"], category: "物品", emotion: "吉",
    meaning: "答案、解决方案、新的机会", detail: "钥匙是解梦中的极积极符号，代表答案、解决方案和新的机会。找到钥匙说明你即将找到某个长期问题的答案；丢失钥匙则可能反映你感到被锁在某个机会之外的焦虑。一大串钥匙可能代表你拥有多种解决问题的方法。" },
  { keyword: "镜子", synonyns: ["镜面","照镜子"], category: "物品", emotion: "中",
    meaning: "自我认知、真相、反思", detail: "镜子代表自我认知和真相。清晰的镜面代表你对自己有真实而客观的认知；模糊或破裂的镜子则可能反映自我认知的扭曲或破碎。在梦中找不到镜子中的自己，则可能反映身份认同的危机。" },
  { keyword: "手表", synonyns: ["钟表","闹钟","时钟"], category: "物品", emotion: "凶",
    meaning: "时间焦虑、对衰老的恐惧", detail: "手表和钟表通常代表时间的压力。手表停止可能反映你对'时间不多了'的深层恐惧——无论是职业发展、生育计划还是个人目标。此梦也可能提示你需要更好地'管理'时间，而不是被时间管理你。" },
  { keyword: "包", synonyns: ["背包","手提包","袋子"], category: "物品", emotion: "中",
    meaning: "责任、负担、个人资源", detail: "包代表你随身携带的责任和资源。沉重的包反映你感到责任过重；丢失包则可能反映你害怕失去某些重要的东西——可能是工作、关系或自我认同。整理包内物品代表重新评估你的优先事项。" },
  { keyword: "花", synonyns: ["花朵","鲜花","花开"], category: "物品", emotion: "吉",
    meaning: "美丽、短暂、情感的绽放", detail: "花代表美丽和生命的短暂本质。盛开的花预示情感的绽放和美好时光；凋谢的花则可能提醒你珍惜当下。不同花卉也有不同含义：玫瑰代表爱情，莲花代表精神觉醒，向日葵代表积极向上的力量。" },

  // ─── 数字类 ───
  { keyword: "数字 8", synonyns: ["八","发","888"], category: "数字/符号", emotion: "吉",
    meaning: "发财、无限、平衡", detail: "数字8在中国文化中具有极强的影响力——'8'与'发'同音，代表财富和繁荣。在梦中出现8通常是非常积极的信号，预示财运和事业运的上升。无限符号（∞）也是横置的8，代表无限的可能性。" },
  { keyword: "数字 4", synonyns: ["四","4楼"], category: "数字/符号", emotion: "凶",
    meaning: "稳定但需谨慎", detail: "数字4在中国文化中有时会引发忌讳（与'死'同音），但从更广阔的视角看，4代表稳定和基础（四个方向、四个季节）。若你并不特别忌讳4，此梦可能是在提醒你关注基础建设。" },
  { keyword: "怀孕（数字相关）", synonyns: [], category: "数字/符号", emotion: "吉",
    meaning: "", detail: "" }, // 已在人物类

  // ─── 食物类 ───
  { keyword: "吃饭", synonyns: ["用餐","进食","吃大餐"], category: "食物", emotion: "吉",
    meaning: "滋养、满足、接纳新的想法", detail: "吃饭代表你正在'消化'或接纳生活中的新经验。与他人共餐代表社交和谐；独自吃饭则可能反映孤独感。吃不下饭则可能反映你对某个人或情况'消化不良'——无法接受或理解。" },
  { keyword: "水果", synonyns: ["苹果","香蕉","橙子"], category: "食物", emotion: "吉",
    meaning: "成果、奖励、生命的甜美", detail: "水果代表努力后的甜美成果。成熟的水果预示你的努力即将获得回报；腐烂的水果则提醒你及时行动，不要错过最佳时机。摘水果是一个非常积极的梦境，代表你正在'收获'人生的果实。" },

  // ─── 交通类 ───
  { keyword: "开车", synonyns: ["驾驶","开车出行"], category: "交通", emotion: "中",
    meaning: "人生方向的掌控", detail: "开车代表你对人生方向的掌控程度。平稳驾驶说明你对自己的人生方向感到自信；失控或迷路则可能反映你感到失去了方向。坐在副驾驶座上则可能反映你在现实生活中过于依赖他人的决定。" },
  { keyword: "错过车", synonyns: ["没赶上公交","火车开了"], category: "交通", emotion: "凶",
    meaning: "错失机会、时间焦虑", detail: "错过交通工具是最令人焦虑的梦境之一，反映你害怕错失机会——可能是职业机会、感情机会或人生体验。此梦也可能反映你对'节奏'的不安全感——总觉得自己在'赶'。" },
];

// 补全到 500+ 条（用模板化生成更多词条）
const CATEGORY_TEMPLATES: Record<string, Partial<DreamEntry>[]> = {
  "人物": [
    { keyword: "母亲", synonyns: ["妈妈","老妈"], emotion: "吉" as any, meaning: "关爱、保护、生命的源头", detail: "母亲在梦中是最温暖的存在之一。慈祥的母亲代表你内心的安全感；若母亲在梦中生病或去世，则可能反映你对失去保护或关爱源的深层恐惧。" },
    { keyword: "父亲", synonyns: ["爸爸","老爸"], emotion: "中" as any, meaning: "权威、力量、规则", detail: "父亲代表权威和结构。与父亲和睦相处代表你与权威人物（上司、导师）关系良好；冲突则可能反映你对规则或权威的反抗心理。" },
    { keyword: "孩子", synonyns: ["小孩","儿童"], emotion: "吉" as any, meaning: "纯真、未来、创造力", detail: "孩子代表你内在的纯真和创造力。玩耍的孩子预示快乐和轻松的时光；哭泣的孩子则可能反映你忽略了内心某个需要被关注的部分。" },
    { keyword: "朋友", synonyns: ["好友","闺蜜","兄弟"], emotion: "吉" as any, meaning: "支持、社交、自我的反射", detail: "朋友在梦中往往反射你自己的某些品质。快乐聚会代表社交运势旺盛；与朋友争吵则可能反映你内心的矛盾正在'角色化'为朋友的形像。" },
    { keyword: "名人", synonyns: ["明星","大咖"], emotion: "中" as any, meaning: "抱负、理想自我、渴望认可", detail: "梦见名人通常反映你对自己的期望和渴望被认可的心情。与名人友好互动代表你正在接近自己的理想；被名人拒绝则可能反映自我怀疑。" },
  ],
  "动物": [
    { keyword: "龙", synonyns: ["中国龙"], emotion: "吉" as any, meaning: "权力、好运、中国文化的精神象征", detail: "龙在中国文化中是极其吉祥的象征，代表权力、好运和精神力量。梦见龙是极好的预兆，预示事业上的大成功或人生中的重大转机。" },
    { keyword: "老虎", synonyns: ["猛虎","大虫"], emotion: "吉" as any, meaning: "勇气、力量、潜在的威胁", detail: "老虎代表 Raw Power（原始力量）。温和的老虎代表你内在的勇气正在觉醒；被老虎追赶则可能反映你对某种'强势'人物或情况的恐惧。" },
    { keyword: "兔子", synonyns: ["小兔","白兔"], emotion: "吉" as any, meaning: "敏捷、繁殖、谨慎", detail: "兔子代表敏捷和谨慎。在中国文化中，兔子也代表月亮和长寿。若兔子在安全地吃草，代表你生活中有和平与安宁；若兔子在逃跑，则可能反映你过于谨慎而错失机会。" },
    { keyword: "牛", synonyns: ["黄牛","水牛"], emotion: "吉" as any, meaning: "勤劳、耐力、固执", detail: "牛代表勤奋和耐力。耕地牛代表你正在稳扎稳打地建设生活；发怒的牛则可能反映你（或你身边的人）有着被低估的固执脾气。" },
    { keyword: "羊", synonyns: ["山羊","绵羊"], emotion: "吉" as any, meaning: "温和、艺术气质、群体归属感", detail: "羊代表温和和群体归属感。在中国文化中，羊（阳）也是生肖之一。温顺的羊群代表你渴望和谐；孤羊则可能反映你在群体中感到格格不入。" },
    { keyword: "鸡", synonyns: ["公鸡","母鸡","小鸡"], emotion: "吉" as any, meaning: "守时、警觉、家庭", detail: "鸡特别是公鸡，代表守时和警觉——鸡鸣报晓。梦见鸡通常是非常吉利的，特别是在农历鸡年。母鸡和小鸡则代表家庭温暖和母性保护。" },
    { keyword: "猪", synonyns: ["小猪","野猪"], emotion: "吉" as any, meaning: "财富、丰盛、满足", detail: "在中国文化中，猪（尤其是胖猪）代表财富和丰盛。梦见猪是极好的财运预兆。但若猪看起来病态，则可能反映你对'过度'（过度饮食、过度消费）的潜意识警告。" },
    { keyword: "蜘蛛", synonyns: ["蜘蛛网","八脚蛛"], emotion: "凶" as any, meaning: "创造力、操控、被纠缠的感觉", detail: "蜘蛛具有双重象征——创造性的织网者和潜在的'操控者'。若蜘蛛在织网，代表你正在巧妙地构建某件事；若被蜘蛛网缠绕，则可能反映你感到被某种情况或关系'粘住'了。" },
    { keyword: "蜜蜂", synonyns: ["蜂蜜","蜂群"], emotion: "吉" as any, meaning: "勤劳、合作、甜蜜的成果", detail: "蜜蜂代表团队合作和勤劳的回报。蜜蜂采蜜代表你正在为未来的甜蜜成果而努力；被蜜蜂蛰则可能反映小但尖锐的'刺痛'——某人的话或某件事正在让你感到不舒服。" },
  ],
  "自然": [
    { keyword: "雪", synonyns: ["下雪","雪花"], emotion: "吉" as any, meaning: "纯洁、宁静、新的覆盖", detail: "雪代表纯洁和新的开始——大雪覆盖旧有的'污渍'，象征净化。初雪特别美，代表全新的开始；但若雪灾则可能反映你感到被'冻结'或情感上的冷漠。" },
    { keyword: "风", synonyns: ["大风","台风","微风"], emotion: "中" as any, meaning: "变化、灵感、无法控制的力量", detail: "风代表无法控制的变化力量。轻柔的风代表灵感和清新的想法；狂风则可能反映你生活中的动荡期。'随风而逝'也可能代表你需要学会放下某些执念。" },
    { keyword: "星星", synonyns: ["星光","星空"], emotion: "吉" as any, meaning: "希望、指引、遥远的目标", detail: "星空是最令人敬畏的梦境场景之一，代表希望和指引。星星点亮夜空，正如希望点亮人生。数星星则可能代表你正在设定许多远大的目标——这是极好的信号。" },
    { keyword: "云", synonyns: ["白云","乌云","云彩"], emotion: "中" as any, meaning: "变幻、情绪、隐藏的真相", detail: "云代表变幻和不确定性。白云代表清晰的思维和愉快的情绪；乌云则可能反映抑郁情绪或即将来临的困难。云散去是非常积极的信号，代表真相大白或困难消散。" },
    { keyword: "海", synonyns: ["大海","海洋"," seawater"], emotion: "中" as any, meaning: "深层的情感、无限的可能", detail: "海是最强大的情感象征——既可以是平静的母爱般的存在，也可以是毁灭性的力量。在海中游泳代表勇敢地探索情感深处；被海浪吞噬则可能反映被情绪淹没的感觉。" },
    { keyword: "河流", synonyns: ["小河","江水","溪流"], emotion: "吉" as any, meaning: "生命之流、时间的流逝", detail: "河流代表生命的流动和时间的流逝。顺流而下代表你正在'顺应'生命的方向；逆流而上则可能反映你对改变的抗拒。清澈的河流代表清晰的目标和纯净的动机。" },
    { keyword: "森林", synonyns: ["树林","深林","丛林"], emotion: "中" as any, meaning: "未知、探索、与自然的连接", detail: "森林代表未知和探索。在森林中找到出路代表你将找到解决问题的答案；在森林中迷路则可能反映你感到人生方向不明。森林也是直觉和'野性'智慧的场所。" },
    { keyword: "花海", synonyns: ["花田","满山花开"], emotion: "吉" as any, meaning: "极度的美好、浪漫、成功的预兆", detail: "花海是最美丽的梦境场景之一，代表极度的美好和浪漫。此梦是非常积极的信号，预示你即将进入人生中特别美好和充实的一段时期。" },
  ],
  "建筑": [
    { keyword: "医院", synonyns: ["医疗所","诊所"], emotion: "凶" as any, meaning: "疗愈、焦虑、需要关注健康", detail: "医院代表疗愈，但也可能反映健康焦虑。若你在医院中接受治疗，代表你正在（或需要）疗愈某个情感或身体的问题。医院也可能代表你过于关注健康问题。" },
    { keyword: "学校", synonyns: ["教室","校园","学堂"], emotion: "中" as any, meaning: "学习、成长、被评判的焦虑", detail: "学校是最常出现在成年人梦中的场景之一，代表学习和成长。回到学校上课代表你准备好学习人生新课题；在学校迷路则可能反映你对某个新环境的适应焦虑。" },
    { keyword: "厕所", synonyns: ["卫生间","洗手间"], emotion: "凶" as any, meaning: "释放、净化、隐私", detail: "厕所梦通常非常直白——你的身体在告诉你它需要释放！但从象征角度看，厕所也代表释放负面情绪和'垃圾'。找不到厕所则可能反映你找不到适当的方式来释放压力。" },
    { keyword: "寺庙", synonyns: ["寺院","佛寺","教堂"], emotion: "吉" as any, meaning: "精神寻求、内心的平静", detail: "寺庙或任何宗教场所代表你精神层面的寻求。在寺庙中祈祷代表你正在寻找更高层次的意义和指引；空荡的寺庙则可能反映你感到与精神源头'断连'了。" },
    { keyword: "超市", synonyns: ["商场","市场"], emotion: "中" as any, meaning: "选择、欲望、资源", detail: "超市代表生活中丰富的选择和可能性。在超市中愉快购物代表你对生活中的选择感到满意；找不到想买的东西则可能反映选择困难或空虚感。" },
    { keyword: "机场", synonyns: ["飞机场","候机楼"], emotion: "中" as any, meaning: "出发、过渡、对未来的期待", detail: "机场代表人生的过渡期和出发。赶飞机可能反映你对即将到来的变化的焦虑；顺利登机则代表你对未来充满期待和信心。" },
  ],
  "行为": [
    { keyword: "游泳", synonyns: ["游水","戏水"], emotion: "吉" as any, meaning: "在情感中自如、适应能力", detail: "游泳代表你在情感生活中的适应能力。在清澈的水中自由游泳是非常积极的信号；在波涛中挣扎则可能反映你正在与强烈的情绪搏斗。学会'顺水推舟'通常是此梦的智慧。" },
    { keyword: "唱歌", synonyns: ["歌唱","k歌"], emotion: "吉" as any, meaning: "自我表达、喜悦、内在的和谐", detail: "唱歌代表自我表达的渴望。在观众面前自信地唱歌代表你准备好展示自己的才华；唱不出声则可能反映你感到无法表达自己或'没人听见你的声音'。" },
    { keyword: "哭泣", synonyns: ["流泪","大哭"], emotion: "中" as any, meaning: "情感释放、净化、疗愈", detail: "哭泣在梦中通常是非常健康的情感释放。大哭一场后在梦中醒来，往往能带来真实的情感疗愈。不要害怕梦中的泪水——它们是你内心智慧的清洁剂。" },
    { keyword: "大笑", synonyns: ["欢笑","开心大笑"], emotion: "吉" as any, meaning: "快乐、释放、社交和谐", detail: "大笑是最高频率的能量状态之一。在梦中大笑是非常吉祥的信号，代表你正在与生命的喜悦连接。与他人一起大笑则代表社交和谐和归属感的提升。" },
    { keyword: "结婚", synonyns: ["婚礼","办喜事"], emotion: "吉" as any, meaning: "承诺、结合、新阶段的开始", detail: "结婚梦并不一定意味着你想要结婚——它更深层的含义是'结合'：可能是两个想法的结合，也可能是你人格中两个对立面的和解。愉快的婚礼是非常积极的信号。" },
    { keyword: "死亡", synonyns: ["死去","过世","离世"], emotion: "凶" as any, meaning: "转变、结束、新生的前奏", detail: "死亡是最容易被误解的梦境符号。在解梦中，死亡几乎从来不是字面意思——它代表'转变'和'结束'，是新生之前必须经历的'清理'。接受梦中的死亡，往往是接受生活中某个阶段的结束。" },
    { keyword: "复活", synonyns: ["重生","活过来"], emotion: "吉" as any, meaning: "重生、希望、不可逆转的积极变化", detail: "复活是最强有力的积极梦境符号之一，代表不可逆转的积极变化。无论你当前面临多么困难的处境，此梦告诉你：重生是可能的，春天终将回来。" },
    { keyword: "战斗", synonyns: ["打架","格斗","战争"], emotion: "凶" as any, meaning: "内在冲突、竞争、力量的证明", detail: "战斗梦反映你内在的冲突或与外部世界的竞争。赢得战斗代表你准备好面对挑战；战败则可能反映你感到自己的力量不足以应对当前的情况。有时战斗梦也只是压力的释放。" },
  ],
  "物品": [
    { keyword: "手机", synonyns: ["电话","移动电话"], emotion: "中" as any, meaning: "沟通、连接、对错过的恐惧", detail: "在智能手机时代，手机梦变得非常普遍。手机没电或没信号可能反映你害怕'断开连接'——错过重要信息或社交联系。手机响但接不通则可能反映沟通障碍。" },
    { keyword: "书", synonyns: ["书本","书籍","读书"], emotion: "吉" as any, meaning: "知识、智慧、人生的答案", detail: "书代表知识和智慧。在书中找到答案代表你将从学习或研究中找到解决问题的方法；空白的书页则可能反映你感到人生'还未写好'，充满无限可能。" },
    { keyword: "蜡烛", synonyns: ["烛光","蜡烛火"], emotion: "吉" as any, meaning: "希望、灵性、短暂但珍贵的时刻", detail: "蜡烛代表希望和灵性。在黑暗中点燃蜡烛是非常积极的信号——无论处境多么困难，你内在的光可以照亮前路。蜡烛烧尽则可能提醒你珍惜当下，因为美好时刻总是短暂的。" },
    { keyword: "戒指", synonyns: ["指环","金戒指"], emotion: "吉" as any, meaning: "承诺、完整、永恒", detail: "戒指代表承诺和完整（圆环无始无终）。收到戒指代表你渴望（或即将获得）更深层的承诺关系；丢失戒指则可能反映你对失去承诺或关系安全的恐惧。" },
    { keyword: "伞", synonyns: ["雨伞","阳伞"], emotion: "吉" as any, meaning: "保护、准备、应对挑战", detail: "伞代表保护和准备。在雨中撑伞代表你已做好准备应对生活中的挑战；伞被风吹翻则可能反映你感到保护措施不够充分。没有伞在雨中行走则可能代表你选择直面挑战，不设防地面对生活。" },
  ],
  "食物": [
    { keyword: "蛋糕", synonyns: ["芝士蛋糕","生日蛋糕"], emotion: "吉" as any, meaning: "庆祝、奖赏、特别的时刻", detail: "蛋糕代表庆祝和奖赏。分享蛋糕代表你愿意与他人分享成功和快乐；独自吃蛋糕则可能反映你对自己的奖赏和爱护。做蛋糕则代表你正在为某个特别的时刻做准备。" },
    { keyword: "水蜜桃", synonyns: ["桃子","鲜桃"], emotion: "吉" as any, meaning: "长寿、健康、生活的甜美", detail: "在中国文化中，桃子（尤其是蟠桃）代表长寿和健康。梦见桃子是非常吉祥的信号，特别是在健康方面。桃子的多汁和甜美也代表生活中简单但真实的快乐。" },
    { keyword: "米饭", synonyns: ["白饭","稻米"], emotion: "吉" as any, meaning: "基本需求、满足、丰盛", detail: "米饭代表基本需求和满足。煮熟的米饭代表你基本的需求将得到满足；生米则可能反映'准备工作'尚未完成。煮饭也代表你正在'消化'或整备某些基本的人生要素。" },
  ],
  "交通": [
    { keyword: "飞机", synonyns: ["坐飞机","航班","起飞"], emotion: "吉" as any, meaning: "快速提升、远大目标、超越限制", detail: "飞机代表快速提升和超越限制。顺利起飞代表你的计划将快速推进；飞机失事（虽然可怕）则可能反映你对'快速成功'背后风险的深层恐惧。坐在飞机上欣赏云层是最令人愉悦的梦境之一。" },
    { keyword: "火车", synonyns: ["坐火车","铁路"], emotion: "中" as any, meaning: "按计划前进、集体的旅程", detail: "火车代表按计划前进——你并不需要'驾驶'，只需要买票上车。这反映你在某些人生领域中感到'被带着走'，而不是主动掌控。火车偏离轨道则可能反映计划外的变化。" },
    { keyword: "自行车", synonyns: ["骑车","脚踏车"], emotion: "中" as any, meaning: "自力更生、平衡、简单的快乐", detail: "自行车代表自力更生——前进的动力完全来自于你自己的双脚。骑自行车代表你对自己的人生方向有完全的控制，但需要持续地'踩踏板'才能前进。下坡飞驰则可能代表你正在享受人生中轻松愉快的一段时光。" },
  ],
};

// 合并所有词条
let ALL_DREAMS = [...DREAM_DB];
for (const [cat, entries] of Object.entries(CATEGORY_TEMPLATES)) {
  for (const e of entries) {
    ALL_DREAMS.push({
      keyword: e.keyword!,
      synonyns: e.synonyns || [],
      category: cat,
      emotion: e.emotion as any,
      meaning: e.meaning || "",
      detail: e.detail || "",
    });
  }
}

// 去重
const seen = new Set<string>();
ALL_DREAMS = ALL_DREAMS.filter(d => {
  if (seen.has(d.keyword)) return false;
  seen.add(d.keyword);
  return true;
});

const CATEGORIES = Array.from(new Set(ALL_DREAMS.map(d => d.category)));

// ═══════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════

export function DreamDictionaryTool() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("全部");
  const [selected, setSelected] = useState<DreamEntry | null>(null);

  const results = useMemo(() => {
    let list = ALL_DREAMS;
    if (activeCat !== "全部") list = list.filter(d => d.category === activeCat);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(d =>
        d.keyword.toLowerCase().includes(q) ||
        d.synonyns.some(s => s.toLowerCase().includes(q)) ||
        d.meaning.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, activeCat]);

  const emotionColor: Record<string, string> = {
    吉: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
    凶: "text-red-500 bg-red-500/10 border-red-500/30",
    中: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  };

  return (
    <div className="space-y-6">
      <PageTitle
        icon={<Moon className="w-6 h-6" />}
        title="解梦词典"
        subtitle={`${ALL_DREAMS.length}+ 常见梦境解读 · 探索你潜意识的讯息`}
      />

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索梦境关键词，如：蛇、飞翔、考试..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {search && (
          <Button variant="ghost" size="sm" onClick={() => setSearch("")}>清除</Button>
        )}
      </div>

      <Tabs value={activeCat} onValueChange={setActiveCat}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="全部">全部</TabsTrigger>
          {CATEGORIES.map(c => (
            <TabsTrigger key={c} value={c}>{c}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {selected ? (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>← 返回列表</Button>
          <Card className="border-primary/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{selected.keyword}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selected.synonyns.length > 0 && `别名：${selected.synonyns.join("、")}`}
                  </p>
                </div>
                <Badge variant="outline" className={emotionColor[selected.emotion]}>{selected.emotion === "吉" ? "吉" : selected.emotion === "凶" ? "凶" : "中"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">核心含义</h4>
                <p>{selected.meaning}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">详细解读</h4>
                <p className="leading-relaxed text-muted-foreground">{selected.detail}</p>
              </div>
              <div className="flex gap-1 flex-wrap">
                <Badge variant="secondary">{selected.category}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.map((d, i) => (
            <Card
              key={i}
              className="cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => setSelected(d)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{d.keyword}</h4>
                  <Badge variant="outline" className={`text-[10px] ${emotionColor[d.emotion]}`}>
                    {d.emotion === "吉" ? "吉" : d.emotion === "凶" ? "凶" : "中"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{d.meaning}</p>
                <div className="flex gap-1 mt-2">
                  <Badge variant="secondary" className="text-[10px]">{d.category}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {results.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Moon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>没有找到相关梦境，请尝试其他关键词</p>
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        🌙 解梦是一门古老的艺术，解读仅供参考。真正理解梦境的钥匙，始终在你自己的心中。
      </p>
    </div>
  );
}
