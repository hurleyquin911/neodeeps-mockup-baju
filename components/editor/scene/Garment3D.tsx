"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  createBodyGeometry,
  createCollarGeometry,
  createHemRingGeometry,
  createHoodGeometry,
  createNeckLiningGeometry,
  createPocketGeometry,
  createSleeveCapGeometry,
  createSleeveGeometry,
  sleeveAttach,
} from "@/lib/editor/createShirtGeometry";
import { ellipseRadii } from "@/lib/editor/garment";
import type { GarmentLayout, GarmentType, Measurements, PrintArea } from "@/lib/editor/types";

function makeFabricBump() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 128 + (Math.random() - 0.5) * 36;
    img.data[i] = n;
    img.data[i + 1] = n;
    img.data[i + 2] = n;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 14);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

function Cloth({
  color,
  bump,
}: {
  color: string;
  bump?: THREE.CanvasTexture | null;
}) {
  return (
    <meshPhysicalMaterial
      color={color}
      bumpMap={bump ?? undefined}
      bumpScale={0.35}
      roughness={0.9}
      metalness={0}
      sheen={1}
      sheenColor={color}
      sheenRoughness={0.52}
      specularIntensity={0.12}
      envMapIntensity={0.45}
      side={THREE.DoubleSide}
    />
  );
}

function PrintSkin({
  geometry,
  map,
  position,
  scale,
  side = THREE.FrontSide,
}: {
  geometry: THREE.BufferGeometry;
  map: THREE.CanvasTexture;
  position?: [number, number, number];
  scale?: [number, number, number];
  side?: THREE.Side;
}) {
  return (
    <mesh geometry={geometry} position={position} scale={scale} renderOrder={2}>
      <meshPhysicalMaterial
        map={map}
        transparent
        alphaTest={0.03}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1.5}
        polygonOffsetUnits={-1.5}
        roughness={0.88}
        metalness={0}
        sheen={0.35}
        envMapIntensity={0.35}
        side={side}
      />
    </mesh>
  );
}

function canvasHasInk(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 10) return true;
  }
  return false;
}

function cropRegion(
  source: HTMLCanvasElement | null,
  layout: GarmentLayout,
  region: PrintArea,
  flipX = false,
) {
  if (!source) return null;
  const w = Math.max(2, Math.round(region.width * 24));
  const h = Math.max(2, Math.round(region.height * 24));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  if (flipX) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  const sx = source.width / layout.width;
  const sy = source.height / layout.height;
  ctx.drawImage(
    source,
    region.x * sx,
    region.y * sy,
    region.width * sx,
    region.height * sy,
    0,
    0,
    w,
    h,
  );
  return canvasHasInk(c) ? c : null;
}

function pickSleeveMap(
  dedicated: HTMLCanvasElement | null,
  front: HTMLCanvasElement | null,
  layout: GarmentLayout,
  region: PrintArea,
  flipX: boolean,
) {
  return cropRegion(dedicated, layout, region, flipX) ?? cropRegion(front, layout, region, flipX);
}

function asTexture(canvas: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
  t.flipY = true;
  return t;
}

function useClothMap(factory: () => HTMLCanvasElement | null) {
  const [map, setMap] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    const canvas = factory();
    if (!canvas) {
      setMap(null);
      return;
    }
    const texture = asTexture(canvas);
    setMap(texture);
    return () => {
      texture.dispose();
    };
    // factory is recreated each render; callers pass a memoized callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory]);
  return map;
}

