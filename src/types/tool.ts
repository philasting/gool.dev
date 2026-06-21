/** Category types for the toolbox */
export type Category = "dev" | "text" | "image" | "doc" | "crypto" | "life" | "info" | "finance" | "ai" | "fun" | "study";

/** Category display information */
export interface CategoryInfo {
  slug: Category;
  label: string;
  labelZh: string;
  icon: string;
  color: string;
}

/** Tool metadata definition */
export interface ToolMeta {
  /** URL-friendly unique identifier */
  slug: string;
  /** Display name */
  name: string;
  /** One-line description */
  description: string;
  /** Category the tool belongs to */
  category: Category;
  /** Lucide icon name */
  icon: string;
  /** Searchable tags */
  tags: string[];
  /** Sort priority (lower = higher priority) */
  priority: number;
}

/** Categories configuration */
export const CATEGORIES: CategoryInfo[] = [
  { slug: "dev", label: "Developer", labelZh: "开发工具", icon: "Code2", color: "text-blue-500" },
  { slug: "text", label: "Text", labelZh: "文本工具", icon: "Type", color: "text-green-500" },
  { slug: "image", label: "Image", labelZh: "图片工具", icon: "Image", color: "text-purple-500" },
  { slug: "doc", label: "Document", labelZh: "文档工具", icon: "FileText", color: "text-orange-500" },
  { slug: "crypto", label: "Crypto", labelZh: "编码加密", icon: "Shield", color: "text-red-500" },
  { slug: "life", label: "Life", labelZh: "生活效率", icon: "Heart", color: "text-pink-500" },
  { slug: "info", label: "Info", labelZh: "信息工具", icon: "Info", color: "text-amber-500" },
  { slug: "finance", label: "Finance", labelZh: "金融工具", icon: "DollarSign", color: "text-emerald-500" },
  { slug: "ai", label: "AI", labelZh: "AI 工具", icon: "Sparkles", color: "text-purple-500" },
  { slug: "fun", label: "Fun", labelZh: "娱乐工具", icon: "Gamepad2", color: "text-pink-500" },
  { slug: "study", label: "Study", labelZh: "学习工具", icon: "GraduationCap", color: "text-indigo-500" },
];

/** Get category info by slug */
export function getCategoryInfo(slug: Category): CategoryInfo {
  return CATEGORIES.find((c) => c.slug === slug) ?? CATEGORIES[0];
}
