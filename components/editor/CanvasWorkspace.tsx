"use client";

import Konva from "konva";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Rect,
  Text,
  Image as KImage,
  Transformer,
  Line,
  Arrow,
  Star,
  RegularPolygon,
  Ellipse,
  Path,
  Group,
  Circle,
} from "react-konva";
import { buildGarmentLayout, luminance, ptToPx, scalePath } from "@/lib/editor/garment";
import { uid } from "@/lib/editor/ids";
import { useEditor } from "@/lib/editor/store";
import { createBaseObject, type CanvasObject } from "@/lib/editor/types";
import { GarmentSvg } from "./GarmentSvg";

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ w: 900, h: 720 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  return { ref, size };
}

function useHtmlImage(src?: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [current, setCurrent] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!src) return;
    let live = true;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!live) return;
      setImage(img);
      setCurrent(src);
    };
    img.src = src;
    return () => {
      live = false;
    };
  }, [src]);
  return src && current === src ? image : null;
}

function displayText(obj: CanvasObject) {
  const raw = obj.text ?? "";
  if (obj.textTransform === "uppercase") return raw.toUpperCase();
  if (obj.textTransform === "lowercase") return raw.toLowerCase();
  return raw;
}

export default function CanvasWorkspace() {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const fileRef = useRef<HTMLInputElement>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const nodeMap = useRef<Map<string, Konva.Node>>(new Map());
  const drawingId = useRef<string | null>(null);
  const [penPts, setPenPts] = useState<number[]>([]);
  const [guides, setGuides] = useState<{ x?: number; y?: number }>({});
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  const garmentType = useEditor((s) => s.garmentType);
  const sizeCode = useEditor((s) => s.size);
  const color = useEditor((s) => s.garmentColor);
  const view = useEditor((s) => s.view);
  const objects = useEditor((s) => s.objectsByView[s.view]);
  const selectedIds = useEditor((s) => s.selectedIds);
  const tool = useEditor((s) => s.tool);
  const zoom = useEditor((s) => s.zoom);
  const panX = useEditor((s) => s.panX);
  const panY = useEditor((s) => s.panY);
  const showGrid = useEditor((s) => s.showGrid);
  const showRulers = useEditor((s) => s.showRulers);
  const snap = useEditor((s) => s.snap);
  const showGuides = useEditor((s) => s.showGuides);
  const unit = useEditor((s) => s.unit);
  const brush = useEditor((s) => s.brush);
  const editingTextId = useEditor((s) => s.editingTextId);

  const setZoom = useEditor((s) => s.setZoom);
  const setPan = useEditor((s) => s.setPan);
  const select = useEditor((s) => s.select);
  const deselect = useEditor((s) => s.deselect);
  const commit = useEditor((s) => s.commit);
  const updateObject = useEditor((s) => s.updateObject);
  const addObject = useEditor((s) => s.addObject);
  const addText = useEditor((s) => s.addText);
  const addShape = useEditor((s) => s.addShape);
  const addImageFromFile = useEditor((s) => s.addImageFromFile);
  const setTool = useEditor((s) => s.setTool);
  const setEditingTextId = useEditor((s) => s.setEditingTextId);
  const shapeKind = useEditor((s) => s.shapeKind);

  const layout = useMemo(() => buildGarmentLayout(garmentType, sizeCode), [garmentType, sizeCode]);
  const print = layout.print[view];
  const fit = Math.min((size.w - 72) / layout.width, (size.h - 72) / layout.height);
  const px = Math.max(4, fit * zoom);
  const gw = layout.width * px;
  const gh = layout.height * px;
  const ox = (size.w - gw) / 2 + panX;
  const oy = (size.h - gh) / 2 + panY;
  const sx = ox + print.x * px;
  const sy = oy + print.y * px;
  const sw = print.width * px;
  const sh = print.height * px;
  const light = luminance(color) > 0.62;

  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const nodes = selectedIds
      .map((id) => nodeMap.current.get(id))
      .filter((n): n is Konva.Node => !!n && n.getAttr("locked") !== true);
    tr.nodes(tool === "select" || tool === "crop" ? nodes : []);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, objects, tool, px]);

  const toCm = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    return { x: pos.x / px, y: pos.y / px };
  }, [px]);

  const applySnap = (obj: CanvasObject, x: number, y: number) => {
    if (!snap) return { x, y, gx: undefined as number | undefined, gy: undefined as number | undefined };
    const thr = 0.3;
    let nx = x;
    let ny = y;
    let gx: number | undefined;
    let gy: number | undefined;
    const cx = x + obj.width / 2;
    const cy = y + obj.height / 2;
    if (Math.abs(cx - print.width / 2) < thr) {
      nx = print.width / 2 - obj.width / 2;
      gx = print.width / 2;
    }
    if (Math.abs(cy - print.height / 2) < thr) {
      ny = print.height / 2 - obj.height / 2;
      gy = print.height / 2;
    }
    if (Math.abs(x) < thr) {
      nx = 0;
      gx = 0;
    }
    if (Math.abs(y) < thr) {
      ny = 0;
      gy = 0;
    }
    for (const o of objects) {
      if (o.id === obj.id) continue;
      if (Math.abs(o.x - x) < thr) {
        nx = o.x;
        gx = o.x;
      }
      if (Math.abs(o.y - y) < thr) {
        ny = o.y;
        gy = o.y;
      }
    }
    return { x: nx, y: ny, gx, gy };
  };

  const onStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const isEmpty = e.target === stage;
    const p = toCm(e);

    if (tool === "select") {
      if (isEmpty) deselect();
      return;
    }
    if (tool === "text" && isEmpty) {
      addText("body");
      const last = useEditor.getState().selected()[0];
      if (last) updateObject(last.id, { x: p.x, y: p.y }, { history: false });
      return;
    }
    if (tool === "shape" && isEmpty) {
      addShape(shapeKind, { x: p.x, y: p.y });
      return;
    }
    if (tool === "image" && isEmpty) {
      fileRef.current?.click();
      return;
    }
    if (tool === "zoom") {
      setZoom(zoom * (e.evt.altKey ? 0.85 : 1.18));
      return;
    }
    if (tool === "eyedropper") {
      const fill = (e.target as Konva.Shape).attrs?.fill as string | undefined;
      const sel = useEditor.getState().selected()[0];
      if (sel && typeof fill === "string") updateObject(sel.id, { fill });
      else if (!sel && isEmpty) useEditor.getState().setGarmentColor(color);
      setTool("select");
      return;
    }
    if ((tool === "draw" || tool === "eraser") && isEmpty) {
      commit();
      const id = uid();
      drawingId.current = id;
      addObject(
        createBaseObject({
          id,
          type: "path",
          name: tool === "eraser" ? "Hapus" : "Kuas",
          x: 0,
          y: 0,
          width: print.width,
          height: print.height,
          fill: tool === "eraser" ? "#000000" : brush.color,
          opacity: tool === "eraser" ? 1 : brush.opacity,
          blendMode: tool === "eraser" ? "destination-out" : "source-over",
          points: [p.x, p.y],
          brushSize: brush.size,
          tension: brush.tension,
        }),
        { select: false },
      );
      return;
    }
    if (tool === "pen" && isEmpty) {
      setPenPts((prev) => [...prev, p.x, p.y]);
    }
  };

  const onStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const p = toCm(e);
    setCursor(p);
    const id = drawingId.current;
    if (!id) return;
    const obj = useEditor.getState().objects().find((o) => o.id === id);
    if (!obj?.points) return;
    updateObject(id, { points: [...obj.points, p.x, p.y] }, { history: false });
  };

  const onStageMouseUp = () => {
    drawingId.current = null;
  };

  useEffect(() => {
    const finishPen = (ev: KeyboardEvent) => {
      if (ev.key === "Enter" && penPts.length >= 4) {
        addObject(
          createBaseObject({
            id: uid(),
            type: "path",
            name: "Pena",
            x: 0,
            y: 0,
            width: print.width,
            height: print.height,
            fill: brush.color,
            points: penPts,
            closed: ev.shiftKey,
            brushSize: brush.size,
            stroke: brush.color,
            strokeWidth: 2,
          }),
        );
        setPenPts([]);
        setTool("select");
      }
      if (ev.key === "Escape") setPenPts([]);
    };
    window.addEventListener("keydown", finishPen);
    return () => window.removeEventListener("keydown", finishPen);
  }, [penPts, addObject, brush, print.width, print.height, setTool]);

  const panDrag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  return (
    <div className="relative min-w-0 flex-1 overflow-hidden bg-[#151821]">
      <div
        ref={ref}
        className="absolute inset-0"
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setZoom(zoom * (e.deltaY > 0 ? 0.93 : 1.07));
          }
        }}
        onMouseDown={(e) => {
          if (tool !== "pan" && e.button !== 1) return;
          panDrag.current = { x: e.clientX, y: e.clientY, px: panX, py: panY };
        }}
        onMouseMove={(e) => {
          if (!panDrag.current) return;
          setPan(panDrag.current.px + (e.clientX - panDrag.current.x), panDrag.current.py + (e.clientY - panDrag.current.y));
        }}
        onMouseUp={() => {
          panDrag.current = null;
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f?.type.startsWith("image/")) addImageFromFile(f);
        }}
        style={{ cursor: tool === "pan" ? "grab" : tool === "text" ? "text" : "default" }}
      >
        <div
          className="pointer-events-none absolute"
          style={{ left: ox, top: oy, width: gw, height: gh }}
        >
          <GarmentSvg layout={layout} color={color} view={view} className="h-full w-full" />
        </div>

        {showRulers && (
          <>
            <div className="pointer-events-none absolute left-0 right-0 top-0 h-6 bg-[#0c0e14]/80 text-[9px] text-white/35">
              {Array.from({ length: Math.ceil(print.width) + 1 }, (_, i) => (
                <span
                  key={i}
                  className="absolute top-0 border-l border-white/20 pl-0.5"
                  style={{ left: sx + i * px }}
                >
                  {i}
                </span>
              ))}
            </div>
            <div className="pointer-events-none absolute bottom-8 left-0 top-6 w-6 bg-[#0c0e14]/80 text-[9px] text-white/35">
              {Array.from({ length: Math.ceil(print.height) + 1 }, (_, i) => (
                <span
                  key={i}
                  className="absolute left-0 border-t border-white/20 pl-0.5"
                  style={{ top: sy + i * px }}
                >
                  {i}
                </span>
              ))}
            </div>
          </>
        )}

        {objects.length === 0 && (
          <div
            className="pointer-events-none absolute z-10 text-center text-[12px] text-white/35"
            style={{ left: sx, top: sy + sh / 2 - 20, width: sw }}
          >
            Klik T untuk teks · seret gambar ke sini · atau pilih template
          </div>
        )}
        <div
          className="absolute overflow-hidden"
          style={{
            left: sx,
            top: sy,
            width: sw,
            height: sh,
            clipPath: `path("${scalePath(layout.path, px)}")`,
          }}
        >
          <Stage
            width={Math.max(2, Math.round(sw))}
            height={Math.max(2, Math.round(sh))}
            onMouseDown={onStageMouseDown}
            onMouseMove={onStageMouseMove}
            onMouseUp={onStageMouseUp}
            onMouseLeave={onStageMouseUp}
          >
            <Layer>
              <Rect
                x={0}
                y={0}
                width={Math.max(2, Math.round(sw))}
                height={Math.max(2, Math.round(sh))}
                fill={color}
                listening={false}
              />
              {showGrid &&
                Array.from({ length: Math.ceil(print.width) }, (_, i) => (
                  <Line
                    key={`vx${i}`}
                    points={[i * px, 0, i * px, sh]}
                    stroke={light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)"}
                    strokeWidth={i % 5 === 0 ? 1 : 0.5}
                    listening={false}
                  />
                ))}
              {showGrid &&
                Array.from({ length: Math.ceil(print.height) }, (_, i) => (
                  <Line
                    key={`hy${i}`}
                    points={[0, i * px, sw, i * px]}
                    stroke={light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)"}
                    strokeWidth={i % 5 === 0 ? 1 : 0.5}
                    listening={false}
                  />
                ))}
              {objects.map((obj) => (
                <ObjectNode
                  key={obj.id}
                  obj={obj}
                  px={px}
                  tool={tool}
                  register={(n) => {
                    if (n) nodeMap.current.set(obj.id, n);
                    else nodeMap.current.delete(obj.id);
                  }}
                  onSelect={(shift) => {
                    if (tool !== "select" && tool !== "crop") return;
                    select([obj.id], shift);
                  }}
                  onDragStart={() => commit()}
                  onDragMove={(node) => {
                    const snapped = applySnap(obj, node.x() / px, node.y() / px);
                    node.x(snapped.x * px);
                    node.y(snapped.y * px);
                    if (showGuides) setGuides({ x: snapped.gx, y: snapped.gy });
                  }}
                  onDragEnd={(node) => {
                    updateObject(obj.id, { x: node.x() / px, y: node.y() / px }, { history: false });
                    setGuides({});
                  }}
                  onTransformEnd={(node) => {
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    const patch: Partial<CanvasObject> = {
                      x: node.x() / px,
                      y: node.y() / px,
                      rotation: node.rotation(),
                      width: Math.max(0.4, (node.width() * scaleX) / px),
                      height: Math.max(0.4, (node.height() * scaleY) / px),
                    };
                    if (obj.type === "text") {
                      patch.fontSize = Math.max(6, (obj.fontSize ?? 36) * scaleY);
                    }
                    updateObject(obj.id, patch);
                  }}
                  onDblClick={() => {
                    if (obj.type === "text") setEditingTextId(obj.id);
                  }}
                />
              ))}
              {penPts.length >= 2 && (
                <Line
                  points={penPts.map((v) => v * px)}
                  stroke={brush.color}
                  strokeWidth={brush.size * px}
                  lineCap="round"
                  lineJoin="round"
                  listening={false}
                />
              )}
              {showGuides && guides.x != null && (
                <Line points={[guides.x * px, 0, guides.x * px, sh]} stroke="#7dd3fc" strokeWidth={1} dash={[4, 4]} listening={false} />
              )}
              {showGuides && guides.y != null && (
                <Line points={[0, guides.y * px, sw, guides.y * px]} stroke="#7dd3fc" strokeWidth={1} dash={[4, 4]} listening={false} />
              )}
              <Transformer
                ref={trRef}
                rotateEnabled
                keepRatio={false}
                boundBoxFunc={(oldBox, newBox) => (newBox.width < 8 || newBox.height < 8 ? oldBox : newBox)}
                anchorFill="#e8ff47"
                anchorStroke="#111"
                borderStroke="#e8ff47"
              />
            </Layer>
          </Stage>
          {editingTextId &&
            objects.filter((o) => o.id === editingTextId && o.type === "text").map((o) => (
              <textarea
                key={o.id}
                autoFocus
                className="absolute resize-none bg-white/90 p-1 text-black outline-none"
                style={{
                  left: o.x * px,
                  top: o.y * px,
                  width: Math.max(80, o.width * px),
                  height: Math.max(32, o.height * px),
                  fontFamily: o.fontFamily,
                  fontSize: ptToPx(o.fontSize ?? 36, px),
                }}
                value={o.text}
                onChange={(e) => updateObject(o.id, { text: e.target.value }, { history: false })}
                onBlur={() => setEditingTextId(null)}
              />
            ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex h-8 items-center gap-3 border-t border-white/8 bg-[#0c0e14]/90 px-3 text-[10px] text-white/45">
        <button type="button" onClick={() => setZoom(1)} className="hover:text-white">
          Fit
        </button>
        <input
          type="range"
          min={0.25}
          max={4}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(e.target.valueAsNumber)}
          className="studio-range w-28"
        />
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => useEditor.getState().toggleGrid()} className={showGrid ? "text-[var(--accent)]" : ""}>
          Grid
        </button>
        <button type="button" onClick={() => useEditor.getState().toggleRulers()} className={showRulers ? "text-[var(--accent)]" : ""}>
          Ruler
        </button>
        <button type="button" onClick={() => useEditor.getState().toggleSnap()} className={snap ? "text-[var(--accent)]" : ""}>
          Snap
        </button>
        <span className="text-white/25">|</span>
        <span>
          Kursor {cursor.x.toFixed(1)}, {cursor.y.toFixed(1)} {unit}
        </span>
        <span className="ml-auto">
          Area baju {layout.width.toFixed(1)} × {layout.height.toFixed(1)} cm · {px.toFixed(1)} px/cm
        </span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) addImageFromFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function ObjectNode({
  obj,
  px,
  tool,
  register,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd,
  onDblClick,
}: {
  obj: CanvasObject;
  px: number;
  tool: string;
  register: (n: Konva.Node | null) => void;
  onSelect: (shift: boolean) => void;
  onDragStart: () => void;
  onDragMove: (n: Konva.Node) => void;
  onDragEnd: (n: Konva.Node) => void;
  onTransformEnd: (n: Konva.Node) => void;
  onDblClick: () => void;
}) {
  const common = {
    id: obj.id,
    x: obj.x * px,
    y: obj.y * px,
    width: obj.width * px,
    height: obj.height * px,
    rotation: obj.rotation,
    opacity: obj.opacity,
    visible: obj.visible,
    listening: !obj.locked && (tool === "select" || tool === "crop" || tool === "eyedropper"),
    draggable: !obj.locked && tool === "select",
    locked: obj.locked,
    globalCompositeOperation: obj.blendMode as GlobalCompositeOperation,
    shadowEnabled: obj.shadowEnabled,
    shadowColor: obj.shadowColor,
    shadowBlur: obj.shadowBlur,
    shadowOffsetX: obj.shadowOffsetX,
    shadowOffsetY: obj.shadowOffsetY,
    shadowOpacity: obj.shadowOpacity,
    scaleX: obj.flipX ? -1 : 1,
    scaleY: obj.flipY ? -1 : 1,
    offsetX: obj.flipX ? obj.width * px : 0,
    offsetY: obj.flipY ? obj.height * px : 0,
    ref: (n: Konva.Node | null) => register(n),
    onClick: (e: Konva.KonvaEventObject<MouseEvent>) => onSelect(e.evt.shiftKey),
    onTap: () => onSelect(false),
    onDragStart,
    onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => onDragMove(e.target),
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => onDragEnd(e.target),
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => onTransformEnd(e.target),
    onDblClick,
  } as Record<string, unknown>;

  if (obj.type === "group" && obj.children) {
    return (
      <Group {...common} width={obj.width * px} height={obj.height * px}>
        {obj.children.map((c) => (
          <ObjectNode
            key={c.id}
            obj={c}
            px={px}
            tool="select"
            register={() => {}}
            onSelect={onSelect}
            onDragStart={() => {}}
            onDragMove={() => {}}
            onDragEnd={() => {}}
            onTransformEnd={() => {}}
            onDblClick={() => {}}
          />
        ))}
      </Group>
    );
  }

  if (obj.type === "text") {
    const fontStyle = `${obj.fontItalic ? "italic " : ""}${obj.fontBold ? "bold" : "normal"}`.trim();
    return (
      <Text
        {...common}
        text={displayText(obj)}
        fontFamily={obj.fontFamily ?? "Inter"}
        fontSize={ptToPx(obj.fontSize ?? 36, px)}
        fontStyle={fontStyle}
        textDecoration={obj.textDecoration}
        align={obj.textAlign ?? "center"}
        fill={obj.fill}
        stroke={obj.stroke === "transparent" ? undefined : obj.stroke}
        strokeWidth={obj.strokeWidth}
        letterSpacing={obj.letterSpacing}
        lineHeight={obj.lineHeight ?? 1.15}
      />
    );
  }

  if (obj.type === "image") {
    return <FilteredImage obj={obj} common={common} px={px} />;
  }

  if (obj.type === "path") {
    if (obj.pathD) {
      const vb = obj.viewBox ?? 24;
      return (
        <Group {...common}>
          <Path
            data={obj.pathD}
            fill={obj.fill}
            stroke={obj.stroke === "transparent" ? undefined : obj.stroke}
            strokeWidth={obj.strokeWidth}
            scaleX={(obj.width * px) / vb}
            scaleY={(obj.height * px) / vb}
          />
        </Group>
      );
    }
    return (
      <Line
        {...common}
        points={(obj.points ?? []).map((v) => v * px)}
        stroke={obj.fill}
        strokeWidth={(obj.brushSize ?? 0.4) * px}
        lineCap="round"
        lineJoin="round"
        tension={obj.tension ?? 0}
        closed={obj.closed}
        fill={obj.closed ? obj.fill : undefined}
        width={undefined}
        height={undefined}
      />
    );
  }

  if (obj.type === "shape") {
    const w = obj.width * px;
    const h = obj.height * px;
    const fill = obj.fill;
    const stroke = obj.stroke === "transparent" ? undefined : obj.stroke;
    const strokeWidth = obj.strokeWidth;
    const kind = obj.shape ?? "rect";
    if (kind === "ellipse" || kind === "circle") {
      return (
        <Group {...common}>
          <Ellipse x={w / 2} y={h / 2} radiusX={w / 2} radiusY={h / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </Group>
      );
    }
    if (kind === "star") {
      return (
        <Group {...common}>
          <Star x={w / 2} y={h / 2} numPoints={obj.sides ?? 5} innerRadius={Math.min(w, h) / 4} outerRadius={Math.min(w, h) / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </Group>
      );
    }
    if (kind === "triangle") {
      return (
        <Group {...common}>
          <RegularPolygon x={w / 2} y={h / 2} sides={3} radius={Math.min(w, h) / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </Group>
      );
    }
    if (kind === "polygon") {
      return (
        <Group {...common}>
          <RegularPolygon x={w / 2} y={h / 2} sides={obj.sides ?? 6} radius={Math.min(w, h) / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </Group>
      );
    }
    if (kind === "diamond") {
      return (
        <Group {...common}>
          <RegularPolygon x={w / 2} y={h / 2} sides={4} radius={Math.min(w, h) / 2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        </Group>
      );
    }
    if (kind === "heart") {
      return (
        <Group {...common}>
          <Path
            data="M12 21S4.5 16.4 2.5 11.8C.7 8.2 2.4 4.5 6 4.5c2 0 3.4 1.2 4 2.3.6-1.1 2-2.3 4-2.3 3.6 0 5.3 3.7 3.5 7.3C19.5 16.4 12 21 12 21z"
            fill={fill}
            scaleX={w / 24}
            scaleY={h / 24}
          />
        </Group>
      );
    }
    if (kind === "line") {
      return <Line {...common} points={[0, h / 2, w, h / 2]} stroke={fill} strokeWidth={Math.max(2, strokeWidth)} lineCap="round" width={undefined} height={undefined} />;
    }
    if (kind === "arrow") {
      return <Arrow {...common} points={[0, h / 2, w, h / 2]} stroke={fill} fill={fill} pointerLength={12} pointerWidth={12} strokeWidth={Math.max(2, strokeWidth)} />;
    }
    return (
      <Rect
        {...common}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        cornerRadius={kind === "roundRect" ? (obj.cornerRadius ?? 0.8) * px : 0}
      />
    );
  }

  return <Circle {...common} radius={4} fill="#f00" />;
}

function FilteredImage({
  obj,
  common,
  px,
}: {
  obj: CanvasObject;
  common: Record<string, unknown>;
  px: number;
}) {
  const image = useHtmlImage(obj.src);
  const ref = useRef<Konva.Image>(null);
  const f = obj.filters;

  useEffect(() => {
    const node = ref.current;
    if (!node || !image) return;
    node.cache();
    node.getLayer()?.batchDraw();
  }, [image, f, obj.width, obj.height, px]);

  if (!image) return null;
  const filters: unknown[] = [];
  if (f && (f.brightness || f.contrast || f.saturation || f.blur || f.grayscale || f.sepia || f.invert)) {
    if (f.brightness) filters.push(Konva.Filters.Brighten);
    if (f.contrast) filters.push(Konva.Filters.Contrast);
    if (f.saturation) filters.push(Konva.Filters.HSL);
    if (f.blur) filters.push(Konva.Filters.Blur);
    if (f.grayscale) filters.push(Konva.Filters.Grayscale);
    if (f.invert) filters.push(Konva.Filters.Invert);
    if (f.sepia) filters.push(Konva.Filters.Sepia);
  }

  const cl = (obj.cropL ?? 0) * image.width;
  const ct = (obj.cropT ?? 0) * image.height;
  const cw = image.width * (1 - (obj.cropL ?? 0) - (obj.cropR ?? 0));
  const ch = image.height * (1 - (obj.cropT ?? 0) - (obj.cropB ?? 0));

  return (
    <KImage
      {...common}
      image={image}
      crop={{ x: cl, y: ct, width: cw, height: ch }}
      filters={filters as never}
      brightness={f?.brightness ?? 0}
      contrast={(f?.contrast ?? 0) * 40}
      saturation={f?.saturation ?? 0}
      blurRadius={f?.blur ?? 0}
      ref={(n) => {
        ref.current = n;
        (common.ref as (n: Konva.Node | null) => void)(n);
      }}
    />
  );
}