export function ShirtMesh({
  type,
  measurements,
  color,
  collarY,
  layout,
  frontCanvas,
  backCanvas,
  sleeveLeftCanvas,
  sleeveRightCanvas,
}: {
  type: GarmentType;
  measurements: Measurements;
  color: string;
  collarY: number;
  layout: GarmentLayout;
  frontCanvas: HTMLCanvasElement | null;
  backCanvas: HTMLCanvasElement | null;
  sleeveLeftCanvas?: HTMLCanvasElement | null;
  sleeveRightCanvas?: HTMLCanvasElement | null;
}) {
  const m = measurements;
  const { rz } = ellipseRadii(m.chestFlat);
  const hemY = collarY - m.length;
  const hasSleeves = type !== "tank";

  const body = useMemo(() => createBodyGeometry(m, type, "all"), [m, type]);
  const bodyFront = useMemo(() => createBodyGeometry(m, type, "front"), [m, type]);
  const bodyBack = useMemo(() => createBodyGeometry(m, type, "back"), [m, type]);
  const sleeve = useMemo(() => (hasSleeves ? createSleeveGeometry(m, type) : null), [m, type, hasSleeves]);
  const collar = useMemo(() => createCollarGeometry(m, type), [m, type]);
  const hem = useMemo(() => createHemRingGeometry(m), [m]);
  const lining = useMemo(() => createNeckLiningGeometry(m), [m]);
  const hood = useMemo(() => (type === "hoodie" ? createHoodGeometry(m) : null), [m, type]);
  const pocket = useMemo(() => (type === "hoodie" ? createPocketGeometry(m) : null), [m, type]);
  const cap = useMemo(
    () => (sleeve ? createSleeveCapGeometry(sleeve.hemRx, sleeve.hemRz) : null),
    [sleeve],
  );
  const bump = useMemo(() => makeFabricBump(), []);

  const makeFront = useCallback(
    () => cropRegion(frontCanvas, layout, layout.body),
    [frontCanvas, layout],
  );
  const makeBack = useCallback(
    () => cropRegion(backCanvas, layout, layout.body),
    [backCanvas, layout],
  );
  const makeSleeveL = useCallback(
    () =>
      hasSleeves
        ? pickSleeveMap(sleeveLeftCanvas ?? null, frontCanvas, layout, layout.sleeveBox.left, true)
        : null,
    [sleeveLeftCanvas, frontCanvas, layout, hasSleeves],
  );
  const makeSleeveR = useCallback(
    () =>
      hasSleeves
        ? pickSleeveMap(sleeveRightCanvas ?? null, frontCanvas, layout, layout.sleeveBox.right, false)
        : null,
    [sleeveRightCanvas, frontCanvas, layout, hasSleeves],
  );

  const frontMap = useClothMap(makeFront);
  const backMap = useClothMap(makeBack);
  const sleeveLMap = useClothMap(makeSleeveL);
  const sleeveRMap = useClothMap(makeSleeveR);

  return (
    <group>
      <mesh geometry={body} position={[0, hemY, 0]} castShadow receiveShadow>
        <Cloth color={color} bump={bump} />
      </mesh>
      {frontMap ? <PrintSkin geometry={bodyFront} map={frontMap} position={[0, hemY, 0]} /> : null}
      {backMap ? <PrintSkin geometry={bodyBack} map={backMap} position={[0, hemY, 0]} /> : null}
      <mesh geometry={collar} position={[0, collarY - 1.2, 0]} castShadow>
        <Cloth color={color} bump={bump} />
      </mesh>
      <mesh geometry={hem} position={[0, hemY, 0]} castShadow>
        <Cloth color={color} bump={bump} />
      </mesh>
      <mesh geometry={lining} position={[0, collarY - 2.2, 0]} renderOrder={0}>
        <meshStandardMaterial color="#1a1a1a" roughness={1} side={THREE.BackSide} />
      </mesh>
      {sleeve &&
        ([-1, 1] as const).map((side) => {
          const a = sleeveAttach(m, type, side);
          return (
            <group key={side} position={[a.x, hemY + a.y, a.z]} rotation={[0.12, a.rotY, a.rotZ]}>
              <mesh geometry={sleeve.geometry} scale={[side, 1, 1]} castShadow receiveShadow>
                <Cloth color={color} bump={bump} />
              </mesh>
              {(side === -1 ? sleeveLMap : sleeveRMap) ? (
                <PrintSkin
                  geometry={sleeve.geometry}
                  map={(side === -1 ? sleeveLMap : sleeveRMap)!}
                  scale={[side, 1, 1]}
                  side={THREE.DoubleSide}
                />
              ) : null}
              {cap ? (
                <mesh
                  geometry={cap}
                  position={[side * sleeve.length * 0.4, -sleeve.length * 0.78, 1.8]}
                  rotation={[0, side === 1 ? 0.4 : Math.PI - 0.4, 0.7]}
                >
                  <meshStandardMaterial color={color} roughness={0.95} />
                </mesh>
              ) : null}
            </group>
          );
        })}
      {hood ? (
        <mesh geometry={hood} position={[0, collarY + 5.5, -rz * 0.22]} rotation={[0.28, 0, 0]} castShadow>
          <Cloth color={color} bump={bump} />
        </mesh>
      ) : null}
      {pocket ? (
        <mesh geometry={pocket} position={[0, collarY - m.length * 0.48, rz * 0.72]} rotation={[-0.08, 0, 0]} castShadow>
          <Cloth color={color} bump={bump} />
        </mesh>
      ) : null}
    </group>
  );
}

