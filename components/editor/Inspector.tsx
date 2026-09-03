"use client";

import {
  AlignCenter,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  Bold,
  FlipHorizontal2,
  FlipVertical2,
  Italic,
  Lock,
  Strikethrough,
  Trash2,
  Underline,
  Unlock,
  Eye,
  EyeOff,
} from "lucide-react";
import { CANVAS_FONTS } from "@/lib/editor/fonts";
import { useEditor } from "@/lib/editor/store";
import type { AlignDir, BlendMode, CanvasObject } from "@/lib/editor/types";
import { ColorField, IconBtn, NumberField, PanelSection, RangeField } from "./ui";

const BLENDS: BlendMode[] = [
  "source-over",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "soft-light",
  "hard-light",
  "difference",
];

export function Inspector() {
  const selectedIds = useEditor((s) => s.selectedIds);
  const view = useEditor((s) => s.view);
  const objectsByView = useEditor((s) => s.objectsByView);
  const selected = objectsByView[view].filter((o) => selectedIds.includes(o.id));
  const unit = useEditor((s) => s.unit);
  const updateObject = useEditor((s) => s.updateObject);
  const updateSelected = useEditor((s) => s.updateSelected);
  const alignSelected = useEditor((s) => s.alignSelected);
  const distributeSelected = useEditor((s) => s.distributeSelected);
  const deleteSelected = useEditor((s) => s.deleteSelected);
  const duplicateSelected = useEditor((s) => s.duplicateSelected);

  if (!selected.length) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-white/8 px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
          Properti
        </div>
        <p className="px-4 py-6 text-[12px] leading-relaxed text-white/35">
          Pilih objek di kanvas untuk mengatur posisi, tipografi, warna, filter, dan efek. Semua angka dalam satuan fisik ({unit}).
        </p>
        <LayersBody />
      </div>
    );
  }

  const obj = selected[0];
  const suffix = unit;
  const toU = (cm: number) => (unit === "in" ? cm / 2.54 : cm);
  const fromU = (v: number) => (unit === "in" ? v * 2.54 : v);
  const patch = (p: Partial<CanvasObject>) => {
    if (selected.length === 1) updateObject(obj.id, p);
    else updateSelected(p);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/8 px-3 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">Properti</div>
        <div className="mt-1 truncate text-[13px] text-white/80">
          {selected.length > 1 ? `${selected.length} objek` : obj.name}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PanelSection
          title="Transformasi"
          extra={
            <div className="flex gap-0.5">
              <IconBtn title="Flip H" onClick={() => patch({ flipX: !obj.flipX })}>
                <FlipHorizontal2 className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn title="Flip V" onClick={() => patch({ flipY: !obj.flipY })}>
                <FlipVertical2 className="h-3.5 w-3.5" />
              </IconBtn>
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-1.5">
            <NumberField label="X" suffix={suffix} value={toU(obj.x)} onChange={(v) => patch({ x: fromU(v) })} />
            <NumberField label="Y" suffix={suffix} value={toU(obj.y)} onChange={(v) => patch({ y: fromU(v) })} />
            <NumberField label="W" suffix={suffix} value={toU(obj.width)} min={0.2} onChange={(v) => patch({ width: fromU(v) })} />
            <NumberField label="H" suffix={suffix} value={toU(obj.height)} min={0.2} onChange={(v) => patch({ height: fromU(v) })} />
            <NumberField label="Putar" suffix="°" value={obj.rotation} step={1} onChange={(v) => patch({ rotation: v })} />
            <NumberField label="Opasitas" suffix="%" value={obj.opacity * 100} step={1} min={0} max={100} onChange={(v) => patch({ opacity: v / 100 })} />
          </div>
        </PanelSection>

        <PanelSection title="Perataan">
          <div className="flex flex-wrap gap-0.5">
            {(
              [
                ["left", AlignStartVertical],
                ["centerX", AlignCenterVertical],
                ["right", AlignEndVertical],
                ["top", AlignStartHorizontal],
                ["centerY", AlignCenterHorizontal],
                ["bottom", AlignEndHorizontal],
              ] as [AlignDir, typeof AlignCenter][]
            ).map(([dir, Icon]) => (
              <IconBtn key={dir} title={dir} onClick={() => alignSelected(dir)}>
                <Icon className="h-3.5 w-3.5" />
              </IconBtn>
            ))}
            <IconBtn title="Distribusi X" onClick={() => distributeSelected("x")}>
              <AlignCenter className="h-3.5 w-3.5" />
            </IconBtn>
          </div>
        </PanelSection>

        {obj.type === "text" && selected.length === 1 && (
          <PanelSection title="Tipografi">
            <textarea
              value={obj.text ?? ""}
              onChange={(e) => updateObject(obj.id, { text: e.target.value }, { history: false })}
              className="mb-2 h-16 w-full resize-none rounded-lg border border-white/8 bg-black/30 px-2 py-1.5 text-[12px] text-white outline-none"
            />
            <select
              value={obj.fontFamily}
              onChange={(e) => updateObject(obj.id, { fontFamily: e.target.value })}
              className="mb-2 h-8 w-full rounded-lg border border-white/8 bg-black/30 px-2 text-[12px] text-white outline-none"
            >
              {CANVAS_FONTS.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
            <div className="mb-2 grid grid-cols-2 gap-1.5">
              <NumberField label="Ukuran" suffix="pt" value={obj.fontSize ?? 36} step={1} min={6} onChange={(v) => updateObject(obj.id, { fontSize: v })} />
              <NumberField label="Spasi huruf" value={obj.letterSpacing ?? 0} step={0.5} onChange={(v) => updateObject(obj.id, { letterSpacing: v })} />
            </div>
            <div className="mb-2 flex gap-1">
              <IconBtn title="Bold" active={obj.fontBold} onClick={() => updateObject(obj.id, { fontBold: !obj.fontBold })}>
                <Bold className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn title="Italic" active={obj.fontItalic} onClick={() => updateObject(obj.id, { fontItalic: !obj.fontItalic })}>
                <Italic className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn title="Underline" active={obj.textDecoration === "underline"} onClick={() => updateObject(obj.id, { textDecoration: obj.textDecoration === "underline" ? "" : "underline" })}>
                <Underline className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn title="Strike" active={obj.textDecoration === "line-through"} onClick={() => updateObject(obj.id, { textDecoration: obj.textDecoration === "line-through" ? "" : "line-through" })}>
                <Strikethrough className="h-3.5 w-3.5" />
              </IconBtn>
            </div>
            <div className="mb-2 grid grid-cols-3 gap-1">
              {(["left", "center", "right"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => updateObject(obj.id, { textAlign: a })}
                  className={`rounded-md py-1 text-[10px] uppercase ${obj.textAlign === a ? "bg-white/12 text-white" : "text-white/40"}`}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <NumberField label="Tinggi baris" value={obj.lineHeight ?? 1.15} step={0.05} min={0.8} max={3} onChange={(v) => updateObject(obj.id, { lineHeight: v })} />
              <select
                value={obj.textTransform ?? "none"}
                onChange={(e) => updateObject(obj.id, { textTransform: e.target.value as CanvasObject["textTransform"] })}
                className="mt-5 h-8 rounded-lg border border-white/8 bg-black/30 px-2 text-[11px] text-white"
              >
                <option value="none">Normal</option>
                <option value="uppercase">HURUF BESAR</option>
                <option value="lowercase">huruf kecil</option>
              </select>
            </div>
          </PanelSection>
        )}

        <PanelSection title="Isian & garis">
          <ColorField label="Isi" value={obj.fill === "transparent" ? "#111111" : obj.fill} onChange={(fill) => patch({ fill })} />
          <div className="mt-2">
            <ColorField label="Garis" value={obj.stroke === "transparent" ? "#111111" : obj.stroke} onChange={(stroke) => patch({ stroke })} />
          </div>
          <div className="mt-2">
            <NumberField label="Tebal garis" value={obj.strokeWidth} step={0.5} min={0} onChange={(strokeWidth) => patch({ strokeWidth })} />
          </div>
        </PanelSection>

        {obj.type === "image" && selected.length === 1 && (
          <PanelSection title="Filter gambar">
            <RangeField label="Kecerahan" min={-0.6} max={0.6} value={obj.filters?.brightness ?? 0} onChange={(brightness) => updateObject(obj.id, { filters: { ...(obj.filters ?? { brightness: 0, contrast: 0, saturation: 0, blur: 0, grayscale: 0, sepia: 0, invert: 0 }), brightness } })} />
            <div className="mt-2">
              <RangeField label="Kontras" min={-0.6} max={0.6} value={obj.filters?.contrast ?? 0} onChange={(contrast) => updateObject(obj.id, { filters: { ...(obj.filters ?? { brightness: 0, contrast: 0, saturation: 0, blur: 0, grayscale: 0, sepia: 0, invert: 0 }), contrast } })} />
            </div>
            <div className="mt-2">
              <RangeField label="Saturasi" min={-1} max={2} value={obj.filters?.saturation ?? 0} onChange={(saturation) => updateObject(obj.id, { filters: { ...(obj.filters ?? { brightness: 0, contrast: 0, saturation: 0, blur: 0, grayscale: 0, sepia: 0, invert: 0 }), saturation } })} />
            </div>
            <div className="mt-2">
              <RangeField label="Blur" min={0} max={12} step={0.2} value={obj.filters?.blur ?? 0} onChange={(blur) => updateObject(obj.id, { filters: { ...(obj.filters ?? { brightness: 0, contrast: 0, saturation: 0, blur: 0, grayscale: 0, sepia: 0, invert: 0 }), blur } })} />
            </div>
            <div className="mt-2">
              <RangeField label="Grayscale" value={obj.filters?.grayscale ?? 0} onChange={(grayscale) => updateObject(obj.id, { filters: { ...(obj.filters ?? { brightness: 0, contrast: 0, saturation: 0, blur: 0, grayscale: 0, sepia: 0, invert: 0 }), grayscale } })} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <NumberField label="Crop L" value={(obj.cropL ?? 0) * 100} suffix="%" min={0} max={40} step={1} onChange={(v) => updateObject(obj.id, { cropL: v / 100 })} />
              <NumberField label="Crop R" value={(obj.cropR ?? 0) * 100} suffix="%" min={0} max={40} step={1} onChange={(v) => updateObject(obj.id, { cropR: v / 100 })} />
              <NumberField label="Crop T" value={(obj.cropT ?? 0) * 100} suffix="%" min={0} max={40} step={1} onChange={(v) => updateObject(obj.id, { cropT: v / 100 })} />
              <NumberField label="Crop B" value={(obj.cropB ?? 0) * 100} suffix="%" min={0} max={40} step={1} onChange={(v) => updateObject(obj.id, { cropB: v / 100 })} />
            </div>
            <label className="mt-3 block text-[11px] text-white/50">
              Ganti gambar
              <input
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-[10px] text-white/40"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => updateObject(obj.id, { src: String(reader.result), name: file.name });
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </PanelSection>
        )}

        {obj.type === "shape" && selected.length === 1 && (obj.shape === "roundRect" || obj.shape === "star" || obj.shape === "polygon") && (
          <PanelSection title="Bentuk">
            {obj.shape === "roundRect" && (
              <NumberField label="Radius" suffix="cm" value={obj.cornerRadius ?? 0.8} min={0} step={0.1} onChange={(cornerRadius) => updateObject(obj.id, { cornerRadius })} />
            )}
            {(obj.shape === "star" || obj.shape === "polygon") && (
              <NumberField label="Sisi / puncak" value={obj.sides ?? 5} min={3} max={12} step={1} onChange={(sides) => updateObject(obj.id, { sides })} />
            )}
          </PanelSection>
        )}

        <PanelSection title="Efek bayangan">
          <label className="mb-2 flex items-center gap-2 text-[12px] text-white/70">
            <input type="checkbox" checked={obj.shadowEnabled} onChange={(e) => patch({ shadowEnabled: e.target.checked })} />
            Aktifkan
          </label>
          {obj.shadowEnabled && (
            <div className="grid gap-2">
              <ColorField label="Warna" value={obj.shadowColor} onChange={(shadowColor) => patch({ shadowColor })} />
              <NumberField label="Blur" value={obj.shadowBlur} min={0} onChange={(shadowBlur) => patch({ shadowBlur })} />
              <div className="grid grid-cols-2 gap-1.5">
                <NumberField label="X" value={obj.shadowOffsetX} onChange={(shadowOffsetX) => patch({ shadowOffsetX })} />
                <NumberField label="Y" value={obj.shadowOffsetY} onChange={(shadowOffsetY) => patch({ shadowOffsetY })} />
              </div>
            </div>
          )}
        </PanelSection>

        <PanelSection title="Blend">
          <select
            value={obj.blendMode}
            onChange={(e) => patch({ blendMode: e.target.value as BlendMode })}
            className="h-8 w-full rounded-lg border border-white/8 bg-black/30 px-2 text-[12px] text-white"
          >
            {BLENDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </PanelSection>

        <PanelSection title="Aksi">
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={duplicateSelected} className="rounded-lg bg-white/8 px-2.5 py-1.5 text-[11px] text-white/80">
              Duplikat
            </button>
            <button type="button" onClick={() => useEditor.getState().groupSelected()} className="rounded-lg bg-white/8 px-2.5 py-1.5 text-[11px] text-white/80">
              Grup
            </button>
            <button type="button" onClick={() => useEditor.getState().ungroupSelected()} className="rounded-lg bg-white/8 px-2.5 py-1.5 text-[11px] text-white/80">
              Pecah
            </button>
            <button type="button" onClick={() => patch({ locked: !obj.locked })} className="inline-flex items-center gap-1 rounded-lg bg-white/8 px-2.5 py-1.5 text-[11px] text-white/80">
              {obj.locked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />} Kunci
            </button>
            <button type="button" onClick={() => patch({ visible: !obj.visible })} className="inline-flex items-center gap-1 rounded-lg bg-white/8 px-2.5 py-1.5 text-[11px] text-white/80">
              {obj.visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />} Sembunyi
            </button>
            <button type="button" onClick={deleteSelected} className="inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-2.5 py-1.5 text-[11px] text-red-300">
              <Trash2 className="h-3 w-3" /> Hapus
            </button>
          </div>
        </PanelSection>

        <LayersBody />
      </div>
    </div>
  );
}

function LayersBody() {
  const objects = useEditor((s) => s.objectsByView[s.view]);
  const selectedIds = useEditor((s) => s.selectedIds);
  const select = useEditor((s) => s.select);
  const updateObject = useEditor((s) => s.updateObject);
  const reorder = useEditor((s) => s.reorder);

  return (
    <PanelSection title="Layer">
      {!objects.length ? (
        <p className="text-[11px] text-white/30">Belum ada layer.</p>
      ) : (
        <div className="flex flex-col-reverse gap-0.5">
          {objects.map((o) => {
            const active = selectedIds.includes(o.id);
            return (
              <div
                key={o.id}
                className={`flex items-center gap-1 rounded-lg px-1.5 py-1 ${active ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <button type="button" className="min-w-0 flex-1 truncate text-left text-[11px] text-white/75" onClick={() => select([o.id])}>
                  {o.name}
                </button>
                <IconBtn title="Naik" onClick={() => reorder(o.id, "forward")}>
                  <span className="text-[10px]">↑</span>
                </IconBtn>
                <IconBtn title="Turun" onClick={() => reorder(o.id, "backward")}>
                  <span className="text-[10px]">↓</span>
                </IconBtn>
                <IconBtn title="Visibilitas" active={!o.visible} onClick={() => updateObject(o.id, { visible: !o.visible })}>
                  {o.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </IconBtn>
              </div>
            );
          })}
        </div>
      )}
    </PanelSection>
  );
}
