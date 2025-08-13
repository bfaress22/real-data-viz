import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { DataPoint, RegressionResult } from "@/lib/regression-utils";
import regression from 'regression';

interface RegressionTableProps {
  data: DataPoint[];
  regression: RegressionResult | null;
  xLabel: string;
  yLabel: string;
}

export function RegressionTable({ data, regression, xLabel, yLabel }: RegressionTableProps) {
  if (!regression || !data.length) return null;

  // Calculate predictions and errors
  const tableData = data.map(point => {
    // Use the specific predict function for each regression type
    const prediction = regression.predict(point.x);
    
    const error = point.y - prediction;
    const absoluteError = Math.abs(error);
    const percentageError = Math.abs((error / point.y) * 100);

    return {
      x: point.x,
      actual: point.y,
      predicted: prediction,
      error: error,
      absoluteError: absoluteError,
      percentageError: percentageError
    };
  });

  // Calculate summary statistics
  const totalError = tableData.reduce((sum, row) => sum + row.absoluteError, 0);
  const meanAbsoluteError = totalError / tableData.length;
  const meanPercentageError = tableData.reduce((sum, row) => sum + row.percentageError, 0) / tableData.length;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Regression Analysis Results</span>
          <div className="flex gap-2">
            <Badge variant="outline">
              MAE: {meanAbsoluteError.toFixed(4)}
            </Badge>
            <Badge variant="outline">
              MAPE: {meanPercentageError.toFixed(2)}%
            </Badge>
          </div>
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Showing actual vs predicted values with error analysis
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80 w-full rounded-lg border">
          <div className="min-w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="p-2 text-left font-medium sticky top-0 bg-muted/50 backdrop-blur-sm">
                    {xLabel} (X)
                  </th>
                  <th className="p-2 text-left font-medium sticky top-0 bg-muted/50 backdrop-blur-sm">
                    {yLabel} (Réel)
                  </th>
                  <th className="p-2 text-left font-medium sticky top-0 bg-muted/50 backdrop-blur-sm">
                    {yLabel} (Estimé)
                  </th>
                  <th className="p-2 text-left font-medium sticky top-0 bg-muted/50 backdrop-blur-sm">
                    Erreur
                  </th>
                  <th className="p-2 text-left font-medium sticky top-0 bg-muted/50 backdrop-blur-sm">
                    Erreur Abs.
                  </th>
                  <th className="p-2 text-left font-medium sticky top-0 bg-muted/50 backdrop-blur-sm">
                    Erreur %
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={index} className="border-b hover:bg-muted/20">
                    <td className="p-2 font-mono text-xs">
                      {row.x.toFixed(4)}
                    </td>
                    <td className="p-2 font-mono text-xs">
                      {row.actual.toFixed(4)}
                    </td>
                    <td className="p-2 font-mono text-xs">
                      {row.predicted.toFixed(4)}
                    </td>
                    <td className={`p-2 font-mono text-xs ${
                      row.error > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {row.error > 0 ? '+' : ''}{row.error.toFixed(4)}
                    </td>
                    <td className="p-2 font-mono text-xs">
                      {row.absoluteError.toFixed(4)}
                    </td>
                    <td className="p-2 font-mono text-xs">
                      {row.percentageError.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <div className="font-medium">Statistiques d'erreur:</div>
            <div>MAE (Erreur Absolue Moyenne): {meanAbsoluteError.toFixed(4)}</div>
            <div>MAPE (Erreur Pourcentage Moyenne): {meanPercentageError.toFixed(2)}%</div>
            {regression.metrics && (
              <>
                <div>RMSE (Erreur Quadratique Moyenne): {regression.metrics.rmse.toFixed(4)}</div>
                <div>MSE (Erreur Quadratique Moyenne): {regression.metrics.mse.toFixed(4)}</div>
                <div>Erreur Standard: {regression.metrics.standardError.toFixed(4)}</div>
              </>
            )}
          </div>
          <div className="space-y-1">
            <div className="font-medium">Qualité du modèle:</div>
            <div>R² (Coefficient de détermination): {(regression.r2 * 100).toFixed(2)}%</div>
            {regression.metrics && (
              <>
                <div>R² Ajusté: {(regression.metrics.adjustedR2 * 100).toFixed(2)}%</div>
                <div>AIC: {regression.metrics.aic.toFixed(2)}</div>
                <div>BIC: {regression.metrics.bic.toFixed(2)}</div>
                <div>F-statistique: {regression.metrics.fStatistic.toFixed(4)}</div>
                <div>P-valeur: {regression.metrics.pValue.toFixed(4)}</div>
              </>
            )}
            <div>Points de données: {data.length}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
