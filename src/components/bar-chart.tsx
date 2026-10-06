"use client";

import { useState } from "react";

export interface Bar {
  key: string;
  /** Axis label under the bar. */
  label: string;
  value: number;
  /** Tooltip text, e.g. "Tue 30 Sep · 12 commands". */
  detail: string;
}

/** Clean tick step (1, 2, 5 × 10ⁿ) so the axis reads 0 / 5 / 10 … */
function niceMax(max: number, ticks = 4): { top: number; step: number } {
  if (max <= 0) return { top: ticks, step: 1 };
  const raw = max / ticks;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw)!;
  return { top: step * Math.ceil(max / step), step };
}

/**
 * Single-series column chart: ≤24px columns with 4px rounded tops on one baseline,
 * hairline grid, hover/focus tooltip, and a screen-reader table with the same data.
 */
export function BarChart({
  bars,
  height = 240,
  unit,
}: {
  bars: Bar[];
  height?: number;
  unit: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const { top, step } = niceMax(Math.max(...bars.map((b) => b.value), 0));
  const ticks = Array.from(
    { length: Math.round(top / step) + 1 },
    (_, i) => i * step,
  ).reverse();
  const labelEvery = Math.ceil(bars.length / 12);

  return (
    <figure className="relative">
      <div className="flex gap-3" style={{ height }} aria-hidden>
        <div className="flex flex-col justify-between pb-6 text-right text-xs text-muted tabular-nums">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0"
            >
              {tick.toLocaleString()}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
            {ticks.map((tick) => (
              <div key={tick} className="h-px bg-line" />
            ))}
          </div>
          <div className="absolute inset-x-0 top-0 bottom-0 flex items-end">
            {bars.map((bar, index) => (
              <div
                key={bar.key}
                className="relative flex h-full flex-1 flex-col items-center justify-end"
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
              >
                <div className="flex w-full flex-1 items-end justify-center pb-6">
                  <div
                    className={`w-[60%] max-w-6 rounded-t-[4px] transition-colors ${
                      active === index ? "bg-brand-600" : "bg-brand-500"
                    }`}
                    style={{
                      height: `${(bar.value / top) * 100}%`,
                      minHeight: bar.value > 0 ? 2 : 0,
                    }}
                  />
                </div>
                <span className="absolute bottom-0 text-xs whitespace-nowrap text-muted">
                  {index % labelEvery === 0 ? bar.label : ""}
                </span>
                {active === index && (
                  <span className="pointer-events-none absolute bottom-full z-10 mb-1 rounded-lg bg-ink px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow">
                    {bar.detail}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>{unit}</caption>
        <tbody>
          {bars.map((bar) => (
            <tr key={bar.key}>
              <th scope="row">{bar.label}</th>
              <td>{bar.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
