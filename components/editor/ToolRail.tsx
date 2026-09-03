"use client";

import {
  Crop,
  Eraser,
  Hand,
  ImagePlus,
  MousePointer2,
  Paintbrush,
  PenTool,
  Pipette,
  Shapes,
  Type,
  ZoomIn,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import type { Tool } from "@/lib/editor/types";

const TOOLS: { id: Tool; label: string; shortcut: string; icon: typeof Type }[] = [
  { id: "select", label: "Pilih / Geser", shortcut: "V", icon: MousePointer2 },
  { id: "pan", label: "Geser kanvas", shortcut: "H", icon: Hand },
  { id: "text", label: "Teks", shortcut: "T", icon: Type },
  { id: "image", label: "Gambar", shortcut: "I", icon: ImagePlus },
  { id: "shape", label: "Bentuk", shortcut: "U", icon: Shapes },
  { id: "draw", label: "Kuas", shortcut: "B", icon: Paintbrush },
  { id: "pen", label: "Pena", shortcut: "P", icon: PenTool },
  { id: "eraser", label: "Penghapus", shortcut: "E", icon: Eraser },
  { id: "crop", label: "Pangkas gambar", shortcut: "C", icon: Crop },
  { id: "eyedropper", label: "Pipet warna", shortcut: "I", icon: Pipette },
  { id: "zoom", label: "Zoom", shortcut: "Z", icon: ZoomIn },
];

export function ToolRail() {
  const tool = useEditor((s) => s.tool);
  const setTool = useEditor((s) => s.setTool);

  return (
    <aside className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-white/8 bg-[#0c0e14] py-2">
      {TOOLS.map((t) => {
        const Icon = t.icon;
        const active = tool === t.id;
        return (
          <button
            key={t.id}
            type="button"
            title={`${t.label} (${t.shortcut})`}
            onClick={() => setTool(t.id)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
              active
                ? "bg-[var(--accent)] text-[#111] shadow-[0_0_16px_rgba(232,255,71,0.28)]"
                : "text-white/45 hover:bg-white/6 hover:text-white"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
          </button>
        );
      })}
    </aside>
  );
}
