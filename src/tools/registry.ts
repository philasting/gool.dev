import type { ToolMeta, Category } from "@/types/tool";

/**
 * Complete registry of all tool metadata.
 * P0 tools (priority < 200): fully implemented.
 * P1 tools (priority 200-399): fully implemented.
 * P2 tools (priority 400-649): fully implemented.
 * P3 tools (priority >= 800): placeholder only.
 */
export const TOOLS: ToolMeta[] = [
  // ─── P0: Dev Tools ───
  {
    slug: "json-formatter",
    name: "JSON 格式化",
    description: "格式化、压缩、校验 JSON，支持树形视图",
    category: "dev",
    icon: "Braces",
    tags: ["json", "format", "minify", "validate", "tree", "格式化", "校验"],
    priority: 10,
  },
  {
    slug: "base64",
    name: "Base64 编解码",
    description: "Base64 文本编码与解码转换",
    category: "dev",
    icon: "Binary",
    tags: ["base64", "encode", "decode", "编码", "解码"],
    priority: 20,
  },
  {
    slug: "url-encode",
    name: "URL 编解码",
    description: "URL 组件编码与解码转换",
    category: "dev",
    icon: "Link",
    tags: ["url", "encode", "decode", "uri", "编码", "解码", "百分号编码"],
    priority: 30,
  },
  {
    slug: "timestamp",
    name: "时间戳转换",
    description: "Unix 时间戳与可读时间互转，支持毫秒/秒",
    category: "dev",
    icon: "Clock",
    tags: ["timestamp", "unix", "date", "time", "时间戳", "日期", "转换"],
    priority: 40,
  },
  {
    slug: "regex-tester",
    name: "正则表达式测试",
    description: "实时正则匹配、高亮、常用正则库",
    category: "dev",
    icon: "Regex",
    tags: ["regex", "regexp", "regular", "match", "test", "正则", "匹配"],
    priority: 50,
  },
  {
    slug: "json-to-ts",
    name: "JSON → TypeScript",
    description: "输入 JSON，自动生成 TypeScript interface 类型定义",
    category: "dev",
    icon: "Braces",
    tags: ["json", "typescript", "interface", "type", "类型", "生成", "ts"],
    priority: 115,
  },
  {
    slug: "css-unit-converter",
    name: "CSS 单位换算",
    description: "px/rem/em/vw/vh/pt/% 互转，支持自定义基准值",
    category: "dev",
    icon: "Ruler",
    tags: ["css", "unit", "px", "rem", "em", "vw", "换算", "单位"],
    priority: 125,
  },
  {
    slug: "color-contrast",
    name: "颜色对比度",
    description: "WCAG 对比度检测，AA/AAA 级别判定",
    category: "dev",
    icon: "Contrast",
    tags: ["color", "contrast", "wcag", "accessibility", "对比度", "颜色", "无障碍"],
    priority: 135,
  },
  {
    slug: "yaml-json-converter",
    name: "YAML ↔ JSON",
    description: "YAML 与 JSON 格式互相转换",
    category: "dev",
    icon: "ArrowRightLeft",
    tags: ["yaml", "json", "convert", "转换", "格式"],
    priority: 145,
  },

  // ─── P0: Text Tools ───
  {
    slug: "word-count",
    name: "字数统计",
    description: "字符数、词数、行数、段落数统计",
    category: "text",
    icon: "Calculator",
    tags: ["word", "count", "character", "line", "统计", "字数", "字符"],
    priority: 60,
  },
  {
    slug: "text-dedup",
    name: "文本去重",
    description: "按行去重，支持排序选项",
    category: "text",
    icon: "ListFilter",
    tags: ["dedup", "duplicate", "unique", "sort", "去重", "排序", "唯一"],
    priority: 70,
  },
  {
    slug: "case-converter",
    name: "大小写转换",
    description: "UPPER/lower/Title/camelCase/PascalCase/snake_case/kebab-case",
    category: "text",
    icon: "CaseSensitive",
    tags: ["case", "upper", "lower", "camel", "snake", "kebab", "pascal", "大小写", "转换"],
    priority: 80,
  },
  {
    slug: "lorem-ipsum",
    name: "Lorem Ipsum",
    description: "随机占位文本生成，支持英文/中文，自定义段落数",
    category: "text",
    icon: "FileText",
    tags: ["lorem", "ipsum", "placeholder", "text", "占位", "假文", "生成"],
    priority: 85,
  },

  // ─── P0: Image Tools ───
  {
    slug: "image-compress",
    name: "图片压缩",
    description: "支持质量调节、尺寸调整、批量压缩、下载",
    category: "image",
    icon: "FileImage",
    tags: ["image", "compress", "resize", "quality", "图片", "压缩", "调整"],
    priority: 90,
  },
  {
    slug: "image-crop",
    name: "图片裁剪",
    description: "拖拽选区裁剪图片，支持自由/1:1/4:3/16:9 等比例",
    category: "image",
    icon: "Crop",
    tags: ["image", "crop", "cut", "图片", "裁剪", "剪切"],
    priority: 95,
  },

  // ─── P0: Crypto Tools ───
  {
    slug: "hash-calculator",
    name: "哈希计算",
    description: "MD5/SHA1/SHA256/SHA512 哈希值计算",
    category: "crypto",
    icon: "Fingerprint",
    tags: ["hash", "md5", "sha", "sha256", "sha512", "哈希", "散列", "摘要"],
    priority: 100,
  },

  // ─── P0: Life Tools ───
  {
    slug: "password-generator",
    name: "密码生成器",
    description: "自定义长度/字符集/数量，强度指示",
    category: "life",
    icon: "KeyRound",
    tags: ["password", "generator", "random", "secure", "密码", "生成", "随机"],
    priority: 110,
  },
  {
    slug: "ip-query",
    name: "IP 查询",
    description: "显示本机 IP 地址及地理信息",
    category: "life",
    icon: "Globe",
    tags: ["ip", "address", "location", "geo", "IP地址", "查询", "地理位置"],
    priority: 120,
  },
  {
    slug: "calculator",
    name: "科学计算器",
    description: "支持四则运算、三角函数、对数、幂运算等",
    category: "life",
    icon: "Calculator",
    tags: ["calculator", "math", "计算器", "数学", "三角函数"],
    priority: 130,
  },

  // ─── P1: Dev Tools ───
  {
    slug: "md5-sha",
    name: "文件哈希计算",
    description: "拖拽文件计算 MD5/SHA1/SHA256/SHA512 哈希值",
    category: "dev",
    icon: "FileSearch",
    tags: ["hash", "md5", "sha", "file", "文件", "哈希", "校验"],
    priority: 200,
  },
  {
    slug: "radix-converter",
    name: "进制转换",
    description: "二进制/八进制/十进制/十六进制互转，支持自定义进制",
    category: "dev",
    icon: "Hash",
    tags: ["binary", "octal", "hex", "decimal", "radix", "进制", "转换"],
    priority: 210,
  },
  {
    slug: "color-converter",
    name: "颜色转换",
    description: "HEX/RGB/HSL 互转 + 可视化取色器 + 色板复制",
    category: "dev",
    icon: "Pipette",
    tags: ["color", "picker", "hex", "rgb", "hsl", "颜色", "转换", "取色"],
    priority: 220,
  },
  {
    slug: "jwt-decoder",
    name: "JWT 解码",
    description: "解析 JWT Token 的 Header/Payload/Signature，过期时间检测",
    category: "dev",
    icon: "Key",
    tags: ["jwt", "token", "decode", "json", "web", "解码", "令牌"],
    priority: 230,
  },
  {
    slug: "cron-helper",
    name: "Cron 表达式",
    description: "可视化编辑 Cron 表达式 + 下次执行时间 + 常用表达式库",
    category: "dev",
    icon: "Timer",
    tags: ["cron", "schedule", "expression", "定时", "表达式", "计划"],
    priority: 240,
  },

  // ─── P1: Text Tools ───
  {
    slug: "simplified-traditional",
    name: "简繁转换",
    description: "中文简体 ↔ 繁体互转，内置常用字对照表",
    category: "text",
    icon: "Languages",
    tags: ["simplified", "traditional", "chinese", "简体", "繁体", "转换"],
    priority: 250,
  },
  {
    slug: "pinyin",
    name: "汉字转拼音",
    description: "带声调/无声调/首字母模式，内置常用字拼音映射",
    category: "text",
    icon: "Volume2",
    tags: ["pinyin", "chinese", "tone", "拼音", "声调", "首字母"],
    priority: 260,
  },
  {
    slug: "text-replace",
    name: "文本批量替换",
    description: "查找替换，支持正则模式、大小写敏感、全部/逐个替换",
    category: "text",
    icon: "Replace",
    tags: ["find", "replace", "regex", "batch", "批量", "替换", "查找"],
    priority: 270,
  },

  // ─── P1: Image Tools ───
  {
    slug: "image-format",
    name: "图片格式转换",
    description: "PNG/JPG/WEBP 互转，Canvas API 实现",
    category: "image",
    icon: "ImageDown",
    tags: ["image", "format", "convert", "png", "jpg", "webp", "格式", "转换"],
    priority: 280,
  },
  {
    slug: "image-resize",
    name: "图片调整尺寸",
    description: "等比缩放 + 自定义宽高 + 预览",
    category: "image",
    icon: "Scaling",
    tags: ["image", "resize", "scale", "图片", "尺寸", "缩放"],
    priority: 290,
  },
  {
    slug: "image-base64",
    name: "图片 Base64 互转",
    description: "图片 ↔ Base64 编码互转，拖拽上传",
    category: "image",
    icon: "ArrowRightLeft",
    tags: ["image", "base64", "convert", "图片", "编码", "转换"],
    priority: 300,
  },

  // ─── P1: Doc Tools ───
  {
    slug: "pdf-merge",
    name: "PDF 合并",
    description: "多个 PDF 文件拖拽上传合并下载",
    category: "doc",
    icon: "FileStack",
    tags: ["pdf", "merge", "combine", "合并", "PDF"],
    priority: 310,
  },
  {
    slug: "pdf-split",
    name: "PDF 拆分",
    description: "按页码范围拆分 PDF 文件",
    category: "doc",
    icon: "Scissors",
    tags: ["pdf", "split", "extract", "拆分", "提取"],
    priority: 320,
  },
  {
    slug: "image-to-pdf",
    name: "图片转 PDF",
    description: "多张图片合成一个 PDF 文件",
    category: "doc",
    icon: "FileImage",
    tags: ["pdf", "image", "convert", "图片", "PDF", "合成"],
    priority: 330,
  },

  // ─── P1: Life Tools ───
  {
    slug: "uuid-generator",
    name: "UUID 生成器",
    description: "UUID v4 批量生成，自定义数量，一键复制",
    category: "life",
    icon: "Fingerprint",
    tags: ["uuid", "guid", "generate", "id", "标识符", "批量"],
    priority: 340,
  },
  // P1 new: Dev Tools
  {
    slug: "http-status-codes",
    name: "HTTP 状态码",
    description: "HTTP 状态码速查，支持搜索筛选，按分类展示",
    category: "dev",
    icon: "Server",
    tags: ["http", "status", "code", "响应码", "状态码", "查询"],
    priority: 350,
  },
  {
    slug: "number-formatter",
    name: "数字格式化",
    description: "千分位/科学计数法/百分比/货币格式转换",
    category: "dev",
    icon: "Hash",
    tags: ["number", "format", "currency", "scientific", "数字", "格式化", "货币"],
    priority: 355,
  },
  {
    slug: "mock-data-generator",
    name: "随机数据生成",
    description: "生成 Mock 数据，支持 JSON/CSV/SQL 输出",
    category: "dev",
    icon: "Database",
    tags: ["mock", "data", "generate", "fake", "模拟", "数据", "生成"],
    priority: 360,
  },
  {
    slug: "jwt-generator",
    name: "JWT 生成器",
    description: "生成 HS256/HS384/HS512 签名的 JWT Token",
    category: "dev",
    icon: "Key",
    tags: ["jwt", "token", "generate", "sign", "生成", "签名", "令牌"],
    priority: 365,
  },
  // P1 new: Text Tools
  {
    slug: "text-to-speech",
    name: "文本转语音",
    description: "Web Speech API 文本朗读，可调语速音调",
    category: "text",
    icon: "Volume2",
    tags: ["tts", "speech", "voice", "朗读", "语音", "文字转语音"],
    priority: 370,
  },
  // P1 new: Image Tools
  {
    slug: "image-round-corners",
    name: "图片圆角",
    description: "给图片添加圆角，支持自定义半径和背景色",
    category: "image",
    icon: "Square",
    tags: ["image", "round", "corner", "radius", "圆角", "图片", "边框"],
    priority: 375,
  },
  {
    slug: "svg-to-png",
    name: "SVG 转 PNG",
    description: "SVG 代码/文件转换为 PNG 图片下载",
    category: "image",
    icon: "ImageDown",
    tags: ["svg", "png", "convert", "转换", "矢量", "图片"],
    priority: 380,
  },
  // P1 new: Crypto Tools
  {
    slug: "otp-generator",
    name: "OTP 验证码",
    description: "TOTP 动态验证码生成，兼容 Google Authenticator",
    category: "crypto",
    icon: "Smartphone",
    tags: ["otp", "totp", "authenticator", "2fa", "验证码", "动态", "双因素"],
    priority: 385,
  },
  // P1 new: Life Tools
  {
    slug: "countdown-timer",
    name: "倒计时",
    description: "日期倒计时计时器，支持多个倒计时",
    category: "life",
    icon: "Hourglass",
    tags: ["countdown", "timer", "date", "倒计时", "计时", "日期"],
    priority: 390,
  },

  // ─── P2: Dev Tools ───
  {
    slug: "sql-formatter",
    name: "SQL 格式化",
    description: "SQL 语句格式化/压缩，关键词大写，按子句换行缩进",
    category: "dev",
    icon: "Database",
    tags: ["sql", "format", "minify", "query", "格式化", "压缩"],
    priority: 400,
  },
  {
    slug: "html-entity",
    name: "HTML 实体编码",
    description: "HTML 特殊字符实体编码/解码 + 命名/数字实体对照",
    category: "dev",
    icon: "Code",
    tags: ["html", "entity", "encode", "decode", "特殊字符", "实体"],
    priority: 410,
  },
  {
    slug: "text-diff",
    name: "文本差异对比",
    description: "左右分栏对比，差异行高亮，类似 diffchecker",
    category: "dev",
    icon: "GitCompare",
    tags: ["diff", "compare", "text", "差异", "对比"],
    priority: 420,
  },
  {
    slug: "qrcode",
    name: "二维码生成/解析",
    description: "文本/URL 生成二维码 + 上传图片解析二维码",
    category: "dev",
    icon: "QrCode",
    tags: ["qrcode", "qr", "generate", "decode", "二维码", "生成", "解析"],
    priority: 430,
  },

  // ─── P2: Text Tools ───
  {
    slug: "markdown-preview",
    name: "Markdown 预览",
    description: "左侧编辑 + 右侧实时渲染预览",
    category: "text",
    icon: "FileCode",
    tags: ["markdown", "preview", "render", "预览", "渲染"],
    priority: 440,
  },
  {
    slug: "text-encrypt",
    name: "文本加密/解密",
    description: "AES-256-GCM 加密解密，使用 Web Crypto API",
    category: "text",
    icon: "Lock",
    tags: ["aes", "encrypt", "decrypt", "加密", "解密", "密码"],
    priority: 450,
  },

  // ─── P2: Image Tools ───
  {
    slug: "ico-generator",
    name: "ICO 图标生成",
    description: "上传图片转多尺寸 favicon.ico (16/32/48/64)",
    category: "image",
    icon: "ImagePlus",
    tags: ["ico", "favicon", "icon", "图标", "生成"],
    priority: 460,
  },
  {
    slug: "color-picker",
    name: "图片取色器",
    description: "上传图片点击取色 + HEX/RGB/HSL 信息 + 颜色历史",
    category: "image",
    icon: "Pipette",
    tags: ["color", "picker", "eyedropper", "取色", "颜色", "图片"],
    priority: 470,
  },
  {
    slug: "watermark",
    name: "水印添加",
    description: "文字/图片水印，自定义透明度/位置/角度",
    category: "image",
    icon: "Stamp",
    tags: ["watermark", "image", "text", "水印", "添加"],
    priority: 480,
  },
  {
    slug: "grid-cutter",
    name: "九宫格切图",
    description: "将一张图片切成 3×3 共 9 片，适配朋友圈",
    category: "image",
    icon: "Grid3X3",
    tags: ["grid", "cut", "slice", "九宫格", "切图", "朋友圈"],
    priority: 490,
  },

  // ─── P2: Crypto Tools ───
  {
    slug: "rsa-keygen",
    name: "RSA 密钥生成",
    description: "Web Crypto API 生成 RSA 公私钥对，PEM 格式导出",
    category: "crypto",
    icon: "ShieldCheck",
    tags: ["rsa", "key", "generate", "密钥", "生成", "公钥", "私钥"],
    priority: 500,
  },
  {
    slug: "morse-code",
    name: "摩斯密码",
    description: "文本 ↔ 摩斯密码互转，支持音频播放",
    category: "crypto",
    icon: "Radio",
    tags: ["morse", "code", "audio", "摩斯", "电报", "音频"],
    priority: 510,
  },
  {
    slug: "unicode-convert",
    name: "Unicode 转换",
    description: "中文 ↔ \\uXXXX 编码互转，支持批量转换",
    category: "crypto",
    icon: "Type",
    tags: ["unicode", "convert", "编码", "转换", "转义"],
    priority: 520,
  },

  // ─── P2: Life Tools ───
  {
    slug: "unit-converter",
    name: "单位换算",
    description: "长度/重量/温度/面积/体积/速度等常用单位换算",
    category: "life",
    icon: "Ruler",
    tags: ["unit", "convert", "长度", "重量", "温度", "换算"],
    priority: 530,
  },
  {
    slug: "rmb-uppercase",
    name: "人民币大写",
    description: "金额数字转中文大写（壹贰叁...），支持小数点后两位",
    category: "life",
    icon: "Banknote",
    tags: ["rmb", "chinese", "uppercase", "金额", "大写", "人民币"],
    priority: 540,
  },
  // P2 new: Text Tools
  {
    slug: "chinese-number",
    name: "中文数字互转",
    description: "阿拉伯数字 ↔ 中文数字互转，支持大小写财务",
    category: "text",
    icon: "Languages",
    tags: ["chinese", "number", "convert", "中文", "数字", "大写", "财务"],
    priority: 550,
  },
  // P2 new: Life Tools
  {
    slug: "bmi-calculator",
    name: "BMI 计算器",
    description: "身体质量指数计算，含分类和可视化",
    category: "life",
    icon: "Activity",
    tags: ["bmi", "health", "weight", "身高", "体重", "体质指数"],
    priority: 555,
  },
  {
    slug: "exchange-rate",
    name: "汇率换算",
    description: "多币种汇率换算，支持 20+ 种货币",
    category: "life",
    icon: "Banknote",
    tags: ["exchange", "rate", "currency", "汇率", "货币", "换算"],
    priority: 560,
  },
];

/** Get tools by category */
export function getToolsByCategory(category: Category): ToolMeta[] {
  return TOOLS.filter((t) => t.category === category).sort(
    (a, b) => a.priority - b.priority
  );
}

/** Get a specific tool by slug */
export function getToolBySlug(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

/** Get P0 tools (fully implemented) */
export function getP0Tools(): ToolMeta[] {
  return TOOLS.filter((t) => t.priority < 200).sort(
    (a, b) => a.priority - b.priority
  );
}

/** Get implemented tools (P0 + P1 + P2) */
export function getImplementedTools(): ToolMeta[] {
  return TOOLS.filter((t) => t.priority < 800).sort(
    (a, b) => a.priority - b.priority
  );
}

/** Get related tools by category (excluding current tool) */
export function getRelatedTools(tool: ToolMeta, limit = 4): ToolMeta[] {
  return TOOLS.filter((t) => t.category === tool.category && t.slug !== tool.slug)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, limit);
}

/** P0 tool slugs for lazy component loading */
export const P0_TOOL_SLUGS = TOOLS.filter((t) => t.priority < 200).map(
  (t) => t.slug
);
