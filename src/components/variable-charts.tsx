import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
  const combinedData = useMemo(() => {
    if (!data.length) return [];
    return data.map((point, index) => ({
      index: index + 1,
      [xLabel]: point.x,
      [yLabel]: point.y
    }));
  }, [data, xLabel, yLabel]);

  const xData = useMemo(() => {
    if (!data.length) return [];
    return data.map((point, index) => ({
      index: index + 1,
      value: point.x,
      label: `${xLabel} ${index + 1}`
    }));
  }, [data, xLabel]);

  const yData = useMemo(() => {
    if (!data.length) return [];
    return data.map((point, index) => ({
      index: index + 1,
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
        <CardTitle>Analyse des Variables</CardTitle>
        <div className="text-sm text-muted-foreground">
          Visualisation et statistiques détaillées pour chaque variable
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="comparison">Comparaison</TabsTrigger>
            <TabsTrigger value="x-variable">{xLabel}</TabsTrigger>
            <TabsTrigger value="y-variable">{yLabel}</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium">Évolution des Variables dans le Temps</h3>
              <p className="text-sm text-muted-foreground">
                Visualisation comparative de {xLabel} et {yLabel}
              </p>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="index" 
                    stroke="hsl(var(--muted-foreground))"
                    label={{ value: 'Point dans le temps', position: 'insideBottom', offset: -5 }}
                  />
                  
                  {/* Axe Y gauche pour la première variable */}
                  <YAxis 
                    yAxisId="left"
                    stroke="hsl(var(--primary))" 
                    label={{ 
                      value: xLabel, 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }}
                  />
                  
                  {/* Axe Y droite pour la deuxième variable */}
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="hsl(var(--destructive))" 
                    label={{ 
                      value: yLabel, 
                      angle: 90, 
                      position: 'insideRight',
                      style: { textAnchor: 'middle' }
                    }}
                  />
                  
                  <Tooltip 
                    formatter={(value: any, name: string) => [Number(value).toFixed(4), name]}
                    labelFormatter={(label) => `Point: ${label}`}
                  />
                  
                  <Line 
                    type="monotone" 
                    dataKey={xLabel} 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3} 
                    dot={false}
                    name={xLabel}
                    yAxisId="left"
                  />
                  
                  <Line 
                    type="monotone" 
                    dataKey={yLabel} 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={3} 
                    dot={false}
                    name={yLabel}
                    yAxisId="right"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Légende pour les axes */}
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-primary"></div>
                <span className="text-sm font-medium text-primary">{xLabel} (Axe gauche)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-destructive"></div>
                <span className="text-sm font-medium text-destructive">{yLabel} (Axe droit)</span>
              </div>
            </div>
          </TabsContent>

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
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={xData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="index" 
                    stroke="hsl(var(--muted-foreground))"
                    label={{ value: 'Point dans le temps', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    formatter={formatTooltip}
                    labelFormatter={(label) => `Point: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
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
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="index" 
                    stroke="hsl(var(--muted-foreground))"
                    label={{ value: 'Point dans le temps', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    formatter={formatTooltip}
                    labelFormatter={(label) => `Point: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2} 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
