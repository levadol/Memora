interface SVGLineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  emptyLabel?: string;
}

export function SVGLineChart({
  data,
  width = 300,
  height = 72,
  color = "var(--color-accent)",
  emptyLabel = "—",
}: SVGLineChartProps) {
  if (data.length < 2) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-sm text-[var(--color-text-secondary)]"
      >
        {emptyLabel}
      </div>
    );
  }

  const pad = 6;
  const W = width - pad * 2;
  const H = height - pad * 2;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * W;
    const y = pad + H - ((v - min) / range) * H;
    return [x, y] as [number, number];
  });

  const pointsStr = pts.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={pointsStr}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill={color} />
      ))}
    </svg>
  );
}
