"use client";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

interface ChartConfig {
  type: "bar" | "line" | "pie";
  x_key: string;
  y_keys: string[];
}

interface Props {
  data: Record<string, unknown>[];
  config: ChartConfig;
}

function truncateLabel(val: unknown): string {
  const s = String(val ?? "");
  return s.length > 12 ? s.slice(0, 12) + "…" : s;
}

export default function ResultsChart({ data, config }: Props) {
  const { type, x_key, y_keys } = config;

  const commonProps = {
    data,
    margin: { top: 8, right: 24, left: 0, bottom: 40 },
  };

  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis
        dataKey={x_key}
        tickFormatter={truncateLabel}
        stroke="#9ca3af"
        tick={{ fill: "#9ca3af", fontSize: 11 }}
        angle={-30}
        textAnchor="end"
      />
      <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 11 }} />
      <Tooltip
        contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
        labelStyle={{ color: "#f3f4f6" }}
        itemStyle={{ color: "#d1d5db" }}
      />
      <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
    </>
  );

  return (
    <div className="mt-4 rounded-xl bg-gray-800/50 border border-gray-700 p-4">
      <ResponsiveContainer width="100%" height={280}>
        {type === "line" ? (
          <LineChart {...commonProps}>
            {axes}
            {y_keys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[i % COLORS.length]}
                dot={data.length < 30}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        ) : (
          <BarChart {...commonProps}>
            {axes}
            {y_keys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
