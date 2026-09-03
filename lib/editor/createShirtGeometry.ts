import * as THREE from "three";
import { ellipseRadii } from "./garment";
import type { GarmentType, Measurements } from "./types";

function superellipse(rx: number, rz: number, theta: number, n = 2.85) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return {
    x: rx * Math.sign(c) * Math.pow(Math.abs(c), 2 / n),
    z: rz * Math.sign(s) * Math.pow(Math.abs(s), 2 / n),
  };
}

function wrinkleOffset(x: number, y: number, z: number) {
  return (
    0.18 * Math.sin(x * 0.31) * Math.sin(y * 0.17) +
    0.1 * Math.sin(x * 0.72 + y * 0.28) * Math.cos(z * 0.2) +
    0.06 * Math.sin(y * 0.48 + x * 0.15)
  );
}

function bodyScale(t: number, type: GarmentType) {
  // t: 0 hem → 1 neck. Keep shoulders wide — do not taper like a bottle.
  let width = 1;
  let depth = 0.78;
  if (t < 0.1) {
    width = 1.05 - t * 0.3;
    depth = 0.74;
  } else if (t < 0.38) {
    const k = (t - 0.1) / 0.28;
    width = 1.02 - k * 0.05;
    depth = 0.74 + k * 0.04;
  } else if (t < 0.72) {
    const k = (t - 0.38) / 0.34;
    width = 0.97 + k * 0.08;
    depth = 0.78 + k * 0.06;
  } else if (t < 0.93) {
    const k = (t - 0.72) / 0.21;
    width = 1.05 + k * 0.06;
    depth = 0.84 - k * 0.16;
  } else {
    const k = (t - 0.93) / 0.07;
    width = 1.11 * (1 - k) + 0.42 * k;
    depth = 0.68 * (1 - k) + 0.34 * k;
  }
  if (type === "tank") {
    width *= t > 0.78 ? 0.9 : 1;
    depth *= t > 0.78 ? 0.92 : 1;
  }
  return { width, depth };
}

