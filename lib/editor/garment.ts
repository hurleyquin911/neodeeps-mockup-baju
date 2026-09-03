import type {
  GarmentLayout,
  GarmentType,
  Measurements,
  PrintArea,
  PrintView,
  SizeCode,
  Unit,
} from "./types";

export const GARMENT_LABEL: Record<GarmentType, string> = {
  tshirt: "Kaos Pendek",
  longsleeve: "Lengan Panjang",
  hoodie: "Hoodie",
  tank: "Tank Top",
};

export const SIZE_ORDER: SizeCode[] = ["S", "M", "L", "XL", "XXL", "3XL"];

export const VIEW_LABEL: Record<PrintView, string> = {
  front: "Depan",
  back: "Belakang",
  sleeveLeft: "Lengan Kiri",
  sleeveRight: "Lengan Kanan",
};

export const GARMENT_COLORS = [
  { name: "Putih", hex: "#F4F1EA" },
  { name: "Hitam", hex: "#1A1A1A" },
  { name: "Charcoal", hex: "#2F343A" },
  { name: "Abu Heather", hex: "#8D9096" },
  { name: "Navy", hex: "#1A2744" },
  { name: "Royal", hex: "#1E4B9C" },
  { name: "Sky", hex: "#5BA3D9" },
  { name: "Teal", hex: "#1A6B6B" },
  { name: "Forest", hex: "#1F4D32" },
  { name: "Olive", hex: "#5C6B4A" },
  { name: "Merah", hex: "#B42318" },
  { name: "Maroon", hex: "#7A1F2B" },
  { name: "Orange", hex: "#E25822" },
  { name: "Mustard", hex: "#D4A017" },
  { name: "Cream", hex: "#EDE4D3" },
  { name: "Coklat", hex: "#5D4037" },
  { name: "Pink", hex: "#E8A0BF" },
  { name: "Ungu", hex: "#4C1D77" },
  { name: "Mint", hex: "#A8D5C2" },
  { name: "Gold", hex: "#C9A227" },
] as const;

const TSHIRT: Record<SizeCode, Measurements> = {
  S: {
    chestFlat: 47, length: 67, shoulder: 41, sleeveLength: 20,
    sleeveOpening: 18, neckWidth: 16.5, neckDropFront: 8, neckDropBack: 2.5,
    armhole: 22, hem: 47,
  },
  M: {
    chestFlat: 50, length: 70, shoulder: 44, sleeveLength: 21,
    sleeveOpening: 19, neckWidth: 17, neckDropFront: 8.5, neckDropBack: 2.5,
    armhole: 23, hem: 50,
  },
  L: {
    chestFlat: 53, length: 73, shoulder: 47, sleeveLength: 22,
    sleeveOpening: 20, neckWidth: 17.5, neckDropFront: 9, neckDropBack: 2.8,
    armhole: 24, hem: 53,
  },
  XL: {
    chestFlat: 56, length: 76, shoulder: 50, sleeveLength: 23,
    sleeveOpening: 21, neckWidth: 18, neckDropFront: 9.2, neckDropBack: 3,
    armhole: 25, hem: 56,
  },
  XXL: {
    chestFlat: 59, length: 79, shoulder: 53, sleeveLength: 24,
    sleeveOpening: 22, neckWidth: 18.5, neckDropFront: 9.5, neckDropBack: 3,
    armhole: 26, hem: 59,
  },
  "3XL": {
    chestFlat: 62, length: 82, shoulder: 56, sleeveLength: 25,
    sleeveOpening: 23, neckWidth: 19, neckDropFront: 10, neckDropBack: 3.2,
    armhole: 27, hem: 62,
  },
};

function shift(base: Measurements, patch: Partial<Measurements>): Measurements {
  return { ...base, ...patch };
}

const LONGSLEEVE: Record<SizeCode, Measurements> = {
  S: shift(TSHIRT.S, { sleeveLength: 58, sleeveOpening: 10 }),
  M: shift(TSHIRT.M, { sleeveLength: 60, sleeveOpening: 10.5 }),
  L: shift(TSHIRT.L, { sleeveLength: 62, sleeveOpening: 11 }),
  XL: shift(TSHIRT.XL, { sleeveLength: 64, sleeveOpening: 11.5 }),
  XXL: shift(TSHIRT.XXL, { sleeveLength: 66, sleeveOpening: 12 }),
  "3XL": shift(TSHIRT["3XL"], { sleeveLength: 68, sleeveOpening: 12.5 }),
};

