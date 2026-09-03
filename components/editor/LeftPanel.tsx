"use client";

import {
  ArrowUpRight,
  Circle,
  Diamond,
  Hexagon,
  ImagePlus,
  Minus,
  Square,
  Star,
  Triangle,
  Type,
  Upload,
} from "lucide-react";
import { CLIPART } from "@/lib/editor/clipart";
import {
  GARMENT_LABEL,
  SIZE_ORDER,
  buildGarmentLayout,
  formatLen,
} from "@/lib/editor/garment";
import { CANVAS_FONTS } from "@/lib/editor/fonts";
import { useEditor, type LeftTab } from "@/lib/editor/store";
import type { GarmentType, ShapeKind } from "@/lib/editor/types";
import { ColorField, GarmentColorPicker, PanelSection, RangeField, Seg } from "./ui";

const TABS: { id: LeftTab; label: string }[] = [
  { id: "produk", label: "Produk" },
  { id: "teks", label: "Teks" },
  { id: "unggah", label: "Unggah" },
  { id: "bentuk", label: "Bentuk" },
  { id: "gambar", label: "Gambar" },
  { id: "template", label: "Template" },
];

const SHAPES: { id: ShapeKind; label: string; icon: typeof Square }[] = [
  { id: "rect", label: "Persegi", icon: Square },
  { id: "roundRect", label: "Rounded", icon: Square },
  { id: "ellipse", label: "Oval", icon: Circle },
  { id: "circle", label: "Lingkaran", icon: Circle },
  { id: "triangle", label: "Segitiga", icon: Triangle },
  { id: "star", label: "Bintang", icon: Star },
  { id: "polygon", label: "Poligon", icon: Hexagon },
  { id: "diamond", label: "Berlian", icon: Diamond },
  { id: "line", label: "Garis", icon: Minus },
  { id: "arrow", label: "Panah", icon: ArrowUpRight },
  { id: "heart", label: "Hati", icon: Circle },
];

