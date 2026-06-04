"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { GitBranch, Download, ZoomIn, ZoomOut } from "lucide-react";
import { useCopyState } from "@/components/tool/ToolLayout";

interface MindMapNode {
  id: string;
  label: string;
  children: MindMapNode[];
  collapsed: boolean;
}

/** Parse Markdown-style list into a tree */
function parseMarkdownToTree(markdown: string): MindMapNode {
  const root: MindMapNode = { id: "root", label: "思维导图", children: [], collapsed: false };
  const lines = markdown.split("\n").filter((line) => line.trim().length > 0);
  const stack: { node: MindMapNode; level: number }[] = [{ node: root, level: -1 }];

  let idCounter = 0;
  const nextId = () => `node-${idCounter++}`;

  for (const line of lines) {
    // Detect heading as root label
    const headingMatch = line.match(/^#+\s+(.+)/);
    if (headingMatch && stack.length === 1) {
      root.label = headingMatch[1].trim();
      continue;
    }

    // Detect list item with indent
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)/);
    if (!listMatch) {
      // Plain text line, treat as level-0 item
      const newNode: MindMapNode = { id: nextId(), label: line.trim(), children: [], collapsed: false };
      root.children.push(newNode);
      continue;
    }

    const indent = listMatch[1].length;
    const level = Math.floor(indent / 2) + (listMatch[2].match(/\d+\./) ? 1 : 0);
    const label = listMatch[3].trim();
    const newNode: MindMapNode = { id: nextId(), label, children: [], collapsed: false };

    // Find parent
    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    stack[stack.length - 1].node.children.push(newNode);
    stack.push({ node: newNode, level });
  }

  return root;
}

/** Count total visible nodes */
function countNodes(node: MindMapNode): number {
  if (node.collapsed) return 1;
  let count = 1;
  for (const child of node.children) {
    count += countNodes(child);
  }
  return count;
}

/** Get max depth of the tree */
function getMaxDepth(node: MindMapNode, depth = 0): number {
  if (node.children.length === 0 || node.collapsed) return depth;
  let max = depth;
  for (const child of node.children) {
    max = Math.max(max, getMaxDepth(child, depth + 1));
  }
  return max;
}

/** Layout and render tree as SVG */
interface LayoutNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  children: LayoutNode[];
  collapsed: boolean;
  hasChildren: boolean;
}

function layoutTree(
  node: MindMapNode,
  x: number,
  y: number,
  nodeWidth: number,
  nodeHeight: number,
  hGap: number,
  vGap: number
): { layoutNode: LayoutNode; totalHeight: number } {
  const labelLen = Math.max(node.label.length * 14 + 24, nodeWidth);
  const lw = Math.min(labelLen, 200);
  const lh = nodeHeight;

  if (node.children.length === 0 || node.collapsed) {
    return {
      layoutNode: {
        id: node.id,
        label: node.label,
        x,
        y,
        width: lw,
        height: lh,
        children: [],
        collapsed: node.collapsed,
        hasChildren: node.children.length > 0,
      },
      totalHeight: lh,
    };
  }

  // Layout children vertically
  const childX = x + lw + hGap;
  let currentY = y;
  const childLayouts: LayoutNode[] = [];
  let totalChildHeight = 0;

  for (let i = 0; i < node.children.length; i++) {
    const { layoutNode: childLayout, totalHeight: childH } = layoutTree(
      node.children[i],
      childX,
      currentY,
      nodeWidth,
      nodeHeight,
      hGap,
      vGap
    );
    childLayouts.push(childLayout);
    currentY += childH + vGap;
    totalChildHeight += childH;
    if (i < node.children.length - 1) totalChildHeight += vGap;
  }

  // Center parent vertically relative to children
  const centerY = childLayouts.length > 0
    ? childLayouts[0].y + (childLayouts[childLayouts.length - 1].y + childLayouts[childLayouts.length - 1].height - childLayouts[0].y) / 2 - lh / 2
    : y;

  return {
    layoutNode: {
      id: node.id,
      label: node.label,
      x,
      y: centerY,
      width: lw,
      height: lh,
      children: childLayouts,
      collapsed: false,
      hasChildren: true,
    },
    totalHeight: Math.max(lh, totalChildHeight),
  };
}

function flattenLayout(layoutNode: LayoutNode): LayoutNode[] {
  const result: LayoutNode[] = [layoutNode];
  for (const child of layoutNode.children) {
    result.push(...flattenLayout(child));
  }
  return result;
}