export function DressForm({
  height,
  rx,
  visible,
}: {
  height: number;
  rx: number;
  rz: number;
  visible: boolean;
}) {
  if (!visible) return null;
  const head = height / 7.8;
  const shoulderY = height - head * 1.12;
  const hipY = shoulderY - 48;
  const mat = "#9a938c";
  return (
    <group>
      <mesh position={[0, 12, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 24, 12]} />
        <meshStandardMaterial color="#c9cdd3" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[10, 10, 0.8, 24]} />
        <meshStandardMaterial color="#c9cdd3" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0, hipY, 0]}>
        <sphereGeometry args={[rx * 0.72, 20, 16]} />
        <meshStandardMaterial color={mat} roughness={0.55} />
      </mesh>
      <mesh position={[0, (hipY + shoulderY) / 2 - 4, 0]}>
        <capsuleGeometry args={[rx * 0.62, Math.max(10, shoulderY - hipY - 18), 8, 16]} />
        <meshStandardMaterial color={mat} roughness={0.55} />
      </mesh>
      <mesh position={[0, shoulderY + 4, 0]}>
        <cylinderGeometry args={[3.6, 4.4, 8, 16]} />
        <meshStandardMaterial color={mat} roughness={0.55} />
      </mesh>
    </group>
  );
}

export function DimensionOverlay({
  length,
  chestFlat,
  collarY,
  rx,
}: {
  length: number;
  chestFlat: number;
  collarY: number;
  rx: number;
}) {
  const hemY = collarY - length;
  const x = rx + 8;
  return (
    <group>
      <Html position={[x, (collarY + hemY) / 2, 0]} center>
        <div className="rounded-md bg-black/70 px-2 py-1 text-[10px] whitespace-nowrap text-[var(--accent)]">
          Panjang {length.toFixed(0)} cm
        </div>
      </Html>
      <Html position={[0, collarY + 6, rx]} center>
        <div className="rounded-md bg-black/70 px-2 py-1 text-[10px] whitespace-nowrap text-sky-200">
          Dada {chestFlat.toFixed(0)} cm (flat) · lingkar {(chestFlat * 2).toFixed(0)} cm
        </div>
      </Html>
    </group>
  );
}

export function useCollarY(mannequinHeight: number) {
  const head = mannequinHeight / 7.8;
  return mannequinHeight - head * 1.12;
}

export function SceneSetup() {
  const light = useRef<THREE.DirectionalLight>(null);
  return (
    <>
      <color attach="background" args={["#1a1d24"]} />
      <hemisphereLight args={["#fff6ea", "#2c281f", 0.75]} />
      <ambientLight intensity={0.55} />
      <directionalLight
        ref={light}
        position={[60, 130, 70]}
        intensity={1.35}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={10}
        shadow-camera-far={400}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <directionalLight position={[-50, 40, 30]} intensity={0.4} color="#c9d6ff" />
      <directionalLight position={[10, 50, -80]} intensity={0.25} color="#ffe6c7" />
    </>
  );
}
