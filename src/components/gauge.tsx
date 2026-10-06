/** Half-donut gauge like the reference's "Monthly Target". `value` is 0-100. */
export function Gauge({ value, label }: { value: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 80;
  const circumference = Math.PI * radius;
  return (
    <figure
      className="relative mx-auto w-56"
      aria-label={`${label}: ${Math.round(clamped)}%`}
    >
      <svg viewBox="0 0 200 110" className="w-full" aria-hidden>
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="var(--color-brand-100)"
          strokeWidth="22"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="var(--color-brand-500)"
          strokeWidth="22"
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * circumference} ${circumference}`}
        />
      </svg>
      <figcaption className="absolute inset-x-0 bottom-1 text-center">
        <span className="block text-3xl font-bold text-ink tabular-nums">
          {Math.round(clamped)}%
        </span>
        <span className="text-xs text-muted">{label}</span>
      </figcaption>
    </figure>
  );
}