export function LeftPanel() {
  const tab = useEditor((s) => s.leftTab);
  const setLeftTab = useEditor((s) => s.setLeftTab);

  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-r border-white/8 bg-[#101218]">
      <div className="grid grid-cols-3 gap-0.5 border-b border-white/8 p-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setLeftTab(t.id)}
            className={`rounded-md px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${
              tab === t.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "produk" && <ProdukTab />}
        {tab === "teks" && <TeksTab />}
        {tab === "unggah" && <UnggahTab />}
        {tab === "bentuk" && <BentukTab />}
        {tab === "gambar" && <GambarTab />}
        {tab === "template" && <TemplateTab />}
      </div>
    </aside>
  );
}

function ProdukTab() {
  const type = useEditor((s) => s.garmentType);
  const size = useEditor((s) => s.size);
  const color = useEditor((s) => s.garmentColor);
  const unit = useEditor((s) => s.unit);
  const setType = useEditor((s) => s.setGarmentType);
  const setSize = useEditor((s) => s.setSize);
  const setColor = useEditor((s) => s.setGarmentColor);
  const setUnit = useEditor((s) => s.setUnit);
  const layout = buildGarmentLayout(type, size);
  const m = layout.measurements;

  return (
    <>
      <PanelSection title="Jenis baju">
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(GARMENT_LABEL) as GarmentType[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setType(k)}
              className={`rounded-xl border px-2 py-2.5 text-left text-[12px] ${
                type === k
                  ? "border-[var(--accent)]/50 bg-[var(--accent)]/10 text-white"
                  : "border-white/8 bg-white/3 text-white/60 hover:text-white"
              }`}
            >
              {GARMENT_LABEL[k]}
            </button>
          ))}
        </div>
      </PanelSection>
      <PanelSection title="Warna kain">
        <GarmentColorPicker value={color} onChange={setColor} />
      </PanelSection>
      <PanelSection title="Ukuran">
        <div className="mb-2 grid grid-cols-6 gap-1">
          {SIZE_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={`rounded-lg py-1.5 text-[11px] font-semibold ${
                size === s ? "bg-[var(--accent)] text-[#111]" : "bg-white/5 text-white/55 hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <Seg
          value={unit}
          onChange={(v) => setUnit(v as "cm" | "in")}
          options={[
            { id: "cm", label: "cm" },
            { id: "in", label: "inch" },
          ]}
        />
        <div className="mt-3 overflow-hidden rounded-xl border border-white/8">
          <table className="w-full text-left text-[11px]">
            <tbody className="divide-y divide-white/6 text-white/65">
              <Row k="Lebar dada" v={formatLen(m.chestFlat, unit)} />
              <Row k="Lingkar dada" v={formatLen(m.chestFlat * 2, unit)} />
              <Row k="Panjang" v={formatLen(m.length, unit)} />
              <Row k="Bahu" v={formatLen(m.shoulder, unit)} />
              <Row k="Lengan" v={formatLen(m.sleeveLength, unit)} />
              <Row k="Leher" v={formatLen(m.neckWidth, unit)} />
              <Row k="Bidang baju" v={`${formatLen(layout.width, unit)} × ${formatLen(layout.height, unit)}`} />
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-white/35">
          Ukuran 3D memakai data ini 1:1 (1 unit = 1 cm). Desain tetap dalam ukuran fisik, jadi di size lebih besar grafis terasa lebih kecil di badan baju.
        </p>
      </PanelSection>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr>
      <td className="px-2.5 py-1.5 text-white/40">{k}</td>
      <td className="px-2.5 py-1.5 text-right font-medium text-white/80">{v}</td>
    </tr>
  );
}

function TeksTab() {
  const addText = useEditor((s) => s.addText);
  const selectedIds = useEditor((s) => s.selectedIds);
  const view = useEditor((s) => s.view);
  const objectsByView = useEditor((s) => s.objectsByView);
  const updateObject = useEditor((s) => s.updateObject);
  const selected = objectsByView[view].filter((o) => selectedIds.includes(o.id));
  const textObj = selected.find((o) => o.type === "text");

  return (
    <>
      <PanelSection title="Tambah teks">
        <div className="grid gap-1.5">
          <button type="button" onClick={() => addText("heading")} className="rounded-xl bg-white/5 px-3 py-2.5 text-left hover:bg-white/8">
            <div className="font-[family-name:var(--font-geist-sans)] text-lg font-bold tracking-wide text-white">Judul besar</div>
            <div className="text-[10px] text-white/35">Bebas Neue · 64pt</div>
          </button>
          <button type="button" onClick={() => addText("sub")} className="rounded-xl bg-white/5 px-3 py-2.5 text-left hover:bg-white/8">
            <div className="font-serif text-[15px] italic text-white/90">Subjudul elegan</div>
            <div className="text-[10px] text-white/35">Playfair · 28pt</div>
          </button>
          <button type="button" onClick={() => addText("body")} className="rounded-xl bg-white/5 px-3 py-2.5 text-left hover:bg-white/8">
            <div className="flex items-center gap-2 text-[13px] text-white/80">
              <Type className="h-3.5 w-3.5" /> Paragraf / body
            </div>
            <div className="text-[10px] text-white/35">Inter · 18pt</div>
          </button>
        </div>
      </PanelSection>
      <PanelSection title="Font">
        <div className="grid max-h-56 gap-1 overflow-auto">
          {CANVAS_FONTS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                if (textObj) updateObject(textObj.id, { fontFamily: f });
                else addText("heading");
              }}
              className="rounded-lg px-2 py-1.5 text-left text-[13px] text-white/75 hover:bg-white/6"
              style={{ fontFamily: f }}
            >
              {f}
            </button>
          ))}
        </div>
      </PanelSection>
    </>
  );
}

function UnggahTab() {
  const addImageFromFile = useEditor((s) => s.addImageFromFile);

  function onFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((f) => {
      if (f.type.startsWith("image/")) addImageFromFile(f);
    });
  }

  return (
    <PanelSection title="Unggah gambar">
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/3 px-4 py-10 text-center hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5"
      >
        <Upload className="h-6 w-6 text-white/40" />
        <div className="text-[13px] font-medium text-white/80">Seret file ke sini</div>
        <div className="text-[11px] text-white/35">PNG, JPG, WEBP, SVG · transparan didukung</div>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </label>
      <p className="mt-3 text-[11px] leading-relaxed text-white/35">
        Gambar disimpan dalam ukuran sentimeter di bidang baju. Skala 3D mengikuti ukuran fisik yang sama.
      </p>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/4 px-3 py-2 text-[11px] text-white/50">
        <ImagePlus className="h-4 w-4" /> Atau seret langsung ke kanvas
      </div>
    </PanelSection>
  );
}

function BentukTab() {
  const setShapeKind = useEditor((s) => s.setShapeKind);
  const addShape = useEditor((s) => s.addShape);
  const addClipart = useEditor((s) => s.addClipart);
  const shapeKind = useEditor((s) => s.shapeKind);

  return (
    <>
      <PanelSection title="Bentuk dasar">
        <div className="grid grid-cols-4 gap-1.5">
          {SHAPES.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                title={s.label}
                onClick={() => {
                  setShapeKind(s.id);
                  addShape(s.id);
                }}
                className={`flex h-12 items-center justify-center rounded-xl border ${
                  shapeKind === s.id
                    ? "border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-white/8 bg-white/3 text-white/55 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </PanelSection>
      <PanelSection title="Ikon & clipart">
        <div className="grid grid-cols-4 gap-1.5">
          {CLIPART.map((c) => (
            <button
              key={c.id}
              type="button"
              title={c.name}
              onClick={() => addClipart(c.id)}
              className="flex h-14 items-center justify-center rounded-xl border border-white/8 bg-white/3 text-white/80 hover:bg-white/8"
            >
              <svg viewBox={`0 0 ${c.viewBox} ${c.viewBox}`} className="h-7 w-7 fill-current">
                <path d={c.d} />
              </svg>
            </button>
          ))}
        </div>
      </PanelSection>
    </>
  );
}

function GambarTab() {
  const brush = useEditor((s) => s.brush);
  const setBrush = useEditor((s) => s.setBrush);
  const setTool = useEditor((s) => s.setTool);
  const tool = useEditor((s) => s.tool);

  return (
    <>
      <PanelSection title="Alat">
        <div className="grid grid-cols-3 gap-1.5">
          {([
            ["draw", "Kuas"],
            ["pen", "Pena"],
            ["eraser", "Hapus"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTool(id)}
              className={`rounded-xl py-2 text-[11px] font-medium ${
                tool === id ? "bg-[var(--accent)] text-[#111]" : "bg-white/5 text-white/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </PanelSection>
      <PanelSection title="Kuas">
        <RangeField label="Ukuran (cm)" value={brush.size} min={0.08} max={2.4} step={0.02} onChange={(size) => setBrush({ size })} />
        <div className="mt-2">
          <RangeField label="Opasitas" value={brush.opacity} onChange={(opacity) => setBrush({ opacity })} />
        </div>
        <div className="mt-2">
          <RangeField label="Halus" value={brush.tension} max={1} onChange={(tension) => setBrush({ tension })} />
        </div>
        <div className="mt-3">
          <ColorField label="Warna" value={brush.color} onChange={(color) => setBrush({ color })} />
        </div>
      </PanelSection>
    </>
  );
}

function TemplateTab() {
  const applyTemplate = useEditor((s) => s.applyTemplate);
  const items = [
    { id: "center-logo", title: "Logo tengah", desc: "Brand + garis + tahun" },
    { id: "left-chest", title: "Dada kiri", desc: "Monogram kecil" },
    { id: "badge", title: "Badge bundar", desc: "Emblem stroke" },
    { id: "quote", title: "Quote", desc: "Tipografi editorial" },
  ];
  return (
    <PanelSection title="Layout siap pakai">
      <div className="grid gap-1.5">
        {items.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => applyTemplate(t.id)}
            className="rounded-xl border border-white/8 bg-white/3 px-3 py-3 text-left hover:border-[var(--accent)]/30"
          >
            <div className="text-[13px] font-medium text-white">{t.title}</div>
            <div className="text-[11px] text-white/40">{t.desc}</div>
          </button>
        ))}
      </div>
    </PanelSection>
  );
}
