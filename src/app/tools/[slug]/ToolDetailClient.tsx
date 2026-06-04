"use client";

import dynamic from "next/dynamic";
import { ToolLayout } from "@/components/tool/ToolLayout";
import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { ToolMeta } from "@/types/tool";

/** Tool component props - each tool receives nothing, manages its own copy */
export interface ToolComponentProps {
  // Tools handle their own copy internally via useCopyState
}

/** Dynamic imports for all implemented tool components (P0 + P1 + P2) */
const toolComponents: Record<string, React.ComponentType<ToolComponentProps>> = {
  // P0: Dev Tools
  "json-formatter": dynamic(() => import("@/tools/dev/json-formatter").then((m) => m.JsonFormatter), { ssr: false }),
  base64: dynamic(() => import("@/tools/dev/base64").then((m) => m.Base64Tool), { ssr: false }),
  "url-encode": dynamic(() => import("@/tools/dev/url-encode").then((m) => m.UrlEncodeTool), { ssr: false }),
  timestamp: dynamic(() => import("@/tools/dev/timestamp").then((m) => m.TimestampTool), { ssr: false }),
  "regex-tester": dynamic(() => import("@/tools/dev/regex-tester").then((m) => m.RegexTesterTool), { ssr: false }),
  "json-to-ts": dynamic(() => import("@/tools/dev/json-to-ts").then((m) => m.JsonToTsTool), { ssr: false }),
  "css-unit-converter": dynamic(() => import("@/tools/dev/css-unit-converter").then((m) => m.CssUnitConverterTool), { ssr: false }),
  "color-contrast": dynamic(() => import("@/tools/dev/color-contrast").then((m) => m.ColorContrastTool), { ssr: false }),
  "yaml-json-converter": dynamic(() => import("@/tools/dev/yaml-json-converter").then((m) => m.YamlJsonConverterTool), { ssr: false }),
  // P0: Text Tools
  "word-count": dynamic(() => import("@/tools/text/word-count").then((m) => m.WordCountTool), { ssr: false }),
  "text-dedup": dynamic(() => import("@/tools/text/text-dedup").then((m) => m.TextDedupTool), { ssr: false }),
  "case-converter": dynamic(() => import("@/tools/text/case-converter").then((m) => m.CaseConverterTool), { ssr: false }),
  "lorem-ipsum": dynamic(() => import("@/tools/text/lorem-ipsum").then((m) => m.LoremIpsumTool), { ssr: false }),
  // P0: Image Tools
  "image-compress": dynamic(() => import("@/tools/image/image-compress").then((m) => m.ImageCompressTool), { ssr: false }),
  "image-crop": dynamic(() => import("@/tools/image/image-crop").then((m) => m.ImageCropTool), { ssr: false }),
  // P0: Crypto Tools
  "hash-calculator": dynamic(() => import("@/tools/crypto/hash-calculator").then((m) => m.HashCalculatorTool), { ssr: false }),
  // P0: Life Tools
  "password-generator": dynamic(() => import("@/tools/life/password-generator").then((m) => m.PasswordGeneratorTool), { ssr: false }),
  "ip-query": dynamic(() => import("@/tools/life/ip-query").then((m) => m.IpQueryTool), { ssr: false }),
  calculator: dynamic(() => import("@/tools/life/calculator").then((m) => m.CalculatorTool), { ssr: false }),

  // P1: Dev Tools
  "md5-sha": dynamic(() => import("@/tools/dev/md5-sha").then((m) => m.Md5ShaTool), { ssr: false }),
  "radix-converter": dynamic(() => import("@/tools/dev/radix-converter").then((m) => m.RadixConverterTool), { ssr: false }),
  "color-converter": dynamic(() => import("@/tools/dev/color-converter").then((m) => m.ColorConverterTool), { ssr: false }),
  "jwt-decoder": dynamic(() => import("@/tools/dev/jwt-decoder").then((m) => m.JwtDecoderTool), { ssr: false }),
  "cron-helper": dynamic(() => import("@/tools/dev/cron-helper").then((m) => m.CronHelperTool), { ssr: false }),
  // P1: Text Tools
  "simplified-traditional": dynamic(() => import("@/tools/text/simplified-traditional").then((m) => m.SimplifiedTraditionalTool), { ssr: false }),
  pinyin: dynamic(() => import("@/tools/text/pinyin").then((m) => m.PinyinTool), { ssr: false }),
  "text-replace": dynamic(() => import("@/tools/text/text-replace").then((m) => m.TextReplaceTool), { ssr: false }),
  // P1: Image Tools
  "image-format": dynamic(() => import("@/tools/image/image-format").then((m) => m.ImageFormatTool), { ssr: false }),
  "image-resize": dynamic(() => import("@/tools/image/image-resize").then((m) => m.ImageResizeTool), { ssr: false }),
  "image-base64": dynamic(() => import("@/tools/image/image-base64").then((m) => m.ImageBase64Tool), { ssr: false }),
  // P1: Doc Tools
  "pdf-merge": dynamic(() => import("@/tools/doc/pdf-merge").then((m) => m.PdfMergeTool), { ssr: false }),
  "pdf-split": dynamic(() => import("@/tools/doc/pdf-split").then((m) => m.PdfSplitTool), { ssr: false }),
  "image-to-pdf": dynamic(() => import("@/tools/doc/image-to-pdf").then((m) => m.ImageToPdfTool), { ssr: false }),
  // P1: Life Tools
  "uuid-generator": dynamic(() => import("@/tools/life/uuid-generator").then((m) => m.UuidGeneratorTool), { ssr: false }),
  // P1 new: Dev Tools
  "http-status-codes": dynamic(() => import("@/tools/dev/http-status-codes").then((m) => m.HttpStatusCodesTool), { ssr: false }),
  "number-formatter": dynamic(() => import("@/tools/dev/number-formatter").then((m) => m.NumberFormatterTool), { ssr: false }),
  "mock-data-generator": dynamic(() => import("@/tools/dev/mock-data-generator").then((m) => m.MockDataGeneratorTool), { ssr: false }),
  "jwt-generator": dynamic(() => import("@/tools/dev/jwt-generator").then((m) => m.JwtGeneratorTool), { ssr: false }),
  // P1 new: Text Tools
  "text-to-speech": dynamic(() => import("@/tools/text/text-to-speech").then((m) => m.TextToSpeechTool), { ssr: false }),
  // P1 new: Image Tools
  "image-round-corners": dynamic(() => import("@/tools/image/image-round-corners").then((m) => m.ImageRoundCornersTool), { ssr: false }),
  "svg-to-png": dynamic(() => import("@/tools/image/svg-to-png").then((m) => m.SvgToPngTool), { ssr: false }),
  // P1 new: Crypto Tools
  "otp-generator": dynamic(() => import("@/tools/crypto/otp-generator").then((m) => m.OtpGeneratorTool), { ssr: false }),
  // P1 new: Life Tools
  "countdown-timer": dynamic(() => import("@/tools/life/countdown-timer").then((m) => m.CountdownTimerTool), { ssr: false }),

  // P2: Dev Tools
  "sql-formatter": dynamic(() => import("@/tools/dev/sql-formatter").then((m) => m.SqlFormatterTool), { ssr: false }),
  "html-entity": dynamic(() => import("@/tools/dev/html-entity").then((m) => m.HtmlEntityTool), { ssr: false }),
  "text-diff": dynamic(() => import("@/tools/dev/text-diff").then((m) => m.TextDiffTool), { ssr: false }),
  qrcode: dynamic(() => import("@/tools/dev/qrcode").then((m) => m.QrcodeTool), { ssr: false }),
  // P2: Text Tools
  "markdown-preview": dynamic(() => import("@/tools/text/markdown-preview").then((m) => m.MarkdownPreviewTool), { ssr: false }),
  "text-encrypt": dynamic(() => import("@/tools/text/text-encrypt").then((m) => m.TextEncryptTool), { ssr: false }),
  // P2: Image Tools
  "ico-generator": dynamic(() => import("@/tools/image/ico-generator").then((m) => m.IcoGeneratorTool), { ssr: false }),
  "color-picker": dynamic(() => import("@/tools/image/color-picker").then((m) => m.ColorPickerTool), { ssr: false }),
  watermark: dynamic(() => import("@/tools/image/watermark").then((m) => m.WatermarkTool), { ssr: false }),
  "grid-cutter": dynamic(() => import("@/tools/image/grid-cutter").then((m) => m.GridCutterTool), { ssr: false }),
  // P2: Crypto Tools
  "rsa-keygen": dynamic(() => import("@/tools/crypto/rsa-keygen").then((m) => m.RsaKeygenTool), { ssr: false }),
  "morse-code": dynamic(() => import("@/tools/crypto/morse-code").then((m) => m.MorseCodeTool), { ssr: false }),
  "unicode-convert": dynamic(() => import("@/tools/crypto/unicode-convert").then((m) => m.UnicodeConvertTool), { ssr: false }),
  // P2: Life Tools
  "unit-converter": dynamic(() => import("@/tools/life/unit-converter").then((m) => m.UnitConverterTool), { ssr: false }),
  "rmb-uppercase": dynamic(() => import("@/tools/life/rmb-uppercase").then((m) => m.RmbUppercaseTool), { ssr: false }),
  // P2 new: Text Tools
  "chinese-number": dynamic(() => import("@/tools/text/chinese-number").then((m) => m.ChineseNumberTool), { ssr: false }),
  // P2 new: Life Tools
  "bmi-calculator": dynamic(() => import("@/tools/life/bmi-calculator").then((m) => m.BmiCalculatorTool), { ssr: false }),
  "exchange-rate": dynamic(() => import("@/tools/life/exchange-rate").then((m) => m.ExchangeRateTool), { ssr: false }),

  // ─── 竞品补齐: Dev Tools ───
  "xml-formatter": dynamic(() => import("@/tools/dev/xml-formatter").then((m) => m.XmlFormatterTool), { ssr: false }),
  "html-formatter": dynamic(() => import("@/tools/dev/html-formatter").then((m) => m.HtmlFormatterTool), { ssr: false }),
  "css-formatter": dynamic(() => import("@/tools/dev/css-formatter").then((m) => m.CssFormatterTool), { ssr: false }),
  "js-formatter": dynamic(() => import("@/tools/dev/js-formatter").then((m) => m.JsFormatterTool), { ssr: false }),
  "websocket-tester": dynamic(() => import("@/tools/dev/websocket-tester").then((m) => m.WebsocketTesterTool), { ssr: false }),
  "code-screenshot": dynamic(() => import("@/tools/dev/code-screenshot").then((m) => m.CodeScreenshotTool), { ssr: false }),
  "nanoid-generator": dynamic(() => import("@/tools/dev/nanoid-generator").then((m) => m.NanoidGeneratorTool), { ssr: false }),
  "cidr-calculator": dynamic(() => import("@/tools/dev/cidr-calculator").then((m) => m.CidrCalculatorTool), { ssr: false }),
  "chmod-calculator": dynamic(() => import("@/tools/dev/chmod-calculator").then((m) => m.ChmodCalculatorTool), { ssr: false }),
  "json-csv-converter": dynamic(() => import("@/tools/dev/json-csv-converter").then((m) => m.JsonCsvConverterTool), { ssr: false }),
  "html-preview": dynamic(() => import("@/tools/dev/html-preview").then((m) => m.HtmlPreviewTool), { ssr: false }),
  "barcode-generator": dynamic(() => import("@/tools/dev/barcode-generator").then((m) => m.BarcodeGeneratorTool), { ssr: false }),
  "css-gradient-generator": dynamic(() => import("@/tools/dev/css-gradient-generator").then((m) => m.CssGradientGeneratorTool), { ssr: false }),
  "css-shadow-generator": dynamic(() => import("@/tools/dev/css-shadow-generator").then((m) => m.CssShadowGeneratorTool), { ssr: false }),
  "css-grid-generator": dynamic(() => import("@/tools/dev/css-grid-generator").then((m) => m.CssGridGeneratorTool), { ssr: false }),
  "css-flexbox-generator": dynamic(() => import("@/tools/dev/css-flexbox-generator").then((m) => m.CssFlexboxGeneratorTool), { ssr: false }),
  "json-xml-converter": dynamic(() => import("@/tools/dev/json-xml-converter").then((m) => m.JsonXmlConverterTool), { ssr: false }),
  "user-agent-parser": dynamic(() => import("@/tools/dev/user-agent-parser").then((m) => m.UserAgentParserTool), { ssr: false }),
  "keycode-detector": dynamic(() => import("@/tools/dev/keycode-detector").then((m) => m.KeycodeDetectorTool), { ssr: false }),
  "email-validator": dynamic(() => import("@/tools/dev/email-validator").then((m) => m.EmailValidatorTool), { ssr: false }),
  "meta-tag-generator": dynamic(() => import("@/tools/dev/meta-tag-generator").then((m) => m.MetaTagGeneratorTool), { ssr: false }),
  "url-parser": dynamic(() => import("@/tools/dev/url-parser").then((m) => m.UrlParserTool), { ssr: false }),
  "dns-lookup": dynamic(() => import("@/tools/dev/dns-lookup").then((m) => m.DnsLookupTool), { ssr: false }),
  "escape-unescape": dynamic(() => import("@/tools/dev/escape-unescape").then((m) => m.EscapeUnescapeTool), { ssr: false }),
  "punycode-converter": dynamic(() => import("@/tools/dev/punycode-converter").then((m) => m.PunycodeConverterTool), { ssr: false }),
  "json-schema-generator": dynamic(() => import("@/tools/dev/json-schema-generator").then((m) => m.JsonSchemaGeneratorTool), { ssr: false }),
  "json-diff": dynamic(() => import("@/tools/dev/json-diff").then((m) => m.JsonDiffTool), { ssr: false }),
  "color-palette": dynamic(() => import("@/tools/dev/color-palette").then((m) => m.ColorPaletteTool), { ssr: false }),
  "data-size-converter": dynamic(() => import("@/tools/dev/data-size-converter").then((m) => m.DataSizeConverterTool), { ssr: false }),

  // ─── 竞品补齐: Text Tools ───
  "emoji-search": dynamic(() => import("@/tools/text/emoji-search").then((m) => m.EmojiSearchTool), { ssr: false }),
  "text-remove-blank-lines": dynamic(() => import("@/tools/text/text-remove-blank-lines").then((m) => m.TextRemoveBlankLinesTool), { ssr: false }),
  "text-sort": dynamic(() => import("@/tools/text/text-sort").then((m) => m.TextSortTool), { ssr: false }),
  "word-frequency": dynamic(() => import("@/tools/text/word-frequency").then((m) => m.WordFrequencyTool), { ssr: false }),
  "ascii-table": dynamic(() => import("@/tools/text/ascii-table").then((m) => m.AsciiTableTool), { ssr: false }),
  "temp-note": dynamic(() => import("@/tools/text/temp-note").then((m) => m.TempNoteTool), { ssr: false }),
  "fullwidth-halfwidth": dynamic(() => import("@/tools/text/fullwidth-halfwidth").then((m) => m.FullwidthHalfwidthTool), { ssr: false }),

  // ─── 竞品补齐: Image Tools ───
  "image-exif": dynamic(() => import("@/tools/image/image-exif").then((m) => m.ImageExifTool), { ssr: false }),
  "image-flip-rotate": dynamic(() => import("@/tools/image/image-flip-rotate").then((m) => m.ImageFlipRotateTool), { ssr: false }),
  "image-stitch": dynamic(() => import("@/tools/image/image-stitch").then((m) => m.ImageStitchTool), { ssr: false }),
  "image-blur": dynamic(() => import("@/tools/image/image-blur").then((m) => m.ImageBlurTool), { ssr: false }),
  "text-to-image": dynamic(() => import("@/tools/image/text-to-image").then((m) => m.TextToImageTool), { ssr: false }),
  "gif-maker": dynamic(() => import("@/tools/image/gif-maker").then((m) => m.GifMakerTool), { ssr: false }),
  "pixel-art": dynamic(() => import("@/tools/image/pixel-art").then((m) => m.PixelArtTool), { ssr: false }),
  "image-invert": dynamic(() => import("@/tools/image/image-invert").then((m) => m.ImageInvertTool), { ssr: false }),

  // ─── 竞品补齐: Doc Tools ───
  "pdf-watermark": dynamic(() => import("@/tools/doc/pdf-watermark").then((m) => m.PdfWatermarkTool), { ssr: false }),

  // ─── 竞品补齐: Crypto Tools ───
  "hmac-generator": dynamic(() => import("@/tools/crypto/hmac-generator").then((m) => m.HmacGeneratorTool), { ssr: false }),
  "caesar-cipher": dynamic(() => import("@/tools/crypto/caesar-cipher").then((m) => m.CaesarCipherTool), { ssr: false }),
  "crc32-calculator": dynamic(() => import("@/tools/crypto/crc32-calculator").then((m) => m.Crc32CalculatorTool), { ssr: false }),
  "base32-base58": dynamic(() => import("@/tools/crypto/base32-base58").then((m) => m.Base32Base58Tool), { ssr: false }),

  // ─── 竞品补齐: Life Tools ───
  "pomodoro": dynamic(() => import("@/tools/life/pomodoro").then((m) => m.PomodoroTool), { ssr: false }),
  "date-calculator": dynamic(() => import("@/tools/life/date-calculator").then((m) => m.DateCalculatorTool), { ssr: false }),
  "stopwatch": dynamic(() => import("@/tools/life/stopwatch").then((m) => m.StopwatchTool), { ssr: false }),
  "timezone-converter": dynamic(() => import("@/tools/life/timezone-converter").then((m) => m.TimezoneConverterTool), { ssr: false }),
  "screen-info": dynamic(() => import("@/tools/life/screen-info").then((m) => m.ScreenInfoTool), { ssr: false }),
  "mortgage-calculator": dynamic(() => import("@/tools/life/mortgage-calculator").then((m) => m.MortgageCalculatorTool), { ssr: false }),
  "tax-calculator": dynamic(() => import("@/tools/life/tax-calculator").then((m) => m.TaxCalculatorTool), { ssr: false }),
};

interface ToolDetailClientProps {
  tool: ToolMeta;
}

export function ToolDetailClient({ tool }: ToolDetailClientProps) {
  const ToolComponent = toolComponents[tool.slug];

  // Register keyboard shortcuts (Alt+H home, Alt+F favorite)
  useKeyboardShortcuts(tool.slug);

  if (!ToolComponent) {
    // Placeholder for unimplemented tools
    return (
      <ToolLayout tool={tool}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Construction className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">正在开发中</h3>
            <p className="text-muted-foreground text-sm">
              该工具正在紧锣密鼓地开发中，敬请期待！
            </p>
          </CardContent>
        </Card>
      </ToolLayout>
    );
  }

  return (
    <ToolLayout tool={tool}>
      <ToolComponent />
    </ToolLayout>
  );
}
