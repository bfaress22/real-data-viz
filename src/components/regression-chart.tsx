import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DataPoint {
  x: number;
  y: number;
}

interface RegressionResult {
  equation: number[];
  string: string;
  r2: number;
  points: DataPoint[];
}

interface RegressionChartProps {
  data: DataPoint[];
  regression: RegressionResult | null;
  title: string;
  xLabel: string;
  yLabel: string;
}

export function RegressionChart({ data, regression, title, xLabel, yLabel }: RegressionChartProps) {
  const chartData = useMemo(() => {
    if (!data.length) return [];
    
    const sortedData = [...data].sort((a, b) => a.x - b.x);
    
    return sortedData.map((point, index) => ({
      ...point,
      index,
      predicted: regression?.points[index]?.y || null
    }));
  }, [data, regression]);

  const formatTooltip = (value: any, name: string) => {
    if (name === "y") return [`${value.toFixed(3)}`, yLabel];
    if (name === "predicted") return [`${value.toFixed(3)}`, "Predicted"];
    return [value, name];
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          {regression && (
            <span className="text-sm font-normal text-muted-foreground">
              R² = {regression.r2.toFixed(4)}
            </span>
          )}
        </CardTitle>
        {regression && (
          <p className="text-sm text-muted-foreground font-mono">
            {regression.string}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="x" 
                stroke="hsl(var(--muted-foreground))"
                label={{ value: xLabel, position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                label={{ value: yLabel, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={formatTooltip}
                labelFormatter={(label) => `${xLabel}: ${Number(label).toFixed(3)}`}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  backdropFilter: 'blur(8px)'
                }}
              />
              
              {/* Scatter points for actual data */}
              <Scatter 
                dataKey="y" 
                fill="hsl(var(--primary))"
                r={4}
              />
              
              {/* Regression line */}
              {regression && regression.points && (
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="hsl(var(--accent))"
                  strokeWidth={3}
                  dot={false}
                  connectNulls={false}
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}