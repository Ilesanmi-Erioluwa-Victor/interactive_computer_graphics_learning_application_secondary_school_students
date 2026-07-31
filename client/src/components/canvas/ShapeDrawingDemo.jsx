import { useState } from 'react';
import useCanvas, { getEventPoint } from './useCanvas.js';

const TOOLS = [
  { id: 'line', label: 'Line', icon: 'M4 20L20 4' },
  { id: 'rectangle', label: 'Rectangle', icon: 'M4 5h16v14H4z' },
  { id: 'circle', label: 'Circle', icon: 'M12 4a8 8 0 100 16 8 8 0 000-16z' },
  { id: 'polygon', label: 'Polygon', icon: 'M12 3l9 6-9 12-9-12z' },
];

const ShapeDrawingDemo = ({ config = {} }) => {
  const shapes = config.shapes?.length ? config.shapes : TOOLS.map((t) => t.id);
  const tolerance = config.tolerance ?? 20;
  const practiceMode = config.practiceMode ?? true;
  const targetShape = config.targetShape || (shapes.includes('circle') ? 'circle' : shapes[0]);

  const [tool, setTool] = useState(shapes[0] || 'line');
  const [color, setColor] = useState('#2563eb');
  const [elements, setElements] = useState([]);
  const [current, setCurrent] = useState(null);
  const [polyPoints, setPolyPoints] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const draw = (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    elements.forEach((el) => drawElement(ctx, el));
    if (current) drawElement(ctx, current);
    if (polyPoints.length > 0) {
      ctx.strokeStyle = '#9ca3af';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(polyPoints[0].x, polyPoints[0].y);
      polyPoints.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const drawElement = (ctx, el) => {
    ctx.strokeStyle = el.color;
    ctx.fillStyle = el.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (el.type === 'line') {
      ctx.moveTo(el.x1, el.y1);
      ctx.lineTo(el.x2, el.y2);
    } else if (el.type === 'rectangle') {
      ctx.rect(el.x1, el.y1, el.x2 - el.x1, el.y2 - el.y1);
    } else if (el.type === 'circle') {
      const rx = Math.abs(el.x2 - el.x1) / 2;
      const ry = Math.abs(el.y2 - el.y1) / 2;
      const cx = (el.x1 + el.x2) / 2;
      const cy = (el.y1 + el.y2) / 2;
      ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
    } else if (el.type === 'polygon') {
      el.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
    }
    ctx.stroke();
  };

  const { canvasRef } = useCanvas(draw, [elements, current, polyPoints]);

  const isShapeAllowed = (t) => shapes.includes(t);

  const onDown = (e) => {
    e.preventDefault();
    const p = getEventPoint(e, canvasRef.current);
    if (tool === 'polygon') {
      setPolyPoints((pts) => [...pts, p]);
      return;
    }
    setCurrent({ type: tool, color, x1: p.x, y1: p.y, x2: p.x, y2: p.y, points: [] });
  };

  const onMove = (e) => {
    if (!current) return;
    const p = getEventPoint(e, canvasRef.current);
    setCurrent({ ...current, x2: p.x, y2: p.y });
  };

  const onUp = () => {
    if (current) {
      setElements((els) => [...els, current]);
      setCurrent(null);
      validateElements([...elements, current]);
    }
  };

  const onDoubleClick = (e) => {
    if (tool !== 'polygon') return;
    e.preventDefault();
    if (polyPoints.length < 3) {
      setPolyPoints([]);
      return;
    }
    const poly = { type: 'polygon', color, points: polyPoints };
    setElements((els) => [...els, poly]);
    setPolyPoints([]);
    validateElements([...elements, poly]);
  };

  const validateElements = (els) => {
    if (!practiceMode) return;
    const polyCount = els.filter((el) => el.type === 'polygon').length;
    const last = els[els.length - 1];
    if (!last) return;

    let correct = false;
    if (last.type === 'line') correct = true;
    if (last.type === 'rectangle') correct = true;
    if (last.type === 'circle') {
      const rx = Math.abs(last.x2 - last.x1) / 2;
      const ry = Math.abs(last.y2 - last.y1) / 2;
      const ratio = Math.min(rx, ry) / Math.max(rx, ry);
      correct = ratio > 0.75;
    }
    if (last.type === 'polygon') correct = polyCount >= 1;

    if (correct) {
      setFeedback({ ok: true, message: 'Great! Correct shape drawn.' });
    } else {
      setFeedback({
        ok: false,
        message: `Almost — draw a "${targetShape}" that is within tolerance (${tolerance}px).`,
      });
    }
  };

  const undo = () => {
    setElements((els) => els.slice(0, -1));
    setFeedback(null);
  };

  const reset = () => {
    setElements([]);
    setPolyPoints([]);
    setCurrent(null);
    setFeedback(null);
  };

  const canvasSupported = typeof document !== 'undefined' && !!document.createElement('canvas').getContext;

  if (!canvasSupported) {
    return (
      <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800" role="alert">
        Your browser does not support the HTML5 Canvas API. Please use a modern browser.
      </div>
    );
  }

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Shape Drawing Lab</h3>
        {feedback && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              feedback.ok ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}
            role="status"
          >
            {feedback.message}
          </span>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-gray-200 p-1">
          {TOOLS.filter((t) => isShapeAllowed(t.id)).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTool(t.id);
                setPolyPoints([]);
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tool === t.id ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-pressed={tool === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          Color
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded border border-gray-200"
            aria-label="Stroke color"
          />
        </label>
        <div className="ml-auto flex gap-2">
          <button type="button" className="btn-secondary" onClick={undo} disabled={elements.length === 0}>
            Undo
          </button>
          <button type="button" className="btn-secondary" onClick={reset}>
            Reset
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <canvas
          ref={canvasRef}
          className="h-80 w-full touch-none cursor-crosshair"
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onDown}
          onTouchMove={(e) => {
            e.preventDefault();
            onMove(e);
          }}
          onTouchEnd={onUp}
          onDoubleClick={onDoubleClick}
          aria-label="Shape drawing canvas"
        />
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {tool === 'polygon'
          ? 'Click to add vertices, double-click to close the polygon.'
          : `Drag on the canvas to draw a ${tool}.`}
        {practiceMode && ` Practice mode: draw a "${targetShape}".`}
      </p>
    </div>
  );
};

export default ShapeDrawingDemo;
