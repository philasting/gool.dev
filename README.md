# Gool — 免费在线工具箱

**152 个实用工具，纯前端运行，数据不离开浏览器。**

🌐 [gool.dev](https://gool.dev)

---

## 功能概览

### 开发工具 (Dev) — 50+
JSON 格式化 / Base64 编解码 / URL 编解码 / 时间戳转换 / 正则测试 / 文件哈希 / 进制转换 / 颜色转换 / JWT 解码&生成 / Cron 表达式 / SQL 格式化 / HTML 实体编码 / 文本 Diff / 二维码生成解析 / HTTP 状态码 / 数字格式化 / Mock 数据生成 / XML/HTML/CSS/JS 格式化 / WebSocket 测试 / 代码截图 / CSS 渐变/阴影/Grid/Flexbox 生成器 / 条形码生成 / 占位图生成 / CSS 单位换算 / 颜色对比度 / YAML↔JSON / JSON→TypeScript / 中国传统色 / 色环配色 / CSS 转 Tailwind / HTML 转 Markdown / cURL 转换器 / 正则反向生成 / 邮件签名生成器 …

### 文本工具 (Text) — 25+
字数统计 / 文本去重 / 大小写转换 / 简繁转换 / 汉字拼音 / 文本替换 / Markdown 预览 / 文本加解密 / 临时便签 / Lorem Ipsum / 中文数字互转 / HTTP 状态码 / 特殊字体生成器 / 仿生阅读 / ASCII 艺术字 / 中英文自动排版 / 在线提词器 / 日语假名转换 / 思维导图 / Emoji 搜索 …

### 图片工具 (Image) — 20+
图片压缩 / 格式转换 / 尺寸调整 / Base64 互转 / ICO 生成 / 取色器 / 水印 / 九宫格 / 图片裁剪 / 圆角 / SVG→PNG / GIF 制作 / 图片转字符画 / 图片配色提取 / 视频转 GIF / 表情包制作 / 证件照制作 …

### 文档工具 (Doc) — 7
PDF 合并 / PDF 拆分 / 图片转 PDF / PDF 转图片 / PDF 加密解密 / PDF 压缩 / PDF 加页码 …

### 编码加密 (Crypto) — 10+
哈希计算 / RSA 密钥生成 / 摩斯密码 / Unicode 转换 / OTP 验证码 / JWT 生成器 / 零宽字符隐写 / 图片隐写 …

### 生活效率 (Life) — 25+
密码生成 / IP 查询 / UUID 生成 / 单位换算 / 人民币大写 / 个税计算 / BMI / 倒计时 / 汇率换算 / 亲戚关系计算 / 手持弹幕 / 人生进度 / 决定转盘 / 批量重命名 / 屏幕录制 / 占星星盘 / 全球假期 / 屏幕尺 / P2P 文件传输 …

---

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Next.js 16 (App Router, Static Export) |
| UI | React 19 + shadcn/ui + Tailwind CSS 4 |
| 状态管理 | Zustand |
| 搜索 | FlexSearch (延迟加载) |
| 主题 | next-themes (暗/亮模式) |
| PDF | pdf-lib + pdfjs-dist |
| 二维码 | qrcode + jsQR |
| Markdown | marked |

---

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm start
```

---

## 部署

本项目使用 `output: 'export'`，构建后生成纯静态文件，可部署到任何静态托管：

```bash
pnpm build
# out/ 目录即为完整静态站点
```

推荐平台：**Vercel**（绑定自定义域名 gool.dev）、GitHub Pages、Cloudflare Pages、Nginx 自托管。

---

## 项目结构

```
gool/
├── public/
│   ├── manifest.json    # PWA 清单
│   ├── sw.js            # Service Worker
│   ├── sitemap.xml      # 站点地图
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── layout.tsx   # 根布局 + SEO
│   │   ├── page.tsx     # 首页
│   │   └── tools/[slug]/# 工具详情页
│   ├── components/
│   │   ├── layout/      # Header / Sidebar / Footer
│   │   ├── tool/        # ToolCard / ToolGrid / ToolLayout / ToolSearch
│   │   └── ui/          # shadcn/ui 基础组件
│   └── tools/
│       ├── registry.ts  # 工具注册表（152 条）
│       ├── dev/         # 开发工具
│       ├── text/        # 文本工具
│       ├── image/       # 图片工具
│       ├── doc/         # 文档工具
│       ├── crypto/      # 编码加密
│       └── life/        # 生活效率
└── package.json
```

---

## 特性

- **纯前端**：所有工具均在浏览器本地运行，数据不上传服务器
- **PWA 支持**：可安装为桌面/移动应用，支持离线访问
- **暗色模式**：跟随系统或手动切换
- **全局搜索**：FlexSearch 模糊搜索，`Alt+K` 快捷键
- **键盘快捷键**：`Alt+H` 首页、`Alt+F` 收藏、`Alt+K` 搜索
- **静态导出**：构建产物为纯静态文件，可部署到任意 CDN
- **SEO 优化**：动态 meta 标签、Open Graph、JSON-LD 结构化数据