export function createBodyGeometry(
  m: Measurements,
  type: GarmentType,
  shell: "all" | "front" | "back" = "all",
) {
  const { rx, rz } = ellipseRadii(m.chestFlat);
  const length = m.length;
  const heightSegs = 72;
  const radialSegs = 96;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const neckDrop = type === "tank" ? m.neckDropFront * 0.45 : m.neckDropFront * 0.28;
  const aStart = shell === "back" ? radialSegs / 2 : 0;
  const aEnd = shell === "front" ? radialSegs / 2 : radialSegs;

  for (let y = 0; y <= heightSegs; y++) {
    const t = y / heightSegs;
    const sc = bodyScale(t, type);
    const brx = rx * sc.width;
    const brz = rz * sc.depth;
    const yPos = t * length;
    for (let a = aStart; a <= aEnd; a++) {
      const theta = (a / radialSegs) * Math.PI * 2;
      const p = superellipse(brx, brz, theta);
      const front = Math.max(0, Math.sin(theta));
      const dip = t > 0.9 ? front * neckDrop * ((t - 0.9) / 0.1) : 0;
      const wr = wrinkleOffset(p.x, yPos, p.z) * (0.35 + 0.65 * t);
      const nx = p.x / Math.max(brx, 0.001);
      const nz = p.z / Math.max(brz, 0.001);
      positions.push(p.x + nx * wr, yPos - dip, p.z + nz * wr * 0.7);
      const uLocal = THREE.MathUtils.clamp((nx + 1) / 2, 0, 1);
      const u = shell === "back" ? 1 - uLocal : uLocal;
      uvs.push(u, t);
    }
  }

  const cols = aEnd - aStart + 1;
  for (let y = 0; y < heightSegs; y++) {
    for (let a = 0; a < cols - 1; a++) {
      const a0 = y * cols + a;
      const a1 = a0 + 1;
      const b0 = a0 + cols;
      const b1 = b0 + 1;
      indices.push(a0, b0, a1, a1, b0, b1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function createSleeveGeometry(m: Measurements, type: GarmentType) {
  const isShort = type === "tshirt";
  const length = Math.max(8, isShort ? m.sleeveLength * 0.92 : m.sleeveLength * 0.9);
  const rootRx = Math.max(5.8, m.armhole * 0.26);
  const rootRz = rootRx * 0.72;
  const hemRx = isShort ? rootRx * 0.9 : Math.max(3.8, m.sleeveOpening * 0.3);
  const hemRz = hemRx * 0.78;
  const pathSegs = 28;
  const radialSegs = 36;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= pathSegs; i++) {
    const t = i / pathSegs;
    const hang = isShort ? 0.72 : 0.55;
    const px = t * length * 0.42;
    const py = -t * length * hang - t * t * length * 0.12;
    const pz = t * 1.6 + Math.sin(t * Math.PI) * 0.8;
    const rx = rootRx * (1 - t) + hemRx * t;
    const rz = rootRz * (1 - t) + hemRz * t;
    const tx = length * 0.42;
    const ty = -length * hang - 2 * t * length * 0.12;
    const tz = 1.6 + Math.PI * Math.cos(t * Math.PI) * 0.8;
    const tangent = new THREE.Vector3(tx, ty, tz).normalize();
    const up = new THREE.Vector3(0, 0, 1);
    let normal = new THREE.Vector3().crossVectors(tangent, up);
    if (normal.lengthSq() < 0.001) normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0));
    normal.normalize();
    const binorm = new THREE.Vector3().crossVectors(tangent, normal).normalize();

    for (let a = 0; a <= radialSegs; a++) {
      const theta = (a / radialSegs) * Math.PI * 2;
      const pe = superellipse(rx, rz, theta, 2.6);
      const wr = 0.08 * Math.sin(theta * 3 + t * 4);
      const vx = px + (normal.x * pe.x + binorm.x * pe.z) * (1 + wr * 0.04);
      const vy = py + (normal.y * pe.x + binorm.y * pe.z);
      const vz = pz + (normal.z * pe.x + binorm.z * pe.z);
      positions.push(vx, vy, vz);
      const upAmt = (normal.y * pe.x + binorm.y * pe.z) / Math.max(rz, 0.001);
      uvs.push(t, THREE.MathUtils.clamp(0.5 + 0.5 * upAmt, 0, 1));
    }
  }

  const cols = radialSegs + 1;
  for (let i = 0; i < pathSegs; i++) {
    for (let a = 0; a < radialSegs; a++) {
      const a0 = i * cols + a;
      const a1 = a0 + 1;
      const b0 = a0 + cols;
      const b1 = b0 + 1;
      indices.push(a0, b0, a1, a1, b0, b1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return { geometry: geo, length, hemRx, hemRz };
}

export function createCollarGeometry(m: Measurements, type: GarmentType) {
  const { rx } = ellipseRadii(m.chestFlat);
  const neckRx = Math.max(5.2, m.neckWidth * 0.34);
  const neckRz = neckRx * 0.78;
  const drop = type === "tank" ? 3.2 : 2.4;
  const points: THREE.Vector3[] = [];
  const segs = 64;
  for (let i = 0; i <= segs; i++) {
    const theta = (i / segs) * Math.PI * 2;
    const p = superellipse(neckRx, neckRz, theta, 2.4);
    const front = Math.max(0, Math.sin(theta));
    points.push(new THREE.Vector3(p.x, -front * drop, p.z + rx * 0.01));
  }
  const curve = new THREE.CatmullRomCurve3(points, true);
  const tube = new THREE.TubeGeometry(curve, 80, type === "hoodie" ? 1.05 : 1.2, 10, true);
  return tube;
}

export function createHemRingGeometry(m: Measurements) {
  const { rx, rz } = ellipseRadii(m.chestFlat);
  const sc = bodyScale(0, "tshirt");
  const points: THREE.Vector3[] = [];
  const segs = 64;
  for (let i = 0; i <= segs; i++) {
    const theta = (i / segs) * Math.PI * 2;
    const p = superellipse(rx * sc.width * 1.02, rz * sc.depth * 1.01, theta);
    points.push(new THREE.Vector3(p.x, 0.4, p.z));
  }
  const curve = new THREE.CatmullRomCurve3(points, true);
  return new THREE.TubeGeometry(curve, 80, 0.55, 8, true);
}

export function createHoodGeometry(m: Measurements) {
  const { rx } = ellipseRadii(m.chestFlat);
  const geo = new THREE.SphereGeometry(15.8 * (m.chestFlat / 55), 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.58);
  geo.scale(1.05, 0.92, 1.12);
  geo.translate(0, 0, -rx * 0.08);
  return geo;
}

export function createPocketGeometry(m: Measurements) {
  const w = m.chestFlat * 0.38;
  const h = 15;
  const shape = new THREE.Shape();
  const r = 1.8;
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.1, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.25, bevelSegments: 2 });
  geo.center();
  return geo;
}

export function createSleeveCapGeometry(hemRx: number, hemRz: number) {
  const geo = new THREE.CircleGeometry(1, 32);
  geo.rotateY(Math.PI / 2);
  geo.scale(1, hemRz, hemRx);
  return geo;
}

export function createNeckLiningGeometry(m: Measurements) {
  const neckRx = Math.max(4.8, m.neckWidth * 0.3);
  const geo = new THREE.CylinderGeometry(neckRx * 0.92, neckRx * 1.05, 4.5, 32, 1, true);
  return geo;
}

export function sleeveAttach(m: Measurements, type: GarmentType, side: 1 | -1) {
  const { rx } = ellipseRadii(m.chestFlat);
  const isShort = type === "tshirt";
  return {
    x: side * rx * 0.98,
    y: m.length - (isShort ? 8.5 : 9.5),
    z: 0.4,
    rotZ: side * (isShort ? 0.18 : 0.08),
    rotY: side * 0.12,
  };
}
