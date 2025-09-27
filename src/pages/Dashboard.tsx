import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { BarChart3, TrendingUp, Database, AlertTriangle, Info, LogOut, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useDatasets } from "@/hooks/use-datasets";
import { useAuth } from "@/hooks/use-auth";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { saveDataset } = useDatasets();

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
  const [customLabels, setCustomLabels] = useState<{ x: string; y: string }>({ x: "", y: "" });
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

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
        setSelectedColumns({ x: numericColumns[0], y: "" });
      }

      // Save to Supabase database
      try {
        await saveDataset({
          name: file.name,
          data: result.data,
          columns: result.headers,
          numericColumns: numericColumns,
          fileSize: file.size
        });
      } catch (error) {
        console.error('Error saving dataset to Supabase:', error);
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
  }, [saveDataset]);

  const handleColumnSelect = useCallback((column: string, axis: 'x' | 'y') => {
    setSelectedColumns(prev => ({ ...prev, [axis]: column }));
  }, []);

  const handleCustomLabelChange = useCallback((label: string, axis: 'x' | 'y') => {
    setCustomLabels(prev => ({ ...prev, [axis]: label }));
  }, []);

  const handleModelSelect = useCallback((model: RegressionType) => {
    setSelectedModel(model);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

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
    const xLabel = customLabels.x || combinedData?.xLabel || selectedColumns.x;
    const yLabel = customLabels.y || combinedData?.yLabel || selectedColumns.y;
    const result = performRegression(
      processedData, 
      modelType, 
      modelType === 'polynomial' ? 2 : undefined,
      xLabel,
      yLabel
    );
    
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
    const xLabel = customLabels.x || combinedData?.xLabel || selectedColumns.x;
    const yLabel = customLabels.y || combinedData?.yLabel || selectedColumns.y;

    for (const modelType of availableTypes) {
      try {
        const result = performRegression(
          processedData, 
          modelType, 
          modelType === 'polynomial' ? 2 : undefined,
          xLabel,
          yLabel
        );
        if (result) {
          results[modelType] = result;
        }
      } catch (error) {
        console.error(`Error calculating ${modelType}:`, error);
      }
    }

    setRegressionResults(results);
    setCalculatedModels(new Set(availableTypes));
    setIsCalculatingAll(false);

    toast({
      title: "Calculs terminés",
      description: `${availableTypes.length} modèles calculés`,
      variant: "default"
    });
  }, [isDataValidated, processedData]);

  const currentRegression = regressionResults[selectedModel];
  const alignmentInfo = combinedData ? getDataAlignmentInfo(datasets, selectedVariables.x!, selectedVariables.y!) : null;

  // Available regression types based on current data
  const availableTypes = useMemo(() => {
    return processedData.length > 0 ? getAvailableRegressionTypes(processedData) : [];
  }, [processedData]);

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">RegressionPro</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {user.email}
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Rest of the dashboard content - same as Index.tsx */}
        {datasets.length === 0 && rawData.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">Analyseur de Régression</h1>
              <p className="text-muted-foreground text-lg">
                Uploadez votre dataset pour commencer l'analyse de régression
              </p>
            </div>
            
            <FileUpload onFileSelect={handleFileSelect} />
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Multi-datasets supportés
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                6 modèles de régression
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Visualisations interactives
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Upload Section */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Gestion des Données
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload onFileSelect={handleFileSelect} />
              </CardContent>
            </Card>

            {/* Multi-Dataset Manager */}
            <MultiDatasetManager
              datasets={datasets}
              onDatasetsChange={setDatasets}
              selectedVariables={selectedVariables}
              onVariableSelect={(variable, axis) => {
                setSelectedVariables(prev => ({ ...prev, [axis]: variable }));
              }}
              onValidateAndProceed={() => setIsDataValidated(true)}
              isValidated={isDataValidated}
            />

            {/* Legacy Data Table - only show if we have rawData and no multi-dataset selection */}
            {rawData.length > 0 && !combinedData && (
              <DataTable
                data={rawData}
                selectedColumns={selectedColumns}
                onColumnSelect={handleColumnSelect}
                customLabels={customLabels}
                onCustomLabelChange={handleCustomLabelChange}
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Statistiques des Données
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {processedData.length > 0 && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium">{processedData.length}</div>
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

export default Dashboard;
