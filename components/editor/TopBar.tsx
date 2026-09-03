"use client";

import {
  Box,
  Download,
  HelpCircle,
  Redo2,
  RotateCcw,
  Sparkles,
  Undo2,
} from "lucide-react";
import { buildGarmentLayout, GARMENT_COLORS, GARMENT_LABEL, hasSleeves, SIZE_ORDER, VIEW_LABEL } from "@/lib/editor/garment";
import { useEditor } from "@/lib/editor/store";
import type { PrintView } from "@/lib/editor/types";
import { IconBtn } from "./ui";

const VIEWS: PrintView[] = ["front", "back", "sleeveLeft", "sleeveRight"];

export function TopBar({ onHelp, onExportDesign }: { onHelp: () => void; onExportDesign: () => void }) {
  const garmentType = useEditor((s) => s.garmentType);
  const size = useEditor((s) => s.size);
  const view = useEditor((s) => s.view);
  const setView = useEditor((s) => s.setView);
  const setSize = useEditor((s) => s.setSize);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const past = useEditor((s) => s.past);
  const future = useEditor((s) => s.future);
  const newProject = useEditor((s) => s.newProject);
  const garmentColor = useEditor((s) => s.garmentColor);
  const setGarmentColor = useEditor((s) => s.setGarmentColor);
  const generate = useGenerate();

  const layout = buildGarmentLayout(garmentType, size);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/8 bg-[#0e1016]/90 px-3 backdrop-blur-xl">
      <div className="flex items-center gap-2.5 pr-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-[#111]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold tracking-wide text-white">STUDIO KAOS</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">Editor 2D → 3D</div>
        </div>
      </div>

      <div className="h-6 w-px bg-white/10" />

      <div className="flex items-center gap-1">
        <IconBtn title="Desain baru" onClick={newProject}>
          <RotateCcw className="h-4 w-4" />
        </IconBtn>
        <IconBtn title="Undo (Ctrl+Z)" disabled={!past.length} onClick={undo}>
          <Undo2 className="h-4 w-4" />
        </IconBtn>
        <IconBtn title="Redo (Ctrl+Shift+Z)" disabled={!future.length} onClick={redo}>
          <Redo2 className="h-4 w-4" />
        </IconBtn>
        <IconBtn title="Unduh desain PNG" onClick={onExportDesign}>
          <Download className="h-4 w-4" />
        </IconBtn>
      </div>

      <div className="mx-auto flex items-center gap-2">
        <div className="hidden items-center gap-1 rounded-full border border-white/8 bg-white/4 px-1 py-1 md:flex">
          {VIEWS.filter((v) => hasSleeves(garmentType) || v === "front" || v === "back").map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                view === v ? "bg-white text-[#111]" : "text-white/50 hover:text-white"
              }`}
            >
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-full border border-white/8 bg-white/4 px-1 py-1">
          {SIZE_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={`min-w-8 rounded-full px-2 py-1 text-[11px] font-semibold transition ${
                size === s ? "bg-[var(--accent)] text-[#111]" : "text-white/50 hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="hidden items-center gap-1 rounded-full border border-white/8 bg-white/4 px-1.5 py-1 xl:flex">
          {GARMENT_COLORS.slice(0, 8).map((c) => (
            <button
              key={c.hex}
              type="button"
              title={c.name}
              onClick={() => setGarmentColor(c.hex)}
              className={`h-5 w-5 rounded-full border ${
                garmentColor.toLowerCase() === c.hex.toLowerCase()
                  ? "ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[#0e1016]"
                  : "border-white/15"
              }`}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden text-right lg:block">
          <div className="text-[11px] font-medium text-white/70">{GARMENT_LABEL[garmentType]} · {size}</div>
          <div className="text-[10px] text-white/35">
            Bidang baju {layout.width.toFixed(0)} × {layout.height.toFixed(0)} cm
          </div>
        </div>
        <IconBtn title="Pintasan" onClick={onHelp}>
          <HelpCircle className="h-4 w-4" />
        </IconBtn>
        <button
          type="button"
          onClick={generate}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-[12px] font-semibold text-[#111] shadow-[0_0_24px_rgba(232,255,71,0.25)] transition hover:brightness-110"
        >
          <Box className="h-4 w-4" />
          Generate 3D
        </button>
      </div>
    </header>
  );
}

function useGenerate() {
  const setGenerating = useEditor((s) => s.setGenerating);
  const setStudioOpen = useEditor((s) => s.setStudioOpen);

  return async () => {
    setStudioOpen(true);
    setGenerating(true, 8);
    const ticks = [18, 34, 52, 70, 86, 100];
    for (const t of ticks) {
      await new Promise((r) => setTimeout(r, 220));
      setGenerating(true, t);
    }
    setGenerating(false, 100);
  };
}
