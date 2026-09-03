"use client";

import { luminance } from "@/lib/editor/garment";
import type { GarmentLayout, PrintView } from "@/lib/editor/types";

export function GarmentSvg({
  layout,
  color,
  view,
  className,
}: {
  layout: GarmentLayout;
  color: string;
  view: PrintView;
  className?: string;
}) {
  const light = luminance(color) > 0.62;
  const stroke = light ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.16)";
  const inner = light ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="fabricSheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity={light ? 0.18 : 0.07} />
          <stop offset="45%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity={light ? 0.08 : 0.22} />
        </linearGradient>
        <filter id="softCloth" x="-8%" y="-8%" width="116%" height="116%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.35" result="b" />
          <feOffset dy="0.4" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0" />
          <feBlend in="SourceGraphic" />
        </filter>
      </defs>
      <path d={layout.path} fill={color} stroke={stroke} strokeWidth="0.35" filter="url(#softCloth)" />
      <path d={layout.path} fill="url(#fabricSheen)" />
      {layout.details ? (
        <path d={layout.details} fill="none" stroke={stroke} strokeWidth="0.28" opacity="0.7" />
      ) : null}
      {view === "back" ? (
        <rect
          x={layout.width / 2 - 1.2}
          y={layout.body.y + 2.4}
          width="2.4"
          height="1.4"
          rx="0.2"
          fill={inner}
          stroke={stroke}
          strokeWidth="0.15"
        />
      ) : null}
    </svg>
  );
}
