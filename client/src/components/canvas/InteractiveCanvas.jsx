import { lazy, Suspense } from 'react';
import Loader from '../common/Loader.jsx';

const ShapeDrawingDemo = lazy(() => import('./ShapeDrawingDemo.jsx'));
const ColorMixerDemo = lazy(() => import('./ColorMixerDemo.jsx'));
const TransformationDemo = lazy(() => import('./TransformationDemo.jsx'));

const REGISTRY = {
  'canvas-shapes': ShapeDrawingDemo,
  'canvas-color': ColorMixerDemo,
  'canvas-transform': TransformationDemo,
};

const InteractiveCanvas = ({ type, config }) => {
  if (!type || type === 'none') return null;

  const DemoComponent = REGISTRY[type];
  if (!DemoComponent) {
    return (
      <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800" role="alert">
        Unknown interactive type: {type}
      </div>
    );
  }

  return (
    <Suspense fallback={<Loader fullScreen={false} />}>
      <DemoComponent config={config || {}} />
    </Suspense>
  );
};

export default InteractiveCanvas;
