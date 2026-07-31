import { useEffect, useRef } from 'react';

const setupCanvas = (canvas) => {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
};

const getEventPoint = (e, canvas) => {
  const rect = canvas.getBoundingClientRect();
  const source = e.touches?.[0] || e;
  return {
    x: (source.clientX || 0) - rect.left,
    y: (source.clientY || 0) - rect.top,
  };
};

const useCanvas = (draw, deps = []) => {
  const canvasRef = useRef(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.getContext !== 'function') return;

    const render = () => {
      const { ctx, width, height } = setupCanvas(canvas);
      drawRef.current(ctx, width, height);
    };

    render();
    const onResize = () => render();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { canvasRef, setupCanvas, getEventPoint };
};

export { setupCanvas, getEventPoint, useCanvas };
export default useCanvas;
