import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Activity } from "lucide-react";

export type RegressionType = 'linear' | 'polynomial' | 'exponential';

interface ModelSelectorProps {
  selectedModel: RegressionType;
  onModelSelect: (model: RegressionType) => void;
  regressionResults: Record<RegressionType, { r2: number; equation: string } | null>;
}

const modelConfig = {
  linear: {
    name: "Linear Regression",
    description: "Best fit straight line through data points",
    icon: TrendingUp,
    color: "hsl(var(--primary))"
  },
  polynomial: {
    name: "Polynomial Regression", 
    description: "Curved line fitting with polynomial equation",
    icon: Activity,
    color: "hsl(var(--accent))"
  },
  exponential: {
    name: "Exponential Regression",
    description: "Exponential growth or decay patterns",
    icon: BarChart3,
    color: "hsl(var(--destructive))"
  }
};

export function ModelSelector({ selectedModel, onModelSelect, regressionResults }: ModelSelectorProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="gradient-text">Regression Models</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {(Object.keys(modelConfig) as RegressionType[]).map((model) => {
          const config = modelConfig[model];
          const result = regressionResults[model];
          const Icon = config.icon;
          
          return (
            <Button
              key={model}
              variant={selectedModel === model ? "default" : "ghost"}
              className={`w-full h-auto p-4 justify-start transition-all duration-300 ${
                selectedModel === model 
                  ? "bg-gradient-primary text-white shadow-glow" 
                  : "hover:bg-secondary/50"
              }`}
              onClick={() => onModelSelect(model)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={`p-2 rounded-lg ${
                  selectedModel === model ? "bg-white/20" : "bg-muted"
                }`}>
                  <Icon 
                    className="h-4 w-4" 
                    style={{ color: selectedModel === model ? "white" : config.color }}
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{config.name}</div>
                  <div className={`text-xs ${
                    selectedModel === model ? "text-white/80" : "text-muted-foreground"
                  }`}>
                    {config.description}
                  </div>
                </div>
                {result && (
                  <Badge 
                    variant="secondary" 
                    className={selectedModel === model ? "bg-white/20 text-white" : ""}
                  >
                    R² {result.r2.toFixed(3)}
                  </Badge>
                )}
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}