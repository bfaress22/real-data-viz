import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataPoint } from "@/lib/regression-utils";

interface VariableChartsProps {
  data: DataPoint[];
  xLabel: string;
  yLabel: string;
}

export function VariableCharts({ data, xLabel, yLabel }: VariableChartsProps) {
  const xData = useMemo(() => {
    if (!data.length) return [];
    return data.map((point, index) => ({
      index,
      value: point.x,
      label: `${xLabel} ${index + 1}`
    }));
  }, [data, xLabel]);

  const yData = useMemo(() => {
    if (!data.length) return [];
    return data.map((point, index) => ({
      index,
      value: point.y,
      label: `${yLabel} ${index + 1}`
    }));
  }, [data, yLabel]);

  const xStats = useMemo(() => {
    if (!xData.length) return null;
    const values = xData.map(d => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0 
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    return { mean, median, min, max, std, count: values.length };
  }, [xData]);

  const yStats = useMemo(() => {
    if (!yData.length) return null;
    const values = yData.map(d => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0 
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    return { mean, median, min, max, std, count: values.length };
  }, [yData]);

  const formatTooltip = (value: any, name: string) => {
    return [Number(value).toFixed(4), name];
  };

  if (!data.length) return null;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Analyse des Variables Individuelles</CardTitle>
        <div className="text-sm text-muted-foreground">
          Visualisation et statistiques détaillées pour chaque variable
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="x-variable" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="x-variable">{xLabel} (Variable X)</TabsTrigger>
            <TabsTrigger value="y-variable">{yLabel} (Variable Y)</TabsTrigger>
          </TabsList>

          <TabsContent value="x-variable" className="space-y-4">
            {xStats && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Badge variant="outline">Moyenne: {xStats.mean.toFixed(4)}</Badge>
                <Badge variant="outline">Médiane: {xStats.median.toFixed(4)}</Badge>
                <Badge variant="outline">Écart-type: {xStats.std.toFixed(4)}</Badge>
                <Badge variant="outline">Min: {xStats.min.toFixed(4)}</Badge>
                <Badge variant="outline">Max: {xStats.max.toFixed(4)}</Badge>
                <Badge variant="outline">N: {xStats.count}</Badge>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={xData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="index" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip formatter={formatTooltip} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={xData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="index" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip formatter={formatTooltip} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="y-variable" className="space-y-4">
            {yStats && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Badge variant="outline">Moyenne: {yStats.mean.toFixed(4)}</Badge>
                <Badge variant="outline">Médiane: {yStats.median.toFixed(4)}</Badge>
                <Badge variant="outline">Écart-type: {yStats.std.toFixed(4)}</Badge>
                <Badge variant="outline">Min: {yStats.min.toFixed(4)}</Badge>
                <Badge variant="outline">Max: {yStats.max.toFixed(4)}</Badge>
                <Badge variant="outline">N: {yStats.count}</Badge>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="index" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip formatter={formatTooltip} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={yData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="index" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip formatter={formatTooltip} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
