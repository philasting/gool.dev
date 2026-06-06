import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Gool — 免费在线工具箱",
    template: "%s | Gool",
  },
  description:
    "Gool — 免费在线工具箱，152 种实用工具，含开发工具、文本处理、图片工具、编码加密等，纯前端运行，无需登录，数据不离开浏览器",
  keywords: [
    "在线工具", "Gool", "gool.dev", "JSON格式化", "Base64", "URL编码", "时间戳",
    "正则表达式", "哈希计算", "密码生成", "图片压缩", "PDF合并", "二维码",
    "Markdown", "文本加密", "RSA密钥", "单位换算", "人民币大写",
  ],
  authors: [{ name: "Gool" }],
  creator: "Gool",
  metadataBase: new URL("https://gool.dev"),
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "Gool",
    title: "Gool — 免费在线工具箱",
    description:
      "Gool — 免费在线工具箱，152 种实用工具，纯前端运行，数据不离开浏览器",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gool — 免费在线工具箱",
    description:
      "Gool — 免费在线工具箱，152 种实用工具，纯前端运行，数据不离开浏览器",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

/** JSON-LD structured data for the toolbox website */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Gool",
  description: "Gool — 免费在线工具箱，152 种实用工具，含开发工具、文本处理、图片工具、编码加密等",
  url: "https://gool.dev",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "CNY",
  },
  featureList: [
    "JSON 格式化", "Base64 编解码", "URL 编解码", "时间戳转换",
    "正则表达式测试", "字数统计", "文本去重", "大小写转换",
    "图片压缩", "哈希计算", "密码生成器", "IP 查询",
    "文件哈希计算", "进制转换", "颜色转换", "JWT 解码",
    "Cron 表达式", "简繁转换", "汉字转拼音", "文本批量替换",
    "图片格式转换", "图片调整尺寸", "图片 Base64 互转",
    "PDF 合并", "PDF 拆分", "图片转 PDF", "UUID 生成器",
    "SQL 格式化", "HTML 实体编码", "文本差异对比", "二维码生成/解析",
    "Markdown 预览", "文本加密/解密", "ICO 图标生成", "图片取色器",
    "水印添加", "九宫格切图", "RSA 密钥生成", "摩斯密码",
    "Unicode 转换", "单位换算", "人民币大写",
  ],
};

/** Service Worker registration script */
const swScript = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(function() {});
  });
}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script dangerouslySetInnerHTML={{ __html: swScript }} />
        {/* Umami Analytics */}
        <script
          defer
          src="https://data.gool.dev/script.js"
          data-website-id="f08353e6-2674-4ff2-ad5c-e2cac4c872ec"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <Header />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 p-4 md:p-6 min-h-0">
                <div className="mx-auto max-w-[1536px] md:pl-56 lg:pl-64">
                  {children}
                </div>
              </main>
            </div>
            <Footer />
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
