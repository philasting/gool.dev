import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TOOLS, getToolBySlug } from "@/tools/registry";
import { ToolDetailClient } from "./ToolDetailClient";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

/** Generate static paths for all registered tools */
export function generateStaticParams() {
  return TOOLS.map((tool) => ({
    slug: tool.slug,
  }));
}

/** Generate dynamic metadata for each tool page */
export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return { title: "工具未找到" };
  }

  return {
    title: tool.name,
    description: tool.description,
    keywords: tool.tags,
    openGraph: {
      title: `${tool.name} | Gool`,
      description: tool.description,
      type: "website",
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  return <ToolDetailClient tool={tool} />;
}
