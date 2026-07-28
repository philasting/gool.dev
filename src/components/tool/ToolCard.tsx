"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategoryInfo } from "@/types/tool";
import type { ToolMeta } from "@/types/tool";
import {
  Braces,
  Binary,
  Link as LinkIcon,
  Clock,
  Regex,
  Calculator,
  ListFilter,
  CaseSensitive,
  FileImage,
  Fingerprint,
  KeyRound,
  Globe,
  Code2,
  Type,
  Image,
  FileText,
  Shield,
  Heart,
  Key,
  Palette,
  Pipette,
  AlignLeft,
  GitCompare,
  FileCode,
  Crop,
  ArrowRightLeft,
  Table,
  Lock,
  ShieldCheck,
  QrCode,
  Ruler,
  Hash,
  Code,
  Replace,
  FileSearch,
  Timer,
  Languages,
  Volume2,
  ImageDown,
  Scaling,
  FileStack,
  Scissors,
  Database,
  ImagePlus,
  Stamp,
  Grid3X3,
  Radio,
  Banknote,
  FileCode2,
  Gem,
  Moon,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Braces,
  Binary,
  Link: LinkIcon,
  Clock,
  Regex,
  Calculator,
  ListFilter,
  CaseSensitive,
  FileImage,
  Fingerprint,
  KeyRound,
  Globe,
  Code2,
  Type,
  Image,
  FileText,
  Shield,
  Heart,
  Key,
  Palette,
  Pipette,
  AlignLeft,
  GitCompare,
  FileCode,
  Crop,
  ArrowRightLeft,
  Table,
  Lock,
  ShieldCheck,
  QrCode,
  Ruler,
  Hash,
  Code,
  Replace,
  FileSearch,
  Timer,
  Languages,
  Volume2,
  ImageDown,
  Scaling,
  FileStack,
  Scissors,
  Database,
  ImagePlus,
  Stamp,
  Grid3X3,
  Radio,
  Banknote,
  FileCode2,
  Gem,
  Moon,
};

interface ToolCardProps {
  tool: ToolMeta;
}

export function ToolCard({ tool }: ToolCardProps) {
  const catInfo = getCategoryInfo(tool.category);
  const Icon = ICON_MAP[tool.icon] || Code2;

  return (
    <Link href={`/tools/${tool.slug}`}>
      <Card className="tool-card rounded-xl border border-border hover:border-primary/30 cursor-pointer h-full">
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div
              className={cn_icon(
                "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10",
                catInfo.color
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {catInfo.labelZh}
            </Badge>
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight">{tool.name}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {tool.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function cn_icon(...inputs: string[]) {
  return inputs.filter(Boolean).join(" ");
}
