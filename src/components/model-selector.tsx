import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Activity, Play, Zap, Loader2 } from "lucide-react";

export type RegressionType = 'linear' | 'polynomial' | 'exponential' | 'logarithmic' | 'power' | 'logistic';

interface ModelSelectorProps {
  selectedModel: RegressionType;
  onModelSelect: (model: RegressionType) => void;
  regressionResults: Record<RegressionType, any>;
  availableTypes?: RegressionType[];
  calculatedModels?: Set<RegressionType>;
  onCalculateModel?: (model: RegressionType) => void;
  onCalculateAll?: () => void;
  isCalculatingAll?: boolean;
  isDataValidated?: boolean;
}

const modelConfig = {
  linear: {
    name: "Linéaire",
    description: "Ligne droite",
    icon: TrendingUp,
    color: "hsl(var(--primary))"
  },
  polynomial: {
    name: "Polynomial", 
    description: "Courbe parabolique",
    icon: Activity,
    color: "hsl(var(--accent))"
  },
  exponential: {
    name: "Exponentiel",
    description: "Croissance/décroissance",
    icon: BarChart3,
    color: "hsl(var(--destructive))"
  },
  logarithmic: {
    name: "Logarithmique",
    description: "Relation logarithmique",
    icon: TrendingUp,
    color: "hsl(var(--warning))"
  },
  power: {
    name: "Puissance",
    description: "Loi de puissance",
    icon: Activity,
    color: "hsl(var(--success))"
  },
  logistic: {
    name: "Logistique",
    description: "Courbe en S",
    icon: BarChart3,
    color: "hsl(var(--info))"
  }
};

export function ModelSelector({ 
  selectedModel, 
  onModelSelect, 
  regressionResults, 
  availableTypes,
  calculatedModels = new Set(),
  onCalculateModel,
  onCalculateAll,
  isCalculatingAll = false,
  isDataValidated = false
}: ModelSelectorProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="gradient-text text-base">Modèles de Régression</CardTitle>
        {isDataValidated && onCalculateAll && (
          <Button 
            onClick={onCalculateAll}
            disabled={isCalculatingAll}
            className="w-full mt-3"
            variant="default"
          >
            {isCalculatingAll ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calcul...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Meilleur Modèle
              </>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {(Object.keys(modelConfig) as RegressionType[]).filter(model => 
          !availableTypes || availableTypes.includes(model)
        ).map((model) => {
          const config = modelConfig[model];
          const result = regressionResults[model];
          const isCalculated = calculatedModels.has(model);
          const Icon = config.icon;
          
          return (
            <div key={model} className="space-y-1">
              <Button
                variant={selectedModel === model ? "default" : "ghost"}
                className={`w-full p-3 justify-between transition-all duration-300 ${
                  selectedModel === model 
                    ? "bg-gradient-primary text-white shadow-glow" 
                    : "hover:bg-secondary/50"
                }`}
                onClick={() => onModelSelect(model)}
              >
                <div className="flex items-center gap-2">
                  <Icon 
                    className="h-4 w-4" 
                    style={{ color: selectedModel === model ? "white" : config.color }}
                  />
                  <div className="text-left">
                    <div className="font-medium text-sm">{config.name}</div>
                    <div className={`text-xs ${
                      selectedModel === model ? "text-white/80" : "text-muted-foreground"
                    }`}>
                      {config.description}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {result && result.r2 !== undefined ? (
                    <Badge 
                      variant="secondary"
                      className={`text-xs ${
                        selectedModel === model ? "bg-white/20 text-white border-white/30" : ""
                      }`}
                    >
                      R² {result.r2.toFixed(3)}
                    </Badge>
                  ) : isCalculated ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      ✓
                    </Badge>
                  ) : null}
                </div>
              </Button>
              
              {/* Calculate button for individual model */}
              {isDataValidated && onCalculateModel && !isCalculated && (
                <Button
                  onClick={() => onCalculateModel(model)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Calculer
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}