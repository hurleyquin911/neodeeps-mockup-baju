import { ptToPx } from "./garment";
import type { CanvasObject, ImageFilters, PrintArea } from "./types";

const EXPORT_PX_PER_CM = 50;

function applyFilters(ctx: CanvasRenderingContext2D, f?: ImageFilters) {
  if (!f) {
    ctx.filter = "none";
    return;
  }
  const parts = [
    `brightness(${1 + f.brightness})`,
    `contrast(${1 + f.contrast})`,
    `saturate(${1 + f.saturation})`,
    `blur(${f.blur}px)`,
    `grayscale(${f.grayscale})`,
    `sepia(${f.sepia})`,
    `invert(${f.invert})`,
  ];
  ctx.filter = parts.join(" ");
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function starPoints(cx: number, cy: number, spikes: number, outer: number, inner: number) {
  const pts: number[] = [];
  let rot = -Math.PI / 2;
  const step = Math.PI / spikes;
  for (let i = 0; i < spikes; i++) {
    pts.push(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
    rot += step;
    pts.push(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
    rot += step;
  }
  return pts;
}

function polygonPoints(cx: number, cy: number, sides: number, r: number) {
  const pts: number[] = [];
  for (let i = 0; i < sides; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / sides;
    pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  return pts;
}

function heartPath(x: number, y: number, w: number, h: number) {
  const p = new Path2D();
  p.moveTo(x + w / 2, y + h * 0.35);
  p.bezierCurveTo(x + w * 0.1, y, x, y + h * 0.45, x + w / 2, y + h);
  p.bezierCurveTo(x + w, y + h * 0.45, x + w * 0.9, y, x + w / 2, y + h * 0.35);
  return p;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function withObjectTransform(
  ctx: CanvasRenderingContext2D,
  obj: CanvasObject,
  pxPerCm: number,
  draw: () => void,
) {
  const x = obj.x * pxPerCm;
  const y = obj.y * pxPerCm;
  const w = obj.width * pxPerCm;
  const h = obj.height * pxPerCm;
  ctx.save();
  ctx.globalAlpha = obj.opacity;
  ctx.globalCompositeOperation = obj.blendMode;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((obj.rotation * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);
  if (obj.flipX || obj.flipY) {
    ctx.translate(obj.flipX ? w : 0, obj.flipY ? h : 0);
    ctx.scale(obj.flipX ? -1 : 1, obj.flipY ? -1 : 1);
  }
  if (obj.shadowEnabled) {
    ctx.shadowColor = obj.shadowColor;
    ctx.shadowBlur = obj.shadowBlur;
    ctx.shadowOffsetX = obj.shadowOffsetX * pxPerCm * 0.15;
    ctx.shadowOffsetY = obj.shadowOffsetY * pxPerCm * 0.15;
  }
  draw();
  ctx.restore();
}

function fillStroke(ctx: CanvasRenderingContext2D, obj: CanvasObject, pxPerCm: number) {
  if (obj.fill && obj.fill !== "transparent") {
    ctx.fillStyle = obj.fill;
    ctx.fill();
  }
  if (obj.stroke && obj.stroke !== "transparent" && obj.strokeWidth > 0) {
    ctx.strokeStyle = obj.stroke;
    ctx.lineWidth = obj.strokeWidth * pxPerCm * 0.1;
    ctx.stroke();
  }
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  obj: CanvasObject,
  pxPerCm: number,
) {
  const w = obj.width * pxPerCm;
  const h = obj.height * pxPerCm;
  const kind = obj.shape ?? "rect";
  ctx.beginPath();
  if (kind === "ellipse" || kind === "circle") {
    ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (kind === "roundRect") {
    roundRect(ctx, 0, 0, w, h, (obj.cornerRadius ?? 0.8) * pxPerCm);
  } else if (kind === "triangle") {
    const pts = polygonPoints(w / 2, h / 2, 3, Math.min(w, h) / 2);
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
  } else if (kind === "polygon") {
    const pts = polygonPoints(w / 2, h / 2, obj.sides ?? 6, Math.min(w, h) / 2);
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
  } else if (kind === "star") {
    const pts = starPoints(w / 2, h / 2, obj.sides ?? 5, Math.min(w, h) / 2, Math.min(w, h) / 4);
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
  } else if (kind === "diamond") {
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w, h / 2);
    ctx.lineTo(w / 2, h);
    ctx.lineTo(0, h / 2);
    ctx.closePath();
  } else if (kind === "heart") {
    ctx.fill(heartPath(0, 0, w, h));
    if (obj.stroke && obj.strokeWidth > 0) ctx.stroke(heartPath(0, 0, w, h));
    return;
  } else if (kind === "line") {
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.strokeStyle = obj.stroke === "transparent" ? obj.fill : obj.stroke;
    ctx.lineWidth = Math.max(1, obj.strokeWidth * pxPerCm * 0.12);
    ctx.stroke();
    return;
  } else if (kind === "arrow") {
    const head = (obj.pointerLength ?? 1.4) * pxPerCm;
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w - head, h / 2);
    ctx.strokeStyle = obj.stroke === "transparent" ? obj.fill : obj.stroke;
    ctx.lineWidth = Math.max(1, obj.strokeWidth * pxPerCm * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w, h / 2);
    ctx.lineTo(w - head, h / 2 - head * 0.55);
    ctx.lineTo(w - head, h / 2 + head * 0.55);
    ctx.closePath();
    ctx.fillStyle = obj.fill;
    ctx.fill();
    return;
  } else {
    ctx.rect(0, 0, w, h);
  }
  fillStroke(ctx, obj, pxPerCm);
}

async function drawObject(
  ctx: CanvasRenderingContext2D,
  obj: CanvasObject,
  pxPerCm: number,
) {
  if (!obj.visible) return;

  if (obj.type === "group" && obj.children) {
    withObjectTransform(ctx, obj, pxPerCm, () => {
      /* children drawn in local space below */
    });
    const x = obj.x * pxPerCm;
    const y = obj.y * pxPerCm;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((obj.rotation * Math.PI) / 180);
    for (const child of obj.children) {
      await drawObject(ctx, child, pxPerCm);
    }
    ctx.restore();
    return;
  }

  await new Promise<void>((resolve) => {
    withObjectTransform(ctx, obj, pxPerCm, () => {
      const w = obj.width * pxPerCm;
      const h = obj.height * pxPerCm;

      if (obj.type === "text") {
        const raw = obj.text ?? "";
        const text =
          obj.textTransform === "uppercase"
            ? raw.toUpperCase()
            : obj.textTransform === "lowercase"
              ? raw.toLowerCase()
              : raw;
        const size = ptToPx(obj.fontSize ?? 36, pxPerCm);
        const weight = obj.fontBold ? "700" : "400";
        const italic = obj.fontItalic ? "italic" : "normal";
        ctx.fillStyle = obj.fill;
        ctx.font = `${italic} ${weight} ${size}px "${obj.fontFamily ?? "Inter"}"`;
        ctx.textAlign = obj.textAlign ?? "center";
        ctx.textBaseline = "top";
        if (obj.letterSpacing) ctx.letterSpacing = `${obj.letterSpacing}px`;
        const align = obj.textAlign ?? "center";
        const tx = align === "left" ? 0 : align === "right" ? w : w / 2;
        const lines = text.split("\n");
        const lh = size * (obj.lineHeight ?? 1.15);
        lines.forEach((line, i) => {
          if (obj.stroke && obj.strokeWidth > 0 && obj.stroke !== "transparent") {
            ctx.strokeStyle = obj.stroke;
            ctx.lineWidth = obj.strokeWidth;
            ctx.strokeText(line, tx, i * lh);
          }
          ctx.fillText(line, tx, i * lh);
          if (obj.textDecoration === "underline") {
            const tw = ctx.measureText(line).width;
            const ux = align === "left" ? 0 : align === "right" ? w - tw : (w - tw) / 2;
            ctx.fillRect(ux, i * lh + size * 0.92, tw, Math.max(1, size * 0.06));
          }
          if (obj.textDecoration === "line-through") {
            const tw = ctx.measureText(line).width;
            const ux = align === "left" ? 0 : align === "right" ? w - tw : (w - tw) / 2;
            ctx.fillRect(ux, i * lh + size * 0.48, tw, Math.max(1, size * 0.06));
          }
        });
        resolve();
        return;
      }

      if (obj.type === "shape") {
        drawShape(ctx, obj, pxPerCm);
        resolve();
        return;
      }

      if (obj.type === "path") {
        if (obj.pathD) {
          const vb = obj.viewBox ?? 24;
          ctx.save();
          ctx.scale(w / vb, h / vb);
          const p = new Path2D(obj.pathD);
          ctx.fillStyle = obj.fill;
          ctx.fill(p);
          if (obj.strokeWidth > 0 && obj.stroke !== "transparent") {
            ctx.strokeStyle = obj.stroke;
            ctx.lineWidth = obj.strokeWidth;
            ctx.stroke(p);
          }
          ctx.restore();
        } else if (obj.points && obj.points.length >= 4) {
          ctx.beginPath();
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.strokeStyle = obj.fill;
          ctx.lineWidth = (obj.brushSize ?? 0.4) * pxPerCm;
          ctx.globalAlpha = obj.opacity;
          const pts = obj.points;
          ctx.moveTo(pts[0] * pxPerCm, pts[1] * pxPerCm);
          for (let i = 2; i < pts.length; i += 2) {
            ctx.lineTo(pts[i] * pxPerCm, pts[i + 1] * pxPerCm);
          }
          if (obj.closed) ctx.closePath();
          if (obj.closed && obj.fill) {
            ctx.fillStyle = obj.fill;
            ctx.fill();
          }
          ctx.stroke();
        }
        resolve();
        return;
      }

      if (obj.type === "image" && obj.src) {
        void loadImage(obj.src)
          .then((img) => {
            applyFilters(ctx, obj.filters);
            const cl = (obj.cropL ?? 0) * img.width;
            const ct = (obj.cropT ?? 0) * img.height;
            const cw = img.width * (1 - (obj.cropL ?? 0) - (obj.cropR ?? 0));
            const ch = img.height * (1 - (obj.cropT ?? 0) - (obj.cropB ?? 0));
            ctx.drawImage(img, cl, ct, cw, ch, 0, 0, w, h);
            ctx.filter = "none";
            resolve();
          })
          .catch(() => resolve());
        return;
      }

      resolve();
    });
  });
}

export async function bakeDesign(
  objects: CanvasObject[],
  print: PrintArea,
  pxPerCm = EXPORT_PX_PER_CM,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.round(print.width * pxPerCm));
  canvas.height = Math.max(2, Math.round(print.height * pxPerCm));
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const fonts = new Set<string>();
  for (const o of objects) {
    if (o.type === "text") {
      fonts.add(`${o.fontBold ? 700 : 400} ${ptToPx(o.fontSize ?? 36, pxPerCm)}px "${o.fontFamily ?? "Inter"}"`);
    }
  }
  if (document.fonts) {
    await Promise.allSettled([...fonts].map((f) => document.fonts.load(f)));
  }

  for (const obj of objects) {
    if (obj.visible) await drawObject(ctx, obj, pxPerCm);
  }
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png") {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), type);
  });
}

export { EXPORT_PX_PER_CM };
