"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

/* ── Tweaks Panel Styles ────────────────────────────────────────── */
const TWEAKS_CSS = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:pointer;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}
  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:pointer;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}
  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:pointer;padding:4px 6px;line-height:1.2}
  .twk-fab{position:fixed;right:16px;bottom:16px;z-index:2147483645;
    width:44px;height:44px;border-radius:14px;border:none;
    background:linear-gradient(135deg,#FFD300,#FFAA00);color:#1a1d23;
    font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;
    box-shadow:0 4px 14px rgba(255,211,0,0.4);transition:transform .2s}
  .twk-fab:hover{transform:scale(1.08)}
`;

/* ── TweaksPanel ────────────────────────────────────────────────── */
interface TweaksPanelProps {
  title?: string;
  children: React.ReactNode;
}

export function TweaksPanel({ title = "Tweaks", children }: TweaksPanelProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 16, y: 16 });

  const clamp = useCallback(() => {
    const el = panelRef.current;
    if (!el) return;
    const PAD = 16;
    const maxX = Math.max(PAD, window.innerWidth - el.offsetWidth - PAD);
    const maxY = Math.max(PAD, window.innerHeight - el.offsetHeight - PAD);
    offsetRef.current = {
      x: Math.min(maxX, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxY, Math.max(PAD, offsetRef.current.y)),
    };
    el.style.right = offsetRef.current.x + "px";
    el.style.bottom = offsetRef.current.y + "px";
  }, []);

  useEffect(() => {
    if (!open) return;
    clamp();
  }, [open, clamp]);

  const onDragStart = (e: React.MouseEvent) => {
    const el = panelRef.current;
    if (!el) return;
    const sx = e.clientX, sy = e.clientY;
    const startRight = window.innerWidth - el.getBoundingClientRect().right;
    const startBottom = window.innerHeight - el.getBoundingClientRect().bottom;
    const move = (ev: MouseEvent) => {
      offsetRef.current = { x: startRight - (ev.clientX - sx), y: startBottom - (ev.clientY - sy) };
      clamp();
    };
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <>
      <style>{TWEAKS_CSS}</style>
      {!open && (
        <button className="twk-fab" onClick={() => setOpen(true)} title="Open settings">⚙</button>
      )}
      {open && (
        <div ref={panelRef} className="twk-panel" style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}>
          <div className="twk-hd" onMouseDown={onDragStart}>
            <b>{title}</b>
            <button className="twk-x" onMouseDown={e => e.stopPropagation()} onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="twk-body">{children}</div>
        </div>
      )}
    </>
  );
}

/* ── Controls ────────────────────────────────────────────────────── */
export function TweakSection({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <>
      <div className="twk-sect">{label}</div>
      {children}
    </>
  );
}

export function TweakToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <button type="button" className="twk-toggle" data-on={value ? "1" : "0"} role="switch" aria-checked={!!value}
        onClick={() => onChange(!value)}><i /></button>
    </div>
  );
}

export function TweakRadio({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const idx = Math.max(0, options.indexOf(value));
  const n = options.length;

  const segAt = (clientX: number) => {
    if (!trackRef.current) return value;
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor(((clientX - r.left - 2) / inner) * n);
    return options[Math.max(0, Math.min(n - 1, i))];
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const v0 = segAt(e.clientX);
    if (v0 !== value) onChange(v0);
    const move = (ev: PointerEvent) => {
      const v = segAt(ev.clientX);
      if (v !== value) onChange(v);
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className="twk-row">
      <div className="twk-lbl"><span>{label}</span></div>
      <div ref={trackRef} role="radiogroup" onPointerDown={onPointerDown} className="twk-seg">
        <div className="twk-seg-thumb" style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`, width: `calc((100% - 4px) / ${n})` }} />
        {options.map(o => (
          <button key={o} type="button" role="radio" aria-checked={o === value}>{o}</button>
        ))}
      </div>
    </div>
  );
}
