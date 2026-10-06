"use client";

import { Lock, Pipette, Sparkles } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { sendCommand, setDeviceState } from "@/lib/actions";
import type { Device, DeviceState } from "@/lib/types";
import { button, card, cardTitle, input } from "./styles";
import { Switch } from "./ui";

/**
 * Local edits on top of the device's desired state, flushed as one merge patch
 * 150 ms after the last change so sliders don't flood the device.
 */
function useDesiredState(device: Device) {
  const [draft, setDraft] = useState<DeviceState>({});
  const [error, setError] = useState<string>();
  const pending = useRef<DeviceState>({});
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const value = <T,>(key: string, fallback: T): T =>
    (key in draft ? draft[key] : (device.desiredState[key] ?? fallback)) as T;

  const change = (patch: DeviceState, delay = 150) => {
    setDraft((current) => ({ ...current, ...patch }));
    pending.current = { ...pending.current, ...patch };
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const sent = pending.current;
      pending.current = {};
      const result = await setDeviceState(device.id, sent);
      setError(result?.error);
      // Drop local values the server now has (keep anything changed meanwhile).
      setDraft((current) =>
        Object.fromEntries(
          Object.entries(current).filter(
            ([key, v]) => !(key in sent) || sent[key] !== v,
          ),
        ),
      );
    }, delay);
  };

  return { value, change, error };
}

function Reported({ value, suffix = "" }: { value: unknown; suffix?: string }) {
  return (
    <p className="text-xs text-muted">
      {value === undefined
        ? "No report from the device yet"
        : `Device reports ${String(value)}${suffix}`}
    </p>
  );
}

function Section({
  title,
  children,
  aside,
}: {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-line pt-5 first:border-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Slider({
  id,
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  disabled,
  trackStyle,
  format,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
  trackStyle?: React.CSSProperties;
  format: (value: number) => string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-sm">
        <label htmlFor={id} className="text-muted">
          {label}
        </label>
        <output htmlFor={id} className="font-medium tabular-nums">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-auto rounded-full disabled:cursor-not-allowed"
        style={trackStyle}
      />
    </div>
  );
}

function ReadOnlyNote() {
  return (
    <p className="flex items-center gap-2 rounded-xl bg-cream px-3 py-2 text-sm text-muted">
      <Lock className="h-4 w-4" aria-hidden /> Viewers can see settings but not
      change them.
    </p>
  );
}

// --- Fan + LED -----------------------------------------------------------------

export function FanLedControls({
  device,
  canControl,
}: {
  device: Device;
  canControl: boolean;
}) {
  const { value, change, error } = useDesiredState(device);
  const speed = value("speed", 0);
  const light = value("light", false);

  return (
    <div className={`${card} space-y-5`}>
      <h2 className={cardTitle}>Controls</h2>
      {!canControl && <ReadOnlyNote />}

      <Section title="Fan">
        <Slider
          id="fan-speed"
          label="Speed"
          min={0}
          max={100}
          value={speed}
          disabled={!canControl}
          onChange={(v) => change({ speed: v })}
          format={(v) => (v === 0 ? "Off" : `${v}%`)}
        />
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Speed presets"
        >
          {[0, 25, 50, 75, 100].map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={!canControl}
              aria-pressed={speed === preset}
              onClick={() => change({ speed: preset }, 0)}
              className={`rounded-full border px-3 py-1 text-sm transition disabled:opacity-50 ${
                speed === preset
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-line bg-white hover:bg-brand-50"
              }`}
            >
              {preset === 0 ? "Off" : `${preset}%`}
            </button>
          ))}
        </div>
        <Reported value={device.reportedState.speed} suffix="%" />
      </Section>

      <Section
        title="Light"
        aside={
          <Switch
            checked={light}
            label="Light"
            disabled={!canControl}
            onChange={(on) => change({ light: on }, 0)}
          />
        }
      >
        <Reported
          value={
            device.reportedState.light === undefined
              ? undefined
              : device.reportedState.light
                ? "on"
                : "off"
          }
        />
      </Section>

      {error && (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      )}
    </div>
  );
}

// --- Monitor bar light ----------------------------------------------------------

const SWATCHES = [
  "#ff3b30",
  "#ff9500",
  "#ffcc00",
  "#34c759",
  "#00c7be",
  "#007aff",
  "#5856d6",
  "#ff2d55",
];
const WHITE_PRESETS = [
  { label: "Warm", kelvin: 2700 },
  { label: "Neutral", kelvin: 4000 },
  { label: "Daylight", kelvin: 6500 },
];
const EFFECTS = [
  { key: "rainbow", label: "Rainbow" },
  { key: "breathe", label: "Breathe" },
  { key: "strobe", label: "Strobe" },
];

