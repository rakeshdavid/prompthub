import { makeAssistantToolUI } from "@assistant-ui/react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface ChartSeries {
  name: string;
  label: string;
  color?: string;
}

interface ChartArgs {
  title: string;
  type: "bar" | "line" | "area" | "pie";
  data: Array<Record<string, unknown>>;
  xKey: string;
  series: ChartSeries[];
}

type ChartResult = string;

const DEFAULT_COLORS = [
  "#6DC4AD",
  "#EE7BB3",
  "#469DBB",
  "#F3A326",
  "#A070A6",
  "#401877",
  "#D52C2C",
  "#2CD552",
];

function ChartContent({ args }: { args: ChartArgs }) {
  const { title, type, data, xKey, series } = args;

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--muted-foreground) / 0.2)"
            />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12, fill: "hsl(var(--foreground) / 0.7)" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--foreground) / 0.7)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--popover-foreground))",
              }}
            />
            <Legend />
            {series.map((s, i) => (
              <Bar
                key={s.name}
                dataKey={s.name}
                name={s.label}
                fill={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case "line":
        return (
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--muted-foreground) / 0.2)"
            />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12, fill: "hsl(var(--foreground) / 0.7)" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--foreground) / 0.7)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--popover-foreground))",
              }}
            />
            <Legend />
            {series.map((s, i) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                name={s.label}
                stroke={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        );

      case "area":
        return (
          <AreaChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--muted-foreground) / 0.2)"
            />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12, fill: "hsl(var(--foreground) / 0.7)" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--foreground) / 0.7)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--popover-foreground))",
              }}
            />
            <Legend />
            {series.map((s, i) => (
              <Area
                key={s.name}
                type="monotone"
                dataKey={s.name}
                name={s.label}
                stroke={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                fill={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        );

      case "pie":
        return (
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--popover-foreground))",
              }}
            />
            <Legend />
            <Pie
              data={data}
              dataKey={series[0]?.name ?? "value"}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="tool-card">
      <div className="tool-card-header flex items-center gap-2">
        <BarChart3 size={16} className="text-maslow-teal" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={280}>
          {renderChart() ?? <div />}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export const ChartToolUI = makeAssistantToolUI<ChartArgs, ChartResult>({
  toolName: "show_chart",
  render: ({ result, status }) => {
    if (status.type === "running") {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card shadow-sm px-3 py-2 text-sm text-muted-foreground">
          <BarChart3 size={14} className="animate-pulse text-maslow-teal" />
          <span>Preparing chart...</span>
        </div>
      );
    }

    if (!result) return null;

    try {
      const args: ChartArgs =
        typeof result === "string" ? JSON.parse(result) : result;
      return <ChartContent args={args} />;
    } catch {
      return null;
    }
  },
});
