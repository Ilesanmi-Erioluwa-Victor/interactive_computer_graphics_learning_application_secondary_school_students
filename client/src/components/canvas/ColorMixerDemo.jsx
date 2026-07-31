import { useState } from 'react';

const rgbToHex = (r, g, b) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
};

const distance = (c1, c2) =>
  Math.abs(c1.r - c2.r) + Math.abs(c1.g - c2.g) + Math.abs(c1.b - c2.b);

const ColorMixerDemo = ({ config = {} }) => {
  const showHex = config.showHex ?? true;
  const showRgb = config.showRgb ?? true;
  const quizMode = config.quizMode ?? false;
  const initialHex = config.swatchColor || '#ff6633';

  const [target] = useState(() => (quizMode ? config.targetColor || '#6633ff' : null));
  const [rgb, setRgb] = useState(() => (quizMode ? { r: 128, g: 128, b: 128 } : hexToRgb(initialHex)));
  const [checked, setChecked] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

  const setChannel = (channel, value) => {
    setRgb((prev) => ({ ...prev, [channel]: Number(value) }));
    setChecked(false);
    setLastResult(null);
  };

  const setHex = (value) => {
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      const parsed = hexToRgb(value);
      setRgb(parsed);
      setChecked(false);
      setLastResult(null);
    }
  };

  const reset = () => {
    setRgb(quizMode ? { r: 128, g: 128, b: 128 } : hexToRgb(initialHex));
    setChecked(false);
    setLastResult(null);
  };

  const check = () => {
    const dist = distance(rgb, target ? hexToRgb(target) : hexToRgb(initialHex));
    setChecked(true);
    setLastResult(dist);
  };

  const perfect = lastResult === 0;

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Color Mixer Lab</h3>
        <button type="button" className="btn-secondary" onClick={reset}>
          Reset
        </button>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div
          className="h-24 w-24 shrink-0 rounded-xl border-4 border-white shadow-md transition-colors"
          style={{ backgroundColor: quizMode ? (checked ? hex : target) : hex }}
          aria-label="Color swatch"
        />
        <div className="flex-1">
          {quizMode && (
            <p className="mb-2 text-sm text-gray-700">
              Match the target color:{' '}
              <span className="font-mono font-semibold">{target}</span>
            </p>
          )}
          {showHex && (
            <div className="mb-2 flex items-center gap-2">
              <label htmlFor="hex-input" className="text-sm font-medium text-gray-600">
                HEX
              </label>
              <input
                id="hex-input"
                className="input-field w-28 font-mono"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                disabled={quizMode}
              />
            </div>
          )}
          {showRgb && (
            <p className="text-sm text-gray-600">
              RGB ({rgb.r}, {rgb.g}, {rgb.b})
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {[
          { label: 'Red', channel: 'r', color: '#ef4444' },
          { label: 'Green', channel: 'g', color: '#22c55e' },
          { label: 'Blue', channel: 'b', color: '#3b82f6' },
        ].map(({ label, channel, color }) => (
          <div key={channel} className="flex items-center gap-3">
            <span className="w-14 text-sm font-medium text-gray-600" style={{ color }}>
              {label}
            </span>
            <input
              type="range"
              min="0"
              max="255"
              value={rgb[channel]}
              onChange={(e) => setChannel(channel, e.target.value)}
              className="flex-1"
              aria-label={`${label} slider`}
            />
            <span className="w-10 text-right font-mono text-sm text-gray-700">{rgb[channel]}</span>
          </div>
        ))}
      </div>

      {quizMode && (
        <div className="mt-4 flex items-center gap-3">
          <button type="button" className="btn-primary" onClick={check} disabled={checked}>
            Check my mix
          </button>
          {checked && (
            <span
              className={`text-sm font-semibold ${perfect ? 'text-green-600' : 'text-amber-600'}`}
              role="status"
            >
              {perfect
                ? 'Perfect match! You made the target color.'
                : `Not quite — off by ${lastResult} units. Try again.`}
            </span>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-gray-500">
        Computer displays use the additive RGB color model. Mixing red, green and blue light of
        different intensities produces millions of colors.
      </p>
    </div>
  );
};

export default ColorMixerDemo;