export function RgbBarControls({
  device,
  canControl,
}: {
  device: Device;
  canControl: boolean;
}) {
  const { value, change, error } = useDesiredState(device);
  const on = value("on", false);
  const mode = value<"color" | "white">("mode", "color");
  const color = value("color", "#ff9500");
  const colorTemp = value("colorTemp", 4000);
  const brightness = value("brightness", 80);
  const [duration, setDuration] = useState(60);
  const [effectMessage, setEffectMessage] = useState<string>();
  const reported = device.reportedState;

  async function playEffect(effect: string) {
    const result = await sendCommand(device.id, "play_effect", {
      effect,
      durationSec: duration,
    });
    setEffectMessage(
      result?.error ??
        `${effect} sent — it plays for ${duration < 60 ? `${duration}s` : `${duration / 60} min`}.`,
    );
  }

  return (
    <div className={`${card} space-y-5`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={cardTitle}>Controls</h2>
        <Switch
          checked={on}
          label="Power"
          disabled={!canControl}
          onChange={(v) => change({ on: v }, 0)}
        />
      </div>
      {!canControl && <ReadOnlyNote />}

      <Section title="Mode">
        <div
          className="inline-flex rounded-xl border border-line bg-cream p-1"
          role="radiogroup"
          aria-label="Light mode"
        >
          {(["color", "white"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              disabled={!canControl}
              onClick={() => change({ mode: m }, 0)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
                mode === m
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              {m === "color" ? "Colour" : "White"}
            </button>
          ))}
        </div>
      </Section>

      {mode === "color" ? (
        <Section title="Colour">
          <div className="flex flex-wrap items-center gap-2">
            <label
              className="relative grid h-10 w-10 cursor-pointer place-items-center overflow-hidden rounded-full shadow ring-1 ring-line"
              style={{
                background:
                  "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
              }}
              title="Custom colour"
            >
              <span className="sr-only">Custom colour</span>
              <Pipette
                className="pointer-events-none relative z-10 h-4 w-4 text-white drop-shadow"
                aria-hidden
              />
              <input
                type="color"
                value={color}
                disabled={!canControl}
                onChange={(event) => change({ color: event.target.value })}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
            {SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                disabled={!canControl}
                aria-label={`Colour ${swatch}`}
                aria-pressed={color.toLowerCase() === swatch}
                onClick={() => change({ color: swatch }, 0)}
                className={`h-8 w-8 rounded-full ring-offset-2 transition disabled:opacity-50 ${
                  color.toLowerCase() === swatch
                    ? "ring-2 ring-ink"
                    : "ring-1 ring-black/10"
                }`}
                style={{ background: swatch }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-4 w-4 rounded-full ring-1 ring-black/10"
              style={{ background: color }}
              aria-hidden
            />
            <span className="font-mono text-sm">{color}</span>
          </div>
          <Reported value={reported.color} />
        </Section>
      ) : (
        <Section title="White">
          <Slider
            id="colour-temp"
            label="Colour temperature"
            min={2700}
            max={6500}
            step={100}
            value={colorTemp}
            disabled={!canControl}
            onChange={(v) => change({ colorTemp: v })}
            format={(v) => `${v} K`}
            trackStyle={{
              background:
                "linear-gradient(90deg, #ffb46b, #fff4e5 55%, #cfe3ff)",
            }}
          />
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="White presets"
          >
            {WHITE_PRESETS.map((preset) => (
              <button
                key={preset.kelvin}
                type="button"
                disabled={!canControl}
                aria-pressed={colorTemp === preset.kelvin}
                onClick={() => change({ colorTemp: preset.kelvin }, 0)}
                className={`rounded-full border px-3 py-1 text-sm transition disabled:opacity-50 ${
                  colorTemp === preset.kelvin
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-line bg-white hover:bg-brand-50"
                }`}
              >
                {preset.label} · {preset.kelvin} K
              </button>
            ))}
          </div>
          <Reported value={reported.colorTemp} suffix=" K" />
        </Section>
      )}

      <Section title="Brightness">
        <Slider
          id="brightness"
          label="Brightness"
          min={0}
          max={100}
          value={brightness}
          disabled={!canControl}
          onChange={(v) => change({ brightness: v })}
          format={(v) => `${v}%`}
        />
        <Reported value={reported.brightness} suffix="%" />
      </Section>

      <Section title="Effects">
        <div className="flex flex-wrap items-center gap-2">
          {EFFECTS.map((effect) => (
            <button
              key={effect.key}
              type="button"
              disabled={!canControl}
              onClick={() => playEffect(effect.key)}
              className={button.secondary}
            >
              <Sparkles className="h-4 w-4 text-brand-600" aria-hidden />
              {effect.label}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-sm text-muted">
            For
            <select
              value={duration}
              disabled={!canControl}
              onChange={(event) => setDuration(Number(event.target.value))}
              className={`${input} w-auto py-1.5`}
            >
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={300}>5 minutes</option>
              <option value={900}>15 minutes</option>
            </select>
          </label>
        </div>
        {effectMessage && (
          <p className="text-sm text-muted" role="status">
            {effectMessage}
          </p>
        )}
      </Section>

      {error && (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      )}
    </div>
  );
}
