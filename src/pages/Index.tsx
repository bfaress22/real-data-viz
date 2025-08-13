import React, { useState, useCallback, useEffect, useMemo } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import { DataTable } from "@/components/data-table";
import { ModelSelector, RegressionType } from "@/components/model-selector";
import { RegressionChart } from "@/components/regression-chart";
import { RegressionTable } from "@/components/regression-table";
import { VariableCharts } from "@/components/variable-charts";
import { MultiDatasetManager, Dataset, VariableSelection } from "@/components/multi-dataset-manager";
import { ModelComparison } from "@/components/model-comparison";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { parseFile } from "@/lib/data-parser";
import { performRegression, calculateStatistics, DataPoint, getAvailableRegressionTypes } from "@/lib/regression-utils";
import { combineDatasets, validateVariableSelection, getDataAlignmentInfo } from "@/lib/multi-dataset-utils";
import { validateNumericData } from "@/lib/data-parser";
import { BarChart3, TrendingUp, Database, AlertTriangle, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  // Multi-dataset state
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedVariables, setSelectedVariables] = useState<{
    x: VariableSelection | null;
    y: VariableSelection | null;
  }>({ x: null, y: null });
  const [isDataValidated, setIsDataValidated] = useState(false);

  // Legacy state (for backward compatibility)
  const [rawData, setRawData] = useState<Record<string, any>[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<{ x: string; y: string }>({ x: "", y: "" });
  const [selectedModel, setSelectedModel] = useState<RegressionType>('linear');
  const [regressionResults, setRegressionResults] = useState<Record<RegressionType, any>>({
    linear: null,
    polynomial: null,
    exponential: null,
    logarithmic: null,
    power: null,
    logistic: null
  });
  const [calculatedModels, setCalculatedModels] = useState<Set<RegressionType>>(new Set());
  const [isCalculatingAll, setIsCalculatingAll] = useState(false);

  // Combined data from multi-dataset selection
  const combinedData = useMemo(() => {
    if (!selectedVariables.x || !selectedVariables.y) return null;
    return combineDatasets(datasets, selectedVariables.x, selectedVariables.y);
  }, [datasets, selectedVariables.x, selectedVariables.y]);

  const processedData: DataPoint[] = useMemo(() => {
    if (combinedData) {
      return combinedData.dataPoints;
    }
    // Fallback to legacy mode
    if (!selectedColumns.x || !selectedColumns.y || !rawData.length) return [];
    return validateNumericData(rawData, selectedColumns.x, selectedColumns.y);
  }, [combinedData, rawData, selectedColumns.x, selectedColumns.y]);

  const statistics = useMemo(() => calculateStatistics(processedData), [processedData]);

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      const result = await parseFile(file);
      
      if (result.errors.length > 0) {
        toast({
          title: "File parsing issues",
          description: result.errors.join(", "),
          variant: "destructive"
        });
      }
      
      if (result.data.length === 0) {
        toast({
          title: "No data found",
          description: "The file appears to be empty or invalid",
          variant: "destructive"
        });
        return;
      }

      setRawData(result.data);
      
      // Auto-select first two numeric columns if available
      const numericColumns = result.headers.filter(col => {
        const numericCount = result.data.filter(row => {
          const val = row[col];
          return val !== null && val !== undefined && val !== "" && !isNaN(Number(val));
        }).length;
        return numericCount / result.data.length >= 0.8;
      });
      
      console.log('Detected numeric columns:', numericColumns);
      
      if (numericColumns.length >= 2) {
        setSelectedColumns({ x: numericColumns[0], y: numericColumns[1] });
      } else if (numericColumns.length === 1) {
        // If only one numeric column, user will need to select manually
        setSelectedColumns({ x: numericColumns[0], y: "" });
      }

      toast({
        title: "Dataset loaded successfully",
        description: `${result.data.length} rows, ${result.headers.length} columns`
      });
    } catch (error) {
      toast({
        title: "Error loading file",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  }, []);

  const handleColumnSelect = useCallback((column: string, axis: 'x' | 'y') => {
    setSelectedColumns(prev => ({ ...prev, [axis]: column }));
  }, []);

  const handleModelSelect = useCallback((model: RegressionType) => {
    setSelectedModel(model);
  }, []);

  // Calculate a specific regression model
  const calculateModel = useCallback(async (modelType: RegressionType) => {
    if (!isDataValidated || processedData.length < 2) {
      toast({
        title: "Données non prêtes",
        description: "Veuillez d'abord valider vos données.",
        variant: "destructive"
      });
      return;
    }

    console.log(`Calculating ${modelType} regression...`);
    const result = performRegression(processedData, modelType, modelType === 'polynomial' ? 2 : undefined);
    
    setRegressionResults(prev => ({
      ...prev,
      [modelType]: result
    }));
    
    setCalculatedModels(prev => new Set(prev).add(modelType));

    if (result) {
      toast({
        title: "Modèle calculé",
        description: `${modelType} - R² = ${result.r2.toFixed(4)}`,
        variant: "default"
      });
    } else {
      toast({
        title: "Erreur de calcul",
        description: `Impossible de calculer le modèle ${modelType}`,
        variant: "destructive"
      });
    }
  }, [isDataValidated, processedData]);

  // Calculate all available models
  const calculateAllModels = useCallback(async () => {
    if (!isDataValidated || processedData.length < 2) {
      toast({
        title: "Données non prêtes",
        description: "Veuillez d'abord valider vos données.",
        variant: "destructive"
      });
      return;
    }

    setIsCalculatingAll(true);
    const availableTypes = getAvailableRegressionTypes(processedData);
    
    console.log('Calculating all available models:', availableTypes);

    const results: Record<RegressionType, any> = {
      linear: null,
      polynomial: null,
      exponential: null,
      logarithmic: null,
      power: null,
      logistic: null
    };

    // Calculate each available model
    for (const modelType of availableTypes) {
      console.log(`Calculating ${modelType}...`);
      const result = performRegression(processedData, modelType, modelType === 'polynomial' ? 2 : undefined);
      results[modelType] = result;
    }

    setRegressionResults(results);
    setCalculatedModels(new Set(availableTypes));

    // Find best model based on R²
    const validResults = availableTypes
      .map(type => ({ type, result: results[type] }))
      .filter(({ result }) => result && result.r2 !== undefined);

    if (validResults.length > 0) {
      const bestModel = validResults.reduce((best, current) => 
        current.result.r2 > best.result.r2 ? current : best
      );

      setSelectedModel(bestModel.type);
      
      toast({
        title: "Tous les modèles calculés",
        description: `Meilleur modèle: ${bestModel.type} (R² = ${bestModel.result.r2.toFixed(4)})`,
        variant: "default"
      });
    }

    setIsCalculatingAll(false);
  }, [isDataValidated, processedData]);

  const handleVariableSelect = useCallback((variable: VariableSelection, axis: 'x' | 'y') => {
    setSelectedVariables(prev => ({ ...prev, [axis]: variable }));
    // Reset validation and calculations when variables change
    setIsDataValidated(false);
    setRegressionResults({
      linear: null,
      polynomial: null,
      exponential: null,
      logarithmic: null,
      power: null,
      logistic: null
    });
    setCalculatedModels(new Set());
  }, []);

  const handleValidateAndProceed = useCallback(() => {
    console.log('=== VALIDATION START ===');
    console.log('selectedVariables:', selectedVariables);
    console.log('datasets:', datasets);

    // Basic checks
    if (!selectedVariables.x || !selectedVariables.y) {
      console.log('Missing variables');
      toast({
        title: "Variables manquantes",
        description: "Veuillez sélectionner les variables X et Y avant de continuer.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedVariables.x.datasetId || !selectedVariables.x.column || 
        !selectedVariables.y.datasetId || !selectedVariables.y.column) {
      console.log('Incomplete selection');
      toast({
        title: "Sélection incomplète",
        description: "Veuillez sélectionner des variables valides.",
        variant: "destructive"
      });
      return;
    }

    // Simple validation without external functions first
    const xDataset = datasets.find(d => d.id === selectedVariables.x!.datasetId);
    const yDataset = datasets.find(d => d.id === selectedVariables.y!.datasetId);
    
    console.log('xDataset:', xDataset);
    console.log('yDataset:', yDataset);

    if (!xDataset || !yDataset) {
      console.log('Datasets not found');
      toast({
        title: "Datasets introuvables",
        description: "Les datasets sélectionnés n'existent plus.",
        variant: "destructive"
      });
      return;
    }

    // Check if columns exist
    if (!xDataset.numericColumns.includes(selectedVariables.x.column)) {
      console.log('X column not numeric');
      toast({
        title: "Colonne X invalide",
        description: `La colonne ${selectedVariables.x.column} n'est pas numérique.`,
        variant: "destructive"
      });
      return;
    }

    if (!yDataset.numericColumns.includes(selectedVariables.y.column)) {
      console.log('Y column not numeric');
      toast({
        title: "Colonne Y invalide",
        description: `La colonne ${selectedVariables.y.column} n'est pas numérique.`,
        variant: "destructive"
      });
      return;
    }

    // Check for same variable
    if (selectedVariables.x.datasetId === selectedVariables.y.datasetId && 
        selectedVariables.x.column === selectedVariables.y.column) {
      console.log('Same variable selected');
      toast({
        title: "Variables identiques",
        description: "Les variables X et Y ne peuvent pas être identiques.",
        variant: "destructive"
      });
      return;
    }

    console.log('Basic validation passed, setting validated to true');
    setIsDataValidated(true);
    
    toast({
      title: "Données validées",
      description: "Vous pouvez maintenant procéder à l'analyse de régression.",
      variant: "default"
    });
    
    console.log('=== VALIDATION END ===');
  }, [datasets, selectedVariables]);

  // Validation for multi-dataset selection
  const validationResult = useMemo(() => {
    if (!selectedVariables.x || !selectedVariables.y) return null;
    return validateVariableSelection(datasets, selectedVariables.x, selectedVariables.y);
  }, [datasets, selectedVariables.x, selectedVariables.y]);

  // Data alignment info
  const alignmentInfo = useMemo(() => {
    if (!selectedVariables.x || !selectedVariables.y) return null;
    return getDataAlignmentInfo(datasets, selectedVariables.x, selectedVariables.y);
  }, [datasets, selectedVariables.x, selectedVariables.y]);

  // Reset calculations when validation changes
  useEffect(() => {
    if (!isDataValidated) {
      setRegressionResults({ 
        linear: null, 
        polynomial: null, 
        exponential: null, 
        logarithmic: null, 
        power: null, 
        logistic: null 
      });
      setCalculatedModels(new Set());
    }
  }, [isDataValidated]);

  const currentRegression = regressionResults[selectedModel];
  
  // Get available regression types for this dataset
  const availableTypes = useMemo(() => {
    if (processedData.length < 2) return [];
    return getAvailableRegressionTypes(processedData);
  }, [processedData]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Regression Analytics</h1>
              <p className="text-sm text-muted-foreground">Advanced data analysis and visualization platform</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className={`flex items-center space-x-2 ${datasets.length > 0 ? 'text-green-600' : 'text-blue-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${datasets.length > 0 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                {datasets.length > 0 ? '✓' : '1'}
              </div>
              <span className="font-medium">Importer les Données</span>
            </div>
            <div className={`w-8 h-0.5 ${datasets.length > 0 ? 'bg-green-200' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center space-x-2 ${isDataValidated ? 'text-green-600' : datasets.length > 0 && selectedVariables.x && selectedVariables.y ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDataValidated ? 'bg-green-100 text-green-600' : datasets.length > 0 && selectedVariables.x && selectedVariables.y ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                {isDataValidated ? '✓' : '2'}
              </div>
              <span className="font-medium">Sélectionner & Valider</span>
            </div>
            <div className={`w-8 h-0.5 ${isDataValidated ? 'bg-green-200' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center space-x-2 ${calculatedModels.size > 0 ? 'text-green-600' : isDataValidated ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${calculatedModels.size > 0 ? 'bg-green-100 text-green-600' : isDataValidated ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                {calculatedModels.size > 0 ? '✓' : '3'}
              </div>
              <span className="font-medium">Analyser</span>
            </div>
          </div>
        </div>

        {datasets.length === 0 ? (
          // Step 1: Welcome & Data Import
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                <span className="gradient-text">Analyse de Régression</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Importez vos datasets et analysez les relations entre variables avec des modèles de régression avancés.
              </p>
            </div>
            <MultiDatasetManager
              datasets={datasets}
              onDatasetsChange={setDatasets}
              selectedVariables={selectedVariables}
              onVariableSelect={handleVariableSelect}
              onValidateAndProceed={handleValidateAndProceed}
              isValidated={isDataValidated}
            />
          </div>
        ) : !isDataValidated ? (
          // Step 2: Variable Selection & Validation
          <div className="max-w-6xl mx-auto space-y-6">
            <MultiDatasetManager
              datasets={datasets}
              onDatasetsChange={setDatasets}
              selectedVariables={selectedVariables}
              onVariableSelect={handleVariableSelect}
              onValidateAndProceed={handleValidateAndProceed}
              isValidated={isDataValidated}
            />

            {/* Validation Messages */}
            {validationResult && !validationResult.valid && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {validationResult && validationResult.valid && validationResult.warnings.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {validationResult.warnings.map((warning, index) => (
                      <div key={index}>• {warning}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Cross-Dataset Info */}
            {alignmentInfo && !alignmentInfo.sameDataset && (
                <Card className="glass-card">
                  <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Info className="h-4 w-4" />
                    Information sur l'Analyse Cross-Dataset
                    </CardTitle>
                  </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                    <div className="font-medium mb-2">Points de Données</div>
                    <div className="space-y-1">
                      <div>Variable X: {alignmentInfo.xDataPoints} points</div>
                      <div>Variable Y: {alignmentInfo.yDataPoints} points</div>
                      <div className="font-medium text-green-600">Alignés: {alignmentInfo.alignedDataPoints} points</div>
                      </div>
                    </div>
                    <div>
                    <div className="font-medium mb-2">Colonnes Communes</div>
                    {alignmentInfo.commonColumns.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {alignmentInfo.commonColumns.map(col => (
                          <Badge key={col} variant="outline" className="text-xs">{col}</Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">Aucune trouvée - alignement par index</div>
                    )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
        ) : (
          // Step 3: Analysis & Results
          <div className="space-y-6">
            {/* Analysis Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Variables Sélectionnées</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsDataValidated(false)}
                      >
                        Modifier
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded">
                        <div className="text-sm text-muted-foreground mb-1">Variable X (Indépendante)</div>
                        <div className="font-medium text-blue-600">{combinedData?.xLabel}</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded">
                        <div className="text-sm text-muted-foreground mb-1">Variable Y (Dépendante)</div>
                        <div className="font-medium text-green-600">{combinedData?.yLabel}</div>
                      </div>
                    </div>
                    {statistics && (
                      <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <div className="font-medium">{statistics.count}</div>
                          <div className="text-muted-foreground">Points de données</div>
                        </div>
                        <div>
                          <div className="font-medium">{statistics.correlation.toFixed(3)}</div>
                          <div className="text-muted-foreground">Corrélation</div>
                        </div>
                        <div>
                          <div className="font-medium">
                            {alignmentInfo?.sameDataset ? 'Même dataset' : 'Cross-dataset'}
                          </div>
                          <div className="text-muted-foreground">Source</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <ModelSelector 
                  selectedModel={selectedModel}
                  onModelSelect={handleModelSelect}
                  regressionResults={regressionResults}
                  availableTypes={availableTypes}
                  calculatedModels={calculatedModels}
                  onCalculateModel={calculateModel}
                  onCalculateAll={calculateAllModels}
                  isCalculatingAll={isCalculatingAll}
                  isDataValidated={isDataValidated}
                />
              </div>
            </div>

            {/* Model Comparison - only if multiple models calculated */}
            {calculatedModels.size > 1 && (
              <ModelComparison
                regressionResults={regressionResults}
                calculatedModels={calculatedModels}
                selectedModel={selectedModel}
                onModelSelect={handleModelSelect}
              />
            )}

            {/* Analysis Results */}
            {currentRegression && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <RegressionChart
                  data={processedData}
                  regression={currentRegression}
                  title={`Régression ${selectedModel.charAt(0).toUpperCase() + selectedModel.slice(1)}`}
                  xLabel={combinedData?.xLabel || selectedColumns.x}
                  yLabel={combinedData?.yLabel || selectedColumns.y}
                />
                
                <RegressionTable
                  data={processedData}
                  regression={currentRegression}
                  xLabel={combinedData?.xLabel || selectedColumns.x}
                  yLabel={combinedData?.yLabel || selectedColumns.y}
                />
              </div>
            )}

            {/* Detailed Variable Analysis */}
            {processedData.length > 0 && (
              <VariableCharts
                data={processedData}
                xLabel={combinedData?.xLabel || selectedColumns.x}
                yLabel={combinedData?.yLabel || selectedColumns.y}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
