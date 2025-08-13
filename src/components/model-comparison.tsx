import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, TrendingUp } from "lucide-react";
import { RegressionType } from "./model-selector";

interface ModelComparisonProps {
  regressionResults: Record<RegressionType, any>;
  calculatedModels: Set<RegressionType>;
  selectedModel: RegressionType;
  onModelSelect: (model: RegressionType) => void;
}

const modelNames: Record<RegressionType, string> = {
  linear: "Linéaire",
  polynomial: "Polynomial",
  exponential: "Exponentiel",
  logarithmic: "Logarithmique",
  power: "Puissance",
  logistic: "Logistique"
};

export function ModelComparison({ 
  regressionResults, 
  calculatedModels, 
  selectedModel, 
  onModelSelect 
}: ModelComparisonProps) {
  // Get calculated models with results
  const calculatedResults = Array.from(calculatedModels)
    .map(modelType => ({
      type: modelType,
      result: regressionResults[modelType],
      name: modelNames[modelType]
    }))
    .filter(({ result }) => result && result.r2 !== undefined)
    .sort((a, b) => b.result.r2 - a.result.r2); // Sort by R² descending

  if (calculatedResults.length === 0) {
    return null;
  }

  const bestModel = calculatedResults[0];
  const worstModel = calculatedResults[calculatedResults.length - 1];

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          Comparaison des Modèles
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {calculatedResults.length} modèle(s) calculé(s)
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Best Model Highlight */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">
                Meilleur Modèle
              </span>
            </div>
            <Badge className="bg-yellow-600 hover:bg-yellow-700">
              R² {bestModel.result.r2.toFixed(4)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">{bestModel.name}</span>
            <Button
              size="sm"
              onClick={() => onModelSelect(bestModel.type)}
              variant={selectedModel === bestModel.type ? "default" : "outline"}
            >
              {selectedModel === bestModel.type ? "Sélectionné" : "Sélectionner"}
            </Button>
          </div>
        </div>

        {/* All Models List */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Tous les Modèles :</h4>
          {calculatedResults.map((model, index) => (
            <div
              key={model.type}
              className={`flex items-center justify-between p-2 rounded border transition-colors ${
                selectedModel === model.type
                  ? "bg-primary/10 border-primary/20"
                  : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-muted-foreground">
                  #{index + 1}
                </div>
                <div>
                  <div className="font-medium">{model.name}</div>
                  <div className="text-xs text-muted-foreground">
                    R² = {model.result.r2.toFixed(4)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Performance Badge */}
                <Badge
                  variant={
                    model.result.r2 >= 0.9 ? "default" :
                    model.result.r2 >= 0.7 ? "secondary" :
                    "outline"
                  }
                  className={
                    model.result.r2 >= 0.9 ? "bg-green-600 hover:bg-green-700" :
                    model.result.r2 >= 0.7 ? "bg-blue-600 hover:bg-blue-700" :
                    "border-orange-300 text-orange-600"
                  }
                >
                  {model.result.r2 >= 0.9 ? "Excellent" :
                   model.result.r2 >= 0.7 ? "Bon" :
                   model.result.r2 >= 0.5 ? "Moyen" : "Faible"}
                </Badge>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onModelSelect(model.type)}
                  className="h-8 px-2"
                >
                  <TrendingUp className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Statistics */}
        <div className="pt-2 border-t space-y-2">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="font-medium">Performance Moyenne:</div>
              <div>
                R² = {(calculatedResults.reduce((sum, m) => sum + m.result.r2, 0) / calculatedResults.length).toFixed(4)}
              </div>
            </div>
            <div>
              <div className="font-medium">Écart de Performance:</div>
              <div>
                {((bestModel.result.r2 - worstModel.result.r2) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
