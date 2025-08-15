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
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

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

// Helper function to calculate correlation
function calculateCorrelation(data: DataPoint[]) {
  if (data.length < 2) return null;
  
  const n = data.length;
  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);
  
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
  
  const numerator = data.reduce((sum, point) => 
    sum + (point.x - xMean) * (point.y - yMean), 0);
  
  const xVariance = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);
  const yVariance = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  
  const denominator = Math.sqrt(xVariance * yVariance);
  
  if (denominator === 0) return null;
  
  const correlation = numerator / denominator;
  
  return {
    pearson: correlation,
    strength: getCorrelationStrength(Math.abs(correlation)),
    direction: getCorrelationDirection(correlation),
    interpretation: getCorrelationInterpretation(correlation)
  };
}

function getCorrelationStrength(absCorr: number): string {
  if (absCorr >= 0.9) return "Très forte";
  if (absCorr >= 0.7) return "Forte";
  if (absCorr >= 0.5) return "Modérée";
  if (absCorr >= 0.3) return "Faible";
  return "Très faible";
}

function getCorrelationDirection(corr: number): "positive" | "negative" | "none" {
  if (corr > 0.1) return "positive";
  if (corr < -0.1) return "negative";
  return "none";
}

function getCorrelationInterpretation(corr: number): string {
  const absCorr = Math.abs(corr);
  const strength = getCorrelationStrength(absCorr);
  const direction = corr > 0.1 ? "positive" : corr < -0.1 ? "négative" : "nulle";
  
  if (absCorr >= 0.7) {
    return `Corrélation ${direction} ${strength.toLowerCase()} : les variables sont ${
      direction === "positive" ? "fortement liées positivement" : 
      direction === "négative" ? "fortement liées négativement" : 
      "non corrélées"
    }.`;
  } else if (absCorr >= 0.3) {
    return `Corrélation ${direction} ${strength.toLowerCase()} : il existe une relation ${
      direction === "positive" ? "positive modérée" : 
      direction === "négative" ? "négative modérée" : 
      "faible"
    } entre les variables.`;
  } else {
    return "Corrélation très faible ou nulle : les variables semblent indépendantes.";
  }
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

  const correlationAnalysis = useMemo(() => {
    return calculateCorrelation(data);
  }, [data]);

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
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              Équation de régression :
            </div>
            <p className="text-lg font-mono text-blue-800 dark:text-blue-200 font-semibold">
              {regression.customString || regression.string}
            </p>
          </div>
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

        {/* Correlation Analysis Section */}
        {correlationAnalysis && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-3">
              {correlationAnalysis.direction === "positive" && <TrendingUp className="h-5 w-5 text-green-600" />}
              {correlationAnalysis.direction === "negative" && <TrendingDown className="h-5 w-5 text-red-600" />}
              {correlationAnalysis.direction === "none" && <Minus className="h-5 w-5 text-gray-600" />}
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                Analyse de Corrélation
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Coefficient de Pearson
                  </span>
                  <span className="text-xl font-bold text-green-900 dark:text-green-100">
                    {correlationAnalysis.pearson.toFixed(4)}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Force de corrélation
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`w-fit ${
                      correlationAnalysis.strength === "Très forte" ? "border-green-600 text-green-700" :
                      correlationAnalysis.strength === "Forte" ? "border-blue-600 text-blue-700" :
                      correlationAnalysis.strength === "Modérée" ? "border-yellow-600 text-yellow-700" :
                      "border-gray-600 text-gray-700"
                    }`}
                  >
                    {correlationAnalysis.strength}
                  </Badge>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Direction
                  </span>
                  <Badge 
                    variant="outline"
                    className={`w-fit ${
                      correlationAnalysis.direction === "positive" ? "border-green-600 text-green-700" :
                      correlationAnalysis.direction === "negative" ? "border-red-600 text-red-700" :
                      "border-gray-600 text-gray-700"
                    }`}
                  >
                    {correlationAnalysis.direction === "positive" ? "Positive" :
                     correlationAnalysis.direction === "negative" ? "Négative" : "Nulle"}
                  </Badge>
                </div>
              </div>
              
              <div className="pt-3 border-t border-green-200 dark:border-green-700">
                <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
                  <span className="font-medium">Interprétation :</span> {correlationAnalysis.interpretation}
                </p>
              </div>
              
              {regression && (
                <div className="pt-2">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Le coefficient de détermination (R² = {regression.r2.toFixed(4)}) indique que {(regression.r2 * 100).toFixed(1)}% 
                    de la variance de {yLabel} est expliquée par {xLabel}.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}