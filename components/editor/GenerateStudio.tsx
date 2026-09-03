"use client";

import { ContactShadows, Environment, Grid, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Download, RotateCcw, Ruler, User, X } from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Group } from "three";
import type { WebGLRenderer } from "three";
import { bakeDesign } from "@/lib/editor/bake";
import { buildGarmentLayout, ellipseRadii, formatLen, GARMENT_LABEL } from "@/lib/editor/garment";
import { useEditor } from "@/lib/editor/store";
import type { PrintView } from "@/lib/editor/types";
import { GarmentColorPicker } from "./ui";
import {
  DimensionOverlay,
  DressForm,
  SceneSetup,
  ShirtMesh,
  useCollarY,
} from "./scene/Garment3D";

function SpinGroup({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame((_, d) => {
    if (enabled && ref.current) ref.current.rotation.y += d * 0.32;
  });
  return <group ref={ref}>{children}</group>;
}

export default function GenerateStudio() {
  const open = useEditor((s) => s.studioOpen);
  const generating = useEditor((s) => s.generating);
  const progress = useEditor((s) => s.generateProgress);
  const setStudioOpen = useEditor((s) => s.setStudioOpen);
  const type = useEditor((s) => s.garmentType);
  const size = useEditor((s) => s.size);
  const color = useEditor((s) => s.garmentColor);
  const setGarmentColor = useEditor((s) => s.setGarmentColor);
  const objectsByView = useEditor((s) => s.objectsByView);
  const mannequinHeight = useEditor((s) => s.mannequinHeight);
  const showMannequin = useEditor((s) => s.showMannequin);
  const showDimensions = useEditor((s) => s.showDimensions);
  const autoRotate = useEditor((s) => s.autoRotate);
  const setMannequinHeight = useEditor((s) => s.setMannequinHeight);
  const toggleMannequin = useEditor((s) => s.toggleMannequin);
  const toggleDimensions = useEditor((s) => s.toggleDimensions);
  const toggleAutoRotate = useEditor((s) => s.toggleAutoRotate);
  const unit = useEditor((s) => s.unit);

  const [maps, setMaps] = useState<Partial<Record<PrintView, HTMLCanvasElement>>>({});
  const glRef = useRef<WebGLRenderer | null>(null);

  useEffect(() => {
    if (!open) return;
    let stop = false;
    (async () => {
      const layout = buildGarmentLayout(type, size);
      const views: PrintView[] = ["front", "back", "sleeveLeft", "sleeveRight"];
      const next: Partial<Record<PrintView, HTMLCanvasElement>> = {};
      for (const v of views) {
        if (!objectsByView[v].length) continue;
        try {
          next[v] = await bakeDesign(objectsByView[v], layout.print[v], 24);
        } catch {
          /* tetap tampilkan baju polos jika bake gagal */
        }
      }
      if (!stop) setMaps(next);
    })();
    return () => {
      stop = true;
    };
  }, [open, type, size, objectsByView]);

  const layout = useMemo(() => buildGarmentLayout(type, size), [type, size]);
  const m = layout.measurements;
  const { rx, rz } = ellipseRadii(m.chestFlat);
  const collarY = useCollarY(mannequinHeight);

  if (!open) return null;

  const download = () => {
    const gl = glRef.current;
    if (!gl) return;
    const a = document.createElement("a");
    a.href = gl.domElement.toDataURL("image/png");
    a.download = `mockup-${type}-${size}.png`;
    a.click();
  };

  return (
    <div className="absolute inset-0 z-40 flex bg-[#07080c]">
      <div className="relative min-w-0 flex-1">
        <Canvas
          shadows
          camera={{ position: [48, 118, 128], fov: 36, near: 0.5, far: 2000 }}
          gl={{ preserveDrawingBuffer: true, antialias: true, alpha: false }}
          onCreated={({ gl, camera }) => {
            glRef.current = gl;
            camera.lookAt(0, 112, 0);
          }}
        >
          <SceneSetup />
          <OrbitControls enablePan makeDefault target={[0, 112, 0]} minDistance={50} maxDistance={360} />
          <Grid args={[200, 200]} cellSize={10} sectionSize={50} cellColor="#2a3140" sectionColor="#3d4a62" fadeDistance={240} position={[0, 0, 0]} />
          <SpinGroup enabled={autoRotate && !generating}>
            <DressForm height={mannequinHeight} rx={rx} rz={rz} visible={showMannequin} />
            <ShirtMesh
              type={type}
              measurements={m}
              color={color}
              collarY={collarY}
              layout={layout}
              frontCanvas={maps.front ?? null}
              backCanvas={maps.back ?? null}
              sleeveLeftCanvas={maps.sleeveLeft ?? null}
              sleeveRightCanvas={maps.sleeveRight ?? null}
            />
            {showDimensions && (
              <DimensionOverlay length={m.length} chestFlat={m.chestFlat} collarY={collarY} rx={rx} />
            )}
          </SpinGroup>
          <ContactShadows position={[0, 0.05, 0]} opacity={0.42} scale={140} blur={2.8} far={70} />
          <Suspense fallback={null}>
            <Environment preset="studio" environmentIntensity={0.5} />
          </Suspense>
        </Canvas>

        {generating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#07080c]/80 backdrop-blur-sm">
            <div className="mb-4 text-[13px] uppercase tracking-[0.22em] text-white/50">Memetakan desain ke kain</div>
            <div className="h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 text-[12px] text-white/40">{progress}%</div>
          </div>
        )}
      </div>

      <aside className="flex w-[320px] shrink-0 flex-col border-l border-white/8 bg-[#101218]">
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <div>
            <div className="text-[13px] font-semibold text-white">Studio 3D</div>
            <div className="text-[11px] text-white/40">
              {GARMENT_LABEL[type]} · {size} · 1 unit = 1 cm
            </div>
          </div>
          <button type="button" onClick={() => setStudioOpen(false)} className="rounded-lg p-1.5 text-white/50 hover:bg-white/8 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto p-4 text-[12px] text-white/70">
          <p className="leading-relaxed text-white/45">
            Mesh 3D kini berbentuk kaos yang dikenakan: bahu lebar, kerah crew, lengan yang jatuh, dan material kain — bukan silinder. Desain mengikuti permukaan baju.
          </p>
          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Warna kain</div>
            <GarmentColorPicker value={color} onChange={setGarmentColor} />
          </div>
          <dl className="grid grid-cols-2 gap-2 rounded-xl border border-white/8 p-3">
            <Stat k="Lebar dada" v={formatLen(m.chestFlat, unit)} />
            <Stat k="Lingkar" v={formatLen(m.chestFlat * 2, unit)} />
            <Stat k="Panjang" v={formatLen(m.length, unit)} />
            <Stat k="Bahu" v={formatLen(m.shoulder, unit)} />
            <Stat k="Lengan" v={formatLen(m.sleeveLength, unit)} />
            <Stat k="Bidang" v={`${layout.body.width.toFixed(0)}×${layout.body.height.toFixed(0)} cm`} />
          </dl>
          <label className="block">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-white/35">Tinggi manekin</div>
            <input
              type="range"
              min={155}
              max={190}
              value={mannequinHeight}
              onChange={(e) => setMannequinHeight(e.target.valueAsNumber)}
              className="studio-range"
            />
            <div className="mt-1 text-white/50">{mannequinHeight} cm</div>
          </label>
          <div className="flex flex-col gap-1.5">
            <Toggle on={showMannequin} onClick={toggleMannequin} icon={<User className="h-3.5 w-3.5" />} label="Manekin" />
            <Toggle on={showDimensions} onClick={toggleDimensions} icon={<Ruler className="h-3.5 w-3.5" />} label="Label ukuran" />
            <Toggle on={autoRotate} onClick={toggleAutoRotate} icon={<RotateCcw className="h-3.5 w-3.5" />} label="Putar otomatis" />
          </div>
          <p className="text-[11px] leading-relaxed text-white/35">
            Grid lantai 10 cm. Kaos size {size} panjang {m.length} cm, dikenakan dari bahu manekin {mannequinHeight} cm — proporsi tubuh mengikuti ukuran asli.
          </p>
        </div>
        <div className="mt-auto border-t border-white/8 p-3">
          <button
            type="button"
            onClick={download}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-2.5 text-[12px] font-semibold text-[#111]"
          >
            <Download className="h-4 w-4" /> Unduh mockup PNG
          </button>
          <button
            type="button"
            onClick={() => setStudioOpen(false)}
            className="mt-2 w-full rounded-xl border border-white/10 py-2 text-[12px] text-white/70 hover:bg-white/5"
          >
            Kembali ke editor
          </button>
        </div>
      </aside>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-white/30">{k}</div>
      <div className="font-medium text-white/85">{v}</div>
    </div>
  );
}

function Toggle({ on, onClick, icon, label }: { on: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left ${
        on ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-white" : "border-white/8 text-white/50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
