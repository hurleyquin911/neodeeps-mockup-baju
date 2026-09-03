"use client";

import { create } from "zustand";
import { CLIPART } from "./clipart";
import { buildGarmentLayout, hasSleeves } from "./garment";
import { uid } from "./ids";
import {
  createBaseObject,
  DEFAULT_FILTERS,
  type AlignDir,
  type BlendMode,
  type BrushSettings,
  type CanvasObject,
  type GarmentType,
  type PrintView,
  type ShapeKind,
  type SizeCode,
  type Tool,
  type Unit,
} from "./types";

export type LeftTab = "produk" | "teks" | "unggah" | "bentuk" | "gambar" | "template";

type HistorySnap = {
  objectsByView: Record<PrintView, CanvasObject[]>;
  garmentType: GarmentType;
  size: SizeCode;
  garmentColor: string;
};

type EditorState = {
  garmentType: GarmentType;
  size: SizeCode;
  garmentColor: string;
  view: PrintView;
  objectsByView: Record<PrintView, CanvasObject[]>;
  selectedIds: string[];
  tool: Tool;
  shapeKind: ShapeKind;
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  showRulers: boolean;
  snap: boolean;
  showGuides: boolean;
  unit: Unit;
  leftTab: LeftTab;
  brush: BrushSettings;
  editingTextId: string | null;
  studioOpen: boolean;
  generating: boolean;
  generateProgress: number;
  mannequinHeight: number;
  showMannequin: boolean;
  showDimensions: boolean;
  autoRotate: boolean;
  past: HistorySnap[];
  future: HistorySnap[];
};

type EditorActions = {
  setTool: (tool: Tool) => void;
  setView: (view: PrintView) => void;
  setSize: (size: SizeCode) => void;
  setGarmentType: (type: GarmentType) => void;
  setGarmentColor: (color: string) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleSnap: () => void;
  toggleGuides: () => void;
  setUnit: (unit: Unit) => void;
  setLeftTab: (tab: LeftTab) => void;
  setShapeKind: (kind: ShapeKind) => void;
  setBrush: (patch: Partial<BrushSettings>) => void;
  setEditingTextId: (id: string | null) => void;
  objects: () => CanvasObject[];
  selected: () => CanvasObject[];
  commit: () => void;
  undo: () => void;
  redo: () => void;
  addObject: (obj: CanvasObject, opts?: { select?: boolean }) => void;
  addText: (preset?: "heading" | "sub" | "body") => void;
  addShape: (kind?: ShapeKind, at?: { x: number; y: number }) => void;
  addImageFromFile: (file: File, at?: { x: number; y: number }) => void;
  addClipart: (id: string) => void;
  addPath: (obj: CanvasObject) => void;
  applyTemplate: (id: string) => void;
  updateObject: (id: string, patch: Partial<CanvasObject>, opts?: { history?: boolean }) => void;
  updateSelected: (patch: Partial<CanvasObject>) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  select: (ids: string[], additive?: boolean) => void;
  selectAll: () => void;
  deselect: () => void;
  reorder: (id: string, dir: "front" | "back" | "forward" | "backward") => void;
  alignSelected: (dir: AlignDir) => void;
  distributeSelected: (axis: "x" | "y") => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  newProject: () => void;
  setStudioOpen: (open: boolean) => void;
  setGenerating: (v: boolean, progress?: number) => void;
  setMannequinHeight: (h: number) => void;
  toggleMannequin: () => void;
  toggleDimensions: () => void;
  toggleAutoRotate: () => void;
  setBlend: (blend: BlendMode) => void;
};

const emptyViews = (): Record<PrintView, CanvasObject[]> => ({
  front: [],
  back: [],
  sleeveLeft: [],
  sleeveRight: [],
});

function snapOf(s: EditorState): HistorySnap {
  return {
    objectsByView: structuredClone(s.objectsByView),
    garmentType: s.garmentType,
    size: s.size,
    garmentColor: s.garmentColor,
  };
}

function mapView(
  objectsByView: Record<PrintView, CanvasObject[]>,
  view: PrintView,
  fn: (list: CanvasObject[]) => CanvasObject[],
) {
  return { ...objectsByView, [view]: fn(objectsByView[view]) };
}

