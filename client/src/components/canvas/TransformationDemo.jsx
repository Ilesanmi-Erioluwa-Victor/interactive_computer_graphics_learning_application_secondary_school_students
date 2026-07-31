import { useState } from 'react';
import useCanvas from './useCanvas.js';

const TransformationDemo = ({ config = {} }) => {
  const shape = config.shape || 'rectangle';
  const base = {
    x: config.startX ?? 120,
    y: config.startY ?? 120,
    w: config.width ?? 100,
    h: config.height ?? 60,
  };
  const showMatrix = config.showMatrix ?? true;

  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [rot, setRot] = useState(0);
  const [sx, setSx] = useState(1);
  const [sy, setSy] = useState(1);

  const draw = (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    for (let i = 25; i < width; i += 25) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let j = 25; j < height; j += 25) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(width, j);
      ctx.stroke();
    }

    const rad = (rot * Math.PI) / 180;
    const a = sx * Math.cos(rad);
    const b = sx * Math.sin(rad);
    const c = -sy * Math.sin(rad);
    const d = sy * Math.cos(rad);

    const drawShape = (color, lineWidth, dashes = []) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.setLineDash(dashes);
      ctx.translate(tx, ty);
      ctx.transform(a, b, c, d, 0, 0);
      ctx.beginPath();
      if (shape === 'circle') {
        ctx.arc(base.x, base.y, Math.min(base.w, base.h) / 2, 0, Math.PI * 2);
      } else {
        ctx.rect(base.x, base.y, base.w, base.h);
      }
      ctx.stroke();
      ctx.restore();
    };

    drawShape('#d1d5db', 2, [6, 4]);

    drawShape('#2563eb', 3);
  };

  const { canvasRef } = useCanvas(draw, [tx, ty, rot, sx, sy, shape, base.x, base.y]);

  const rad = (rot * Math.PI) / 180;
  const matrix = {
    a: +(sx * Math.cos(rad)).toFixed(3),
    b: +(sx * Math.sin(rad)).toFixed(3),
    c: +(-sy * Math.sin(rad)).toFixed(3),
    d: +(sy * Math.cos(rad)).toFixed(3),
    e: tx,
    f: ty,
  };

  const reset = () => {
    setTx(0);
    setTy(0);
    setRot(0);
    setSx(1);
    setSy(1);
  };

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">2D Transformation Lab</h3>
        <button type="button" className="btn-secondary" onClick={reset}>
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white lg:col-span-2">
          <canvas
            ref={canvasRef}
            className="h-80 w-full"
            aria-label="Transformation canvas"
          />
          <p className="px-3 pb-2 text-xs text-gray-500">
            Gray outline: original shape. Blue shape: transformed.
          </p>
        </div>

        <div className="space-y-3">
          <Slider label="Translate X" value={tx} min={-200} max={300} onChange={setTx} />
          <Slider label="Translate Y" value={ty} min={-150} max={250} onChange={setTy} />
          <Slider label="Rotation (°)" value={rot} min={-180} max={180} onChange={setRot} />
          <Slider label="Scale X" value={sx} min={0.2} max={3} step={0.1} onChange={setSx} />
          <Slider label="Scale Y" value={sy} min={0.2} max={3} step={0.1} onChange={setSy} />

          {showMatrix && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Transformation matrix
              </p>
              <div className="grid grid-cols-3 gap-1 font-mono text-xs text-gray-700">
                <span>{matrix.a}</span>
                <span>{matrix.c}</span>
                <span>{matrix.e}</span>
                <span>{matrix.b}</span>
                <span>{matrix.d}</span>
                <span>{matrix.f}</span>
                <span>0</span>
                <span>0</span>
                <span>1</span>
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                Combined transform = Translate(tx,ty) · Rotate(θ) · Scale(sx,sy)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Slider = ({ label, value, min, max, step = 1, onChange }) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-sm">
      <span className="font-medium text-gray-600">{label}</span>
      <span className="font-mono text-gray-800">
        {step < 1 ? value.toFixed(1) : value}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full"
      aria-label={label}
    />
  </div>
);

export default TransformationDemo;
