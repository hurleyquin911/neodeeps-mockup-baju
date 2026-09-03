"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { bakeDesign } from "@/lib/editor/bake";
import { buildGarmentLayout } from "@/lib/editor/garment";
import { useEditor } from "@/lib/editor/store";
import { Inspector } from "./Inspector";
import { LeftPanel } from "./LeftPanel";
import { ToolRail } from "./ToolRail";
import { TopBar } from "./TopBar";

const CanvasWorkspace = dynamic(() => import("./CanvasWorkspace"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center text-[12px] text-white/35">Memuat kanvas…</div>
  ),
});

const GenerateStudio = dynamic(() => import("./GenerateStudio"), { ssr: false });

const SHORTCUTS = [
  ["V", "Pilih"],
  ["H", "Geser kanvas"],
  ["T", "Teks"],
  ["U", "Bentuk"],
  ["B", "Kuas"],
  ["P", "Pena"],
  ["E", "Penghapus"],
  ["Z", "Zoom"],
  ["Ctrl+Z", "Undo"],
  ["Ctrl+Shift+Z", "Redo"],
  ["Ctrl+D", "Duplikat"],
  ["Ctrl+A", "Pilih semua"],
  ["Ctrl+G", "Grup"],
  ["Ctrl+Shift+G", "Pecah grup"],
  ["Delete", "Hapus"],
  ["Panah", "Geser 0.1 cm"],
  ["Shift+Panah", "Geser 1 cm"],
  ["Ctrl+0", "Fit zoom"],
  ["Spasi", "Geser (tahan)"],
];

export default function EditorApp() {
  const [help, setHelp] = useState(false);

  const onExportDesign = useCallback(async () => {
    const s = useEditor.getState();
    const layout = buildGarmentLayout(s.garmentType, s.size);
    const canvas = await bakeDesign(s.objectsByView[s.view], layout.print[s.view]);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `desain-${s.view}-${s.size}.png`;
    a.click();
  }, []);

  useEffect(() => {
    const prevTool = { current: useEditor.getState().tool };
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable;
      const meta = e.ctrlKey || e.metaKey;
      const store = useEditor.getState();

      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) store.redo();
        else store.undo();
        return;
      }
      if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        store.duplicateSelected();
        return;
      }
      if (meta && e.key.toLowerCase() === "a") {
        e.preventDefault();
        store.selectAll();
        return;
      }
      if (meta && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (e.shiftKey) store.ungroupSelected();
        else store.groupSelected();
        return;
      }
      if (meta && e.key === "0") {
        e.preventDefault();
        store.setZoom(1);
        return;
      }
      if (meta && e.key === "s") {
        e.preventDefault();
        void onExportDesign();
        return;
      }
      if (typing) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        store.deleteSelected();
      }
      if (e.key === "Escape") {
        store.deselect();
        store.setEditingTextId(null);
      }
      if (e.key === "?" || (e.shiftKey && e.key === "/")) setHelp(true);
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        prevTool.current = useEditor.getState().tool;
        useEditor.setState({ tool: "pan" });
      }
      const map: Record<string, () => void> = {
        v: () => store.setTool("select"),
        h: () => store.setTool("pan"),
        t: () => store.setTool("text"),
        u: () => store.setTool("shape"),
        b: () => store.setTool("draw"),
        p: () => store.setTool("pen"),
        e: () => store.setTool("eraser"),
        c: () => store.setTool("crop"),
        y: () => store.setTool("eyedropper"),
        z: () => store.setTool("zoom"),
      };
      const fn = map[e.key.toLowerCase()];
      if (fn && !meta) fn();

      const nudge = e.shiftKey ? 1 : 0.1;
      const ids = store.selectedIds;
      if (!ids.length) return;
      const move = (dx: number, dy: number) => {
        e.preventDefault();
        store.commit();
        ids.forEach((id) => {
          const o = store.objects().find((x) => x.id === id);
          if (o && !o.locked) store.updateObject(id, { x: o.x + dx, y: o.y + dy }, { history: false });
        });
      };
      if (e.key === "ArrowLeft") move(-nudge, 0);
      if (e.key === "ArrowRight") move(nudge, 0);
      if (e.key === "ArrowUp") move(0, -nudge);
      if (e.key === "ArrowDown") move(0, nudge);
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "Space") useEditor.setState({ tool: prevTool.current });
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onUp);
    };
  }, [onExportDesign]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#07080c] text-white">
      <TopBar onHelp={() => setHelp(true)} onExportDesign={() => void onExportDesign()} />
      <div className="flex min-h-0 flex-1">
        <ToolRail />
        <LeftPanel />
        <CanvasWorkspace />
        <aside className="flex w-[300px] shrink-0 flex-col border-l border-white/8 bg-[#101218]">
          <Inspector />
        </aside>
      </div>
      <GenerateStudio />
      {help && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={() => setHelp(false)}>
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#141821] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">Pintasan keyboard</h2>
              <button type="button" className="text-white/40 hover:text-white" onClick={() => setHelp(false)}>
                Tutup
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12px]">
              {SHORTCUTS.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-white/5 py-1">
                  <span className="text-white/45">{v}</span>
                  <kbd className="rounded bg-white/8 px-1.5 font-mono text-[10px] text-white/80">{k}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