export const useEditor = create<EditorState & EditorActions>((set, get) => ({
  garmentType: "tshirt",
  size: "M",
  garmentColor: "#F4F1EA",
  view: "front",
  objectsByView: emptyViews(),
  selectedIds: [],
  tool: "select",
  shapeKind: "rect",
  zoom: 1,
  panX: 0,
  panY: 0,
  showGrid: true,
  showRulers: true,
  snap: true,
  showGuides: true,
  unit: "cm",
  leftTab: "produk",
  brush: { size: 0.45, color: "#111111", opacity: 1, tension: 0.35 },
  editingTextId: null,
  studioOpen: false,
  generating: false,
  generateProgress: 0,
  mannequinHeight: 170,
  showMannequin: false,
  showDimensions: false,
  autoRotate: false,
  past: [],
  future: [],

  objects: () => get().objectsByView[get().view],
  selected: () => {
    const ids = new Set(get().selectedIds);
    return get().objects().filter((o) => ids.has(o.id));
  },

  commit: () =>
    set((s) => ({
      past: [...s.past, snapOf(s)].slice(-50),
      future: [],
    })),

  undo: () =>
    set((s) => {
      const prev = s.past[s.past.length - 1];
      if (!prev) return s;
      return {
        ...s,
        ...prev,
        past: s.past.slice(0, -1),
        future: [snapOf(s), ...s.future].slice(0, 50),
        selectedIds: [],
      };
    }),

  redo: () =>
    set((s) => {
      const next = s.future[0];
      if (!next) return s;
      return {
        ...s,
        ...next,
        future: s.future.slice(1),
        past: [...s.past, snapOf(s)].slice(-50),
        selectedIds: [],
      };
    }),

  setTool: (tool) =>
    set({
      tool,
      leftTab:
        tool === "text"
          ? "teks"
          : tool === "image"
            ? "unggah"
            : tool === "shape"
              ? "bentuk"
              : tool === "draw" || tool === "pen" || tool === "eraser"
                ? "gambar"
                : get().leftTab,
    }),
  setView: (view) => set({ view, selectedIds: [], editingTextId: null }),
  setSize: (size) => {
    get().commit();
    set({ size });
  },
  setGarmentType: (garmentType) => {
    get().commit();
    const view = !hasSleeves(garmentType) && (get().view === "sleeveLeft" || get().view === "sleeveRight")
      ? "front"
      : get().view;
    set({ garmentType, view });
  },
  setGarmentColor: (garmentColor) => set({ garmentColor }),
  setZoom: (zoom) => set({ zoom: Math.min(4, Math.max(0.25, zoom)) }),
  setPan: (panX, panY) => set({ panX, panY }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleRulers: () => set((s) => ({ showRulers: !s.showRulers })),
  toggleSnap: () => set((s) => ({ snap: !s.snap })),
  toggleGuides: () => set((s) => ({ showGuides: !s.showGuides })),
  setUnit: (unit) => set({ unit }),
  setLeftTab: (leftTab) => set({ leftTab }),
  setShapeKind: (shapeKind) => set({ shapeKind, tool: "shape", leftTab: "bentuk" }),
  setBrush: (patch) => set((s) => ({ brush: { ...s.brush, ...patch } })),
  setEditingTextId: (editingTextId) => set({ editingTextId }),

  addObject: (obj, opts) => {
    get().commit();
    set((s) => ({
      objectsByView: mapView(s.objectsByView, s.view, (list) => [...list, obj]),
      selectedIds: opts?.select === false ? s.selectedIds : [obj.id],
      tool: "select",
    }));
  },

  addText: (preset = "heading") => {
    const layout = buildGarmentLayout(get().garmentType, get().size);
    const print = layout.print[get().view];
    const map = {
      heading: { text: "KAOS KU", fontSize: 64, fontFamily: "Bebas Neue", width: Math.min(24, print.width - 4), height: 6 },
      sub: { text: "Limited Edition", fontSize: 28, fontFamily: "Playfair Display", width: 18, height: 4 },
      body: { text: "Tulis teks di sini", fontSize: 18, fontFamily: "Inter", width: 16, height: 5 },
    }[preset];
    const obj = createBaseObject({
      id: uid(),
      type: "text",
      name: "Teks",
      x: (print.width - map.width) / 2,
      y: print.height * 0.32,
      width: map.width,
      height: map.height,
      text: map.text,
      fontFamily: map.fontFamily,
      fontSize: map.fontSize,
      fontBold: preset === "heading",
      textAlign: "center",
      lineHeight: 1.15,
      letterSpacing: preset === "heading" ? 2 : 0,
      fill: get().garmentColor.toLowerCase() === "#1a1a1a" ? "#F4F1EA" : "#111111",
    });
    get().addObject(obj);
    get().setEditingTextId(obj.id);
  },

  addShape: (kind, at) => {
    const shape = kind ?? get().shapeKind;
    const layout = buildGarmentLayout(get().garmentType, get().size);
    const print = layout.print[get().view];
    const w = shape === "line" || shape === "arrow" ? 12 : 8;
    const h = shape === "line" || shape === "arrow" ? 1.2 : 8;
    const obj = createBaseObject({
      id: uid(),
      type: "shape",
      name: shape,
      shape,
      x: at?.x ?? (print.width - w) / 2,
      y: at?.y ?? (print.height - h) / 2,
      width: w,
      height: h,
      fill: shape === "line" || shape === "arrow" ? "#111111" : "#111111",
      stroke: "transparent",
      strokeWidth: shape === "line" || shape === "arrow" ? 4 : 0,
      cornerRadius: 1.2,
      sides: shape === "star" ? 5 : 6,
      pointerLength: 1.6,
    });
    get().addObject(obj);
  },

  addImageFromFile: (file, at) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      const img = new Image();
      img.onload = () => {
        const layout = buildGarmentLayout(get().garmentType, get().size);
        const print = layout.print[get().view];
        const maxW = Math.min(16, print.width * 0.7);
        const ratio = img.height / img.width;
        const width = maxW;
        const height = maxW * ratio;
        const obj = createBaseObject({
          id: uid(),
          type: "image",
          name: file.name.replace(/\.[^.]+$/, "") || "Gambar",
          src,
          naturalWidth: img.width,
          naturalHeight: img.height,
          x: at?.x ?? (print.width - width) / 2,
          y: at?.y ?? (print.height - height) / 2,
          width,
          height,
          fill: "transparent",
          filters: { ...DEFAULT_FILTERS },
          cropL: 0,
          cropT: 0,
          cropR: 0,
          cropB: 0,
        });
        get().addObject(obj);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  },

  addClipart: (id) => {
    const item = CLIPART.find((c) => c.id === id);
    if (!item) return;
    const layout = buildGarmentLayout(get().garmentType, get().size);
    const print = layout.print[get().view];
    const size = 8;
    get().addObject(
      createBaseObject({
        id: uid(),
        type: "path",
        name: item.name,
        pathD: item.d,
        viewBox: item.viewBox,
        x: (print.width - size) / 2,
        y: (print.height - size) / 2,
        width: size,
        height: size,
        fill: "#111111",
      }),
    );
  },

  addPath: (obj) => get().addObject(obj, { select: true }),

  applyTemplate: (id) => {
    const layout = buildGarmentLayout(get().garmentType, get().size);
    const print = layout.print[get().view];
    const dark = get().garmentColor.toLowerCase() === "#1a1a1a";
    const ink = dark ? "#F4F1EA" : "#111111";
    get().commit();
    const mk = (): CanvasObject[] => {
      if (id === "center-logo") {
        return [
          createBaseObject({
            id: uid(), type: "text", name: "Brand",
            x: 3, y: print.height * 0.28, width: print.width - 6, height: 7,
            text: "STUDIO", fontFamily: "Bebas Neue", fontSize: 72, fontBold: true,
            textAlign: "center", fill: ink, letterSpacing: 6,
          }),
          createBaseObject({
            id: uid(), type: "shape", name: "Garis", shape: "line",
            x: print.width * 0.25, y: print.height * 0.46, width: print.width * 0.5, height: 0.8,
            fill: ink, stroke: ink, strokeWidth: 3,
          }),
          createBaseObject({
            id: uid(), type: "text", name: "Tagline",
            x: 4, y: print.height * 0.5, width: print.width - 8, height: 3,
            text: "EST. 2026", fontFamily: "Oswald", fontSize: 16, textAlign: "center",
            fill: ink, letterSpacing: 8,
          }),
        ];
      }
      if (id === "left-chest") {
        return [
          createBaseObject({
            id: uid(), type: "text", name: "Monogram",
            x: print.width * 0.12, y: 2.2, width: 8, height: 4,
            text: "SK", fontFamily: "Playfair Display", fontSize: 28, fontBold: true,
            textAlign: "left", fill: ink,
          }),
        ];
      }
      if (id === "badge") {
        return [
          createBaseObject({
            id: uid(), type: "shape", name: "Badge", shape: "ellipse",
            x: (print.width - 12) / 2, y: print.height * 0.22, width: 12, height: 12,
            fill: "transparent", stroke: ink, strokeWidth: 6,
          }),
          createBaseObject({
            id: uid(), type: "text", name: "Badge teks",
            x: (print.width - 10) / 2, y: print.height * 0.34, width: 10, height: 5,
            text: "ORIGINAL\nGOODS", fontFamily: "Oswald", fontSize: 18, textAlign: "center",
            fill: ink, lineHeight: 1.2, fontBold: true,
          }),
        ];
      }
      return [
        createBaseObject({
          id: uid(), type: "text", name: "Quote",
          x: 3, y: print.height * 0.3, width: print.width - 6, height: 10,
          text: "Wear\nyour story", fontFamily: "Playfair Display", fontSize: 42,
          fontItalic: true, textAlign: "center", fill: ink, lineHeight: 1.1,
        }),
      ];
    };
    set((s) => ({
      objectsByView: mapView(s.objectsByView, s.view, () => mk()),
      selectedIds: [],
      tool: "select",
    }));
  },

  updateObject: (id, patch, opts) => {
    if (opts?.history !== false) get().commit();
    set((s) => ({
      objectsByView: mapView(s.objectsByView, s.view, (list) =>
        list.map((o) => (o.id === id ? { ...o, ...patch } : o)),
      ),
    }));
  },

  updateSelected: (patch) => {
    const ids = get().selectedIds;
    if (!ids.length) return;
    get().commit();
    const setIds = new Set(ids);
    set((s) => ({
      objectsByView: mapView(s.objectsByView, s.view, (list) =>
        list.map((o) => (setIds.has(o.id) ? { ...o, ...patch } : o)),
      ),
    }));
  },

  deleteSelected: () => {
    const ids = new Set(get().selectedIds);
    if (!ids.size) return;
    get().commit();
    set((s) => ({
      objectsByView: mapView(s.objectsByView, s.view, (list) => list.filter((o) => !ids.has(o.id))),
      selectedIds: [],
      editingTextId: null,
    }));
  },

  duplicateSelected: () => {
    const selected = get().selected();
    if (!selected.length) return;
    get().commit();
    const clones = selected.map((o) => ({
      ...structuredClone(o),
      id: uid(),
      name: `${o.name} salinan`,
      x: o.x + 0.8,
      y: o.y + 0.8,
    }));
    set((s) => ({
      objectsByView: mapView(s.objectsByView, s.view, (list) => [...list, ...clones]),
      selectedIds: clones.map((c) => c.id),
    }));
  },

  select: (ids, additive) =>
    set((s) => ({
      selectedIds: additive ? [...new Set([...s.selectedIds, ...ids])] : ids,
      editingTextId: null,
    })),
  selectAll: () => set((s) => ({ selectedIds: s.objectsByView[s.view].filter((o) => !o.locked).map((o) => o.id) })),
  deselect: () => set({ selectedIds: [], editingTextId: null }),

  reorder: (id, dir) => {
    get().commit();
    set((s) => ({
      objectsByView: mapView(s.objectsByView, s.view, (list) => {
        const i = list.findIndex((o) => o.id === id);
        if (i < 0) return list;
        const next = [...list];
        const [item] = next.splice(i, 1);
        if (dir === "front") next.push(item);
        else if (dir === "back") next.unshift(item);
        else if (dir === "forward") next.splice(Math.min(i + 1, next.length), 0, item);
        else next.splice(Math.max(i - 1, 0), 0, item);
        return next;
      }),
    }));
  },

  alignSelected: (dir) => {
    const layout = buildGarmentLayout(get().garmentType, get().size);
    const print = layout.print[get().view];
    const items = get().selected().filter((o) => !o.locked);
    if (!items.length) return;
    get().commit();
    let bx: number;
    let by: number;
    let bw: number;
    let bh: number;
    if (items.length === 1) {
      bx = 0;
      by = 0;
      bw = print.width;
      bh = print.height;
    } else {
      bx = Math.min(...items.map((o) => o.x));
      by = Math.min(...items.map((o) => o.y));
      bw = Math.max(...items.map((o) => o.x + o.width)) - bx;
      bh = Math.max(...items.map((o) => o.y + o.height)) - by;
    }
    const patch: Record<string, Partial<CanvasObject>> = {};
    for (const o of items) {
      const p: Partial<CanvasObject> = {};
      if (dir === "left") p.x = bx;
      if (dir === "right") p.x = bx + bw - o.width;
      if (dir === "centerX") p.x = bx + (bw - o.width) / 2;
      if (dir === "top") p.y = by;
      if (dir === "bottom") p.y = by + bh - o.height;
      if (dir === "centerY") p.y = by + (bh - o.height) / 2;
      patch[o.id] = p;
    }
    set((s) => ({
      objectsByView: mapView(s.objectsByView, s.view, (list) =>
        list.map((o) => (patch[o.id] ? { ...o, ...patch[o.id] } : o)),
      ),
    }));
  },

  distributeSelected: (axis) => {
    const items = [...get().selected().filter((o) => !o.locked)].sort((a, b) =>
      axis === "x" ? a.x - b.x : a.y - b.y,
    );
    if (items.length < 3) return;
    get().commit();
    const first = items[0];
    const last = items[items.length - 1];
    const start = axis === "x" ? first.x : first.y;
    const end = axis === "x" ? last.x + last.width : last.y + last.height;
    const totalSize = items.reduce((s, o) => s + (axis === "x" ? o.width : o.height), 0);
    const gap = (end - start - totalSize) / (items.length - 1);
    let cursor = start;
    const patch: Record<string, Partial<CanvasObject>> = {};
    for (const o of items) {
      if (axis === "x") patch[o.id] = { x: cursor };
      else patch[o.id] = { y: cursor };
      cursor += (axis === "x" ? o.width : o.height) + gap;
    }
    set((s) => ({
      objectsByView: mapView(s.objectsByView, s.view, (list) =>
        list.map((o) => (patch[o.id] ? { ...o, ...patch[o.id] } : o)),
      ),
    }));
  },

  groupSelected: () => {
    const items = get().selected().filter((o) => !o.locked);
    if (items.length < 2) return;
    get().commit();
    const ids = new Set(items.map((o) => o.id));
    const minX = Math.min(...items.map((o) => o.x));
    const minY = Math.min(...items.map((o) => o.y));
    const maxX = Math.max(...items.map((o) => o.x + o.width));
    const maxY = Math.max(...items.map((o) => o.y + o.height));
    const group = createBaseObject({
      id: uid(),
      type: "group",
      name: "Grup",
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      fill: "transparent",
      children: items.map((o) => ({ ...o, x: o.x - minX, y: o.y - minY })),
    });
    set((s) => ({
      objectsByView: mapView(s.objectsByView, s.view, (list) => [
        ...list.filter((o) => !ids.has(o.id)),
        group,
      ]),
      selectedIds: [group.id],
    }));
  },

  ungroupSelected: () => {
    const groups = get().selected().filter((o) => o.type === "group" && o.children?.length);
    if (!groups.length) return;
    get().commit();
    const gids = new Set(groups.map((g) => g.id));
    const exploded: CanvasObject[] = [];
    for (const g of groups) {
      for (const c of g.children ?? []) {
        exploded.push({ ...c, id: uid(), x: c.x + g.x, y: c.y + g.y, rotation: (c.rotation ?? 0) + g.rotation });
      }
    }
    set((s) => ({
      objectsByView: mapView(s.objectsByView, s.view, (list) => [
        ...list.filter((o) => !gids.has(o.id)),
        ...exploded,
      ]),
      selectedIds: exploded.map((o) => o.id),
    }));
  },

  newProject: () => {
    get().commit();
    set({
      objectsByView: emptyViews(),
      selectedIds: [],
      view: "front",
      zoom: 1,
      editingTextId: null,
      studioOpen: false,
    });
  },

  setStudioOpen: (studioOpen) => set({ studioOpen }),
  setGenerating: (generating, generateProgress = 0) => set({ generating, generateProgress }),
  setMannequinHeight: (mannequinHeight) => set({ mannequinHeight }),
  toggleMannequin: () => set((s) => ({ showMannequin: !s.showMannequin })),
  toggleDimensions: () => set((s) => ({ showDimensions: !s.showDimensions })),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  setBlend: (blendMode) => get().updateSelected({ blendMode }),
}));

export function currentPrintArea() {
  const { garmentType, size, view } = useEditor.getState();
  return buildGarmentLayout(garmentType, size).print[view];
}

export function currentLayout() {
  const { garmentType, size } = useEditor.getState();
  return buildGarmentLayout(garmentType, size);
}
