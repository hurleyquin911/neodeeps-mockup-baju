"use client";

import type { ReactNode } from "react";
import { GARMENT_COLORS } from "@/lib/editor/garment";

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
      {children}
    </div>
  );
}

export function PanelSection({
  title,
  children,
  extra,
}: {
  title: string;
  children: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <section className="border-b border-white/6 px-3 py-3">
      <div className="mb-2 flex items-center justify-between">
        <FieldLabel>{title}</FieldLabel>
        {extra}
      </div>
      {children}
    </section>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  step = 0.1,
  min,
  max,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-white/35">{label}</span>
      <div className="flex items-center gap-1 rounded-lg border border-white/8 bg-black/30 px-2 py-1.5 focus-within:border-[var(--accent)]/50">
        <input
          type="number"
          className="w-full min-w-0 bg-transparent text-[12px] text-white/90 outline-none"
          value={Number.isFinite(value) ? Number(value.toFixed(2)) : 0}
          step={step}
          min={min}
          max={max}
          onChange={(e) => {
            const n = e.target.valueAsNumber;
            if (Number.isNaN(n)) return;
            onChange(n);
          }}
        />
        {suffix ? <span className="text-[10px] text-white/30">{suffix}</span> : null}
      </div>
    </label>
  );
}

export function RangeField({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-white/35">
        <span>{label}</span>
        <span className="text-white/55">{Number(value.toFixed(2))}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        className="studio-range"
      />
    </label>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const hex = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#F4F1EA";
  return (
    <label className="flex items-center gap-2">
      {label ? <span className="w-16 text-[10px] uppercase tracking-wider text-white/35">{label}</span> : null}
      <input
        type="color"
        value={hex}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="h-8 w-8 cursor-pointer rounded-md border border-white/10 bg-transparent p-0"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 flex-1 rounded-lg border border-white/8 bg-black/30 px-2 font-mono text-[11px] text-white/80 outline-none focus:border-[var(--accent)]/50"
      />
    </label>
  );
}

export function GarmentColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-1.5">
        {GARMENT_COLORS.map((c) => (
          <button
            key={c.hex}
            type="button"
            title={c.name}
            onClick={() => onChange(c.hex)}
            className={`h-8 rounded-lg border ${
              value.toLowerCase() === c.hex.toLowerCase()
                ? "ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[#101218]"
                : "border-white/10"
            }`}
            style={{ background: c.hex }}
          />
        ))}
      </div>
      <div className="mt-3">
        <ColorField label="Custom" value={value} onChange={onChange} />
      </div>
    </div>
  );
}

export function Seg({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex rounded-lg border border-white/8 bg-black/25 p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition ${
            value === o.id ? "bg-white/12 text-white" : "text-white/45 hover:text-white/80"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function IconBtn({
  title,
  active,
  onClick,
  children,
  disabled,
}: {
  title: string;
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition disabled:opacity-30 ${
        active
          ? "bg-[var(--accent)]/18 text-[var(--accent)]"
          : "text-white/55 hover:bg-white/8 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