const DEFAULT_MARKDOWN = `# GotAI 工具箱
- 文本工具
  - ASCII 艺术字
  - 中英文排版
  - 假名转换
- 图片工具
  - 图片转字符画
  - 配色提取
  - 视频转 GIF
- 开发工具
  - JSON 格式化
  - 正则测试
  - 编码转换`;

export function MindMapTool() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);

  const tree = useMemo(() => parseMarkdownToTree(markdown), [markdown]);

  // Apply collapsed state
  const applyCollapsed = useCallback((node: MindMapNode, collapsed: Set<string>): MindMapNode => {
    return {
      ...node,
      collapsed: collapsed.has(node.id),
      children: node.children.map((c) => applyCollapsed(c, collapsed)),
    };
  }, []);

  const displayTree = useMemo(() => applyCollapsed(tree, collapsedNodes), [tree, collapsedNodes, applyCollapsed]);

  const { layoutNode, svgWidth, svgHeight } = useMemo(() => {
    const { layoutNode: ln } = layoutTree(displayTree, 40, 40, 120, 36, 60, 10);
    const allNodes = flattenLayout(ln);
    let maxX = 0;
    let maxY = 0;
    for (const n of allNodes) {
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    }
    return { layoutNode: ln, svgWidth: maxX + 60, svgHeight: maxY + 60 };
  }, [displayTree]);

  const toggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleExportSVG = useCallback(() => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mindmap.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleExportPNG = useCallback(() => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = svgWidth * scale;
    canvas.height = svgHeight * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, svgWidth, svgHeight);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mindmap.png";
        a.click();
        URL.revokeObjectURL(url);
      });
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [svgWidth, svgHeight]);

  /** Render SVG nodes recursively */
  const renderNode = (node: LayoutNode): React.ReactNode => {
    const isRoot = node.id === "root";
    const bgColor = isRoot ? "#3b82f6" : "#f1f5f9";
    const textColor = isRoot ? "#ffffff" : "#1e293b";
    const borderColor = isRoot ? "#2563eb" : "#cbd5e1";

    return (
      <g key={node.id}>
        {/* Connection lines to children */}
        {node.children.map((child) => (
          <path
            key={`line-${node.id}-${child.id}`}
            d={`M${node.x + node.width},${node.y + node.height / 2} C${node.x + node.width + 30},${node.y + node.height / 2} ${child.x - 30},${child.y + child.height / 2} ${child.x},${child.y + child.height / 2}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={1.5}
          />
        ))}
        {/* Node rectangle */}
        <rect
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          rx={8}
          fill={bgColor}
          stroke={borderColor}
          strokeWidth={1.5}
          style={{ cursor: node.hasChildren ? "pointer" : "default" }}
          onClick={() => {
            if (node.hasChildren) toggleCollapse(node.id);
          }}
        />
        {/* Label */}
        <text
          x={node.x + 12}
          y={node.y + node.height / 2 + 5}
          fill={textColor}
          fontSize={isRoot ? 14 : 12}
          fontWeight={isRoot ? "bold" : "normal"}
          style={{ pointerEvents: "none" }}
        >
          {node.label.length > 16 ? node.label.substring(0, 16) + "…" : node.label}
        </text>
        {/* Collapse indicator */}
        {node.hasChildren && node.collapsed && (
          <g>
            <circle
              cx={node.x + node.width - 14}
              cy={node.y + node.height / 2}
              r={8}
              fill="#e2e8f0"
              stroke="#94a3b8"
              strokeWidth={1}
            />
            <text
              x={node.x + node.width - 14}
              y={node.y + node.height / 2 + 4}
              textAnchor="middle"
              fontSize={10}
              fill="#64748b"
            >
              +
            </text>
          </g>
        )}
        {/* Render children */}
        {node.children.map((child) => renderNode(child))}
      </g>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Markdown 列表输入</Label>
          <Textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder={`# 主题\n- 分支1\n  - 子分支1-1\n- 分支2`}
            rows={12}
            className="resize-y font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>思维导图预览</Label>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="border border-border rounded-xl overflow-auto bg-white" style={{ maxHeight: 500 }}>
            <svg
              ref={svgRef}
              width={svgWidth * zoom}
              height={svgHeight * zoom}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              xmlns="http://www.w3.org/2000/svg"
            >
              {renderNode(layoutNode)}
            </svg>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="secondary" size="sm" onClick={handleExportSVG}>
          <Download className="h-4 w-4 mr-1" /> 导出 SVG
        </Button>
        <Button variant="secondary" size="sm" onClick={handleExportPNG}>
          <Download className="h-4 w-4 mr-1" /> 导出 PNG
        </Button>
        <span className="text-xs text-muted-foreground">点击节点可展开/折叠</span>
      </div>
    </div>
  );
}