const HOODIE: Record<SizeCode, Measurements> = {
  S: shift(TSHIRT.S, { chestFlat: 52, hem: 52, length: 66, sleeveLength: 60, shoulder: 44, neckWidth: 18, sleeveOpening: 10 }),
  M: shift(TSHIRT.M, { chestFlat: 55, hem: 55, length: 69, sleeveLength: 62, shoulder: 47, neckWidth: 18.5, sleeveOpening: 10.5 }),
  L: shift(TSHIRT.L, { chestFlat: 58, hem: 58, length: 72, sleeveLength: 64, shoulder: 50, neckWidth: 19, sleeveOpening: 11 }),
  XL: shift(TSHIRT.XL, { chestFlat: 61, hem: 61, length: 75, sleeveLength: 66, shoulder: 53, neckWidth: 19.5, sleeveOpening: 11.5 }),
  XXL: shift(TSHIRT.XXL, { chestFlat: 64, hem: 64, length: 78, sleeveLength: 68, shoulder: 56, neckWidth: 20, sleeveOpening: 12 }),
  "3XL": shift(TSHIRT["3XL"], { chestFlat: 67, hem: 67, length: 81, sleeveLength: 70, shoulder: 59, neckWidth: 20.5, sleeveOpening: 12.5 }),
};

const TANK: Record<SizeCode, Measurements> = {
  S: shift(TSHIRT.S, { sleeveLength: 0, neckWidth: 20, neckDropFront: 12, armhole: 28, shoulder: 8 }),
  M: shift(TSHIRT.M, { sleeveLength: 0, neckWidth: 21, neckDropFront: 12.5, armhole: 29, shoulder: 9 }),
  L: shift(TSHIRT.L, { sleeveLength: 0, neckWidth: 22, neckDropFront: 13, armhole: 30, shoulder: 10 }),
  XL: shift(TSHIRT.XL, { sleeveLength: 0, neckWidth: 23, neckDropFront: 13.5, armhole: 31, shoulder: 11 }),
  XXL: shift(TSHIRT.XXL, { sleeveLength: 0, neckWidth: 24, neckDropFront: 14, armhole: 32, shoulder: 12 }),
  "3XL": shift(TSHIRT["3XL"], { sleeveLength: 0, neckWidth: 25, neckDropFront: 14.5, armhole: 33, shoulder: 13 }),
};

const CHART: Record<GarmentType, Record<SizeCode, Measurements>> = {
  tshirt: TSHIRT,
  longsleeve: LONGSLEEVE,
  hoodie: HOODIE,
  tank: TANK,
};

export function getMeasurements(type: GarmentType, size: SizeCode): Measurements {
  return CHART[type][size];
}

export function ellipseRadii(chestFlat: number) {
  const circ = chestFlat * 2;
  const aspect = 1.58;
  const meanR = circ / (2 * Math.PI);
  const rz = Math.sqrt((2 * meanR * meanR) / (aspect * aspect + 1));
  const rx = aspect * rz;
  return { rx, rz, circ };
}

export function scalePath(d: string, s: number) {
  return d.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, (m) => {
    const n = parseFloat(m) * s;
    return String(Math.round(n * 1000) / 1000);
  });
}

