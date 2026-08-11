"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export function DailyBarChart({
  data,
  xKey,
  yKey,
  height = 240,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  height?: number;
}) {
  if (!data.length) {
    return <p className="text-xs text-muted-foreground py-8 text-center">No data yet</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey={xKey} tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey={yKey} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineTrendChart({
  data,
  xKey,
  yKey,
  height = 220,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  height?: number;
}) {
  if (!data.length) {
    return <p className="text-xs text-muted-foreground py-8 text-center">No data yet</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey={xKey} tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Line type="monotone" dataKey={yKey} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function FeatureBarChart({
  data,
  labelKey,
  valueKey,
  height = 260,
}: {
  data: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
  height?: number;
}) {
  if (!data.length) {
    return <p className="text-xs text-muted-foreground py-8 text-center">No data yet</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
        <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
        <YAxis type="category" dataKey={labelKey} width={100} tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey={valueKey} radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ConversionFunnelChart({
  stages,
}: {
  stages: Array<{ label: string; count: number; conversionFromPrevious: number | null }>;
}) {
  const data = stages.map((s) => ({
    name: s.label,
    value: s.count,
    fill: "hsl(var(--primary))",
  }));

  if (!data.some((d) => d.value > 0)) {
    return <p className="text-xs text-muted-foreground py-8 text-center">No funnel data yet</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <FunnelChart>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Funnel dataKey="value" data={data} isAnimationActive>
          <LabelList position="right" fill="currentColor" stroke="none" dataKey="name" fontSize={11} />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}

export function ReferralPieList({
  items,
}: {
  items: Array<{ source: string; count: number }>;
}) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No referral data yet</p>
      ) : (
        items.map((item) => (
          <div key={item.source} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>{item.source}</span>
              <span className="text-muted-foreground tabular-nums">{item.count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.round((item.count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