export function buildGarmentLayout(type: GarmentType, size: SizeCode): GarmentLayout {
  const m = getMeasurements(type, size);
  const hoodH = type === "hoodie" ? 14 : 0;
  const isLong = type === "longsleeve" || type === "hoodie";
  const sleeveOut = type === "tank" ? 0 : isLong ? Math.min(m.sleeveLength * 0.38, 26) : m.sleeveLength * 0.9;

  const bodyW = m.chestFlat;
  const totalW = bodyW + sleeveOut * 2 + 6;
  const totalH = hoodH + m.length + 3;
  const cx = totalW / 2;
  const top = hoodH + 1;
  const neckW = type === "tank" ? m.neckWidth + 4 : m.neckWidth;
  const neckDrop = m.neckDropFront;
  const sh = type === "tank" ? m.chestFlat * 0.34 : m.shoulder / 2;
  const chestH = bodyW / 2;
  const hemH = m.hem / 2;
  const armY = top + m.armhole * (type === "tank" ? 0.95 : 0.92);
  const hemY = top + m.length;
  const sleeveDrop = type === "tank" ? 0 : isLong ? m.sleeveLength * 0.22 : m.sleeveLength * 0.95;

  const nl = cx - neckW / 2;
  const nr = cx + neckW / 2;
  const neckY = top + (type === "hoodie" ? 4 : 3.2);

  let path = "";
  let details = "";

  if (type === "hoodie") {
    path += `M ${nl} ${neckY + 2}
      C ${nl - 2} ${top - 2}, ${cx - 16} ${top - hoodH + 1}, ${cx} ${top - hoodH + 0.5}
      C ${cx + 16} ${top - hoodH + 1}, ${nr + 2} ${top - 2}, ${nr} ${neckY + 2}`;
  }

  path += `${type === "hoodie" ? "L" : "M"} ${nr} ${neckY}
    C ${nr + 1.2} ${neckY - 0.8}, ${cx + 2} ${top + neckDrop}, ${cx} ${top + neckDrop}
    C ${cx - 2} ${top + neckDrop}, ${nl - 1.2} ${neckY - 0.8}, ${nl} ${neckY}`;

  if (type === "tank") {
    const armIn = cx + chestH * 0.72;
    path += `
      L ${cx + sh} ${neckY + 1.5}
      C ${cx + sh + 6} ${neckY + 8}, ${armIn} ${armY - 8}, ${cx + chestH - 1} ${armY}
      L ${cx + hemH} ${hemY}
      Q ${cx} ${hemY + 1.2} ${cx - hemH} ${hemY}
      L ${cx - chestH + 1} ${armY}
      C ${cx - sh - 6} ${armY - 8}, ${cx - sh - 6} ${neckY + 8}, ${cx - sh} ${neckY + 1.5}
      Z`;
  } else {
    const sExt = sleeveOut;
    path += `
      L ${cx + sh} ${neckY + 0.8}
      L ${cx + sh + sExt} ${neckY + 4.5}
      Q ${cx + sh + sExt + 1.4} ${neckY + 5 + sleeveDrop * 0.15} ${cx + sh + sExt - 1} ${neckY + sleeveDrop}
      L ${cx + chestH} ${armY}
      L ${cx + hemH} ${hemY}
      Q ${cx} ${hemY + 1.1} ${cx - hemH} ${hemY}
      L ${cx - chestH} ${armY}
      L ${cx - sh - sExt + 1} ${neckY + sleeveDrop}
      Q ${cx - sh - sExt - 1.4} ${neckY + 5 + sleeveDrop * 0.15} ${cx - sh - sExt} ${neckY + 4.5}
      L ${cx - sh} ${neckY + 0.8}
      Z`;
  }

  if (type === "hoodie") {
    const pw = bodyW * 0.52;
    const ph = 16;
    const px = cx - pw / 2;
    const py = top + m.length * 0.42;
    details += `M ${px} ${py} Q ${cx} ${py - 2.2} ${px + pw} ${py} L ${px + pw} ${py + ph} Q ${cx} ${py + ph + 1.4} ${px} ${py + ph} Z`;
    details += ` M ${cx} ${py + 1} L ${cx} ${py + ph - 0.6}`;
  }

  const full: PrintArea = { x: 0, y: 0, width: totalW, height: totalH };
  const body: PrintArea = {
    x: cx - chestH,
    y: top,
    width: bodyW,
    height: m.length,
  };
  const sleeveLeft: PrintArea = {
    x: Math.max(0, cx - sh - sleeveOut),
    y: neckY,
    width: Math.max(1, sleeveOut),
    height: Math.max(8, sleeveDrop),
  };
  const sleeveRight: PrintArea = {
    x: cx + sh,
    y: neckY,
    width: Math.max(1, sleeveOut),
    height: Math.max(8, sleeveDrop),
  };

  return {
    width: totalW,
    height: totalH,
    bodyTop: top,
    path: path.replace(/\s+/g, " ").trim(),
    details: details.replace(/\s+/g, " ").trim(),
    print: {
      front: full,
      back: full,
      sleeveLeft: full,
      sleeveRight: full,
    },
    body,
    sleeveBox: { left: sleeveLeft, right: sleeveRight },
    measurements: m,
  };
}

export function hasSleeves(type: GarmentType) {
  return type !== "tank";
}

export function ptToPx(pt: number, pxPerCm: number) {
  return (pt / 72) * 2.54 * pxPerCm;
}

export function pxToPt(px: number, pxPerCm: number) {
  return (px / pxPerCm / 2.54) * 72;
}

export function cmToUnit(cm: number, unit: Unit) {
  return unit === "in" ? cm / 2.54 : cm;
}

export function unitToCm(value: number, unit: Unit) {
  return unit === "in" ? value * 2.54 : value;
}

export function formatLen(cm: number, unit: Unit, digits = 1) {
  const v = cmToUnit(cm, unit);
  return `${v.toFixed(digits)} ${unit}`;
}

export function luminance(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
