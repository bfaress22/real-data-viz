import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { parseFile } from "@/lib/data-parser";
import { toast } from "@/hooks/use-toast";
import { Database, Plus, X, FileText, CheckCircle, ArrowRight, Info } from "lucide-react";

export interface Dataset {
  id: string;
  name: string;
  data: Record<string, any>[];
  headers: string[];
  numericColumns: string[];
}

export interface VariableSelection {
  datasetId: string;
  column: string;
  label: string;
}

interface MultiDatasetManagerProps {
  datasets: Dataset[];
  onDatasetsChange: (datasets: Dataset[]) => void;
  selectedVariables: { x: VariableSelection | null; y: VariableSelection | null };
  onVariableSelect: (variable: VariableSelection, axis: 'x' | 'y') => void;
  onValidateAndProceed?: () => void;
  isValidated?: boolean;
}

export function MultiDatasetManager({ 
  datasets, 
  onDatasetsChange, 
  selectedVariables, 
  onVariableSelect,
  onValidateAndProceed,
  isValidated = false
}: MultiDatasetManagerProps) {
  const [activeTab, setActiveTab] = useState<string>("upload");

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

      // Detect numeric columns
      const numericColumns = result.headers.filter(col => {
        const numericCount = result.data.filter(row => {
          const val = row[col];
          return val !== null && val !== undefined && val !== "" && !isNaN(Number(val));
        }).length;
        return numericCount / result.data.length >= 0.8;
      });

      const newDataset: Dataset = {
        id: Date.now().toString(),
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        data: result.data,
        headers: result.headers,
        numericColumns
      };

      const updatedDatasets = [...datasets, newDataset];
      onDatasetsChange(updatedDatasets);

      // Switch to the new dataset tab
      setActiveTab(newDataset.id);

      toast({
        title: "Dataset loaded successfully",
        description: `${result.data.length} rows, ${result.headers.length} columns, ${numericColumns.length} numeric`
      });
    } catch (error) {
      toast({
        title: "Error loading file",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  }, [datasets, onDatasetsChange]);

  const removeDataset = useCallback((datasetId: string) => {
    const updatedDatasets = datasets.filter(d => d.id !== datasetId);
    onDatasetsChange(updatedDatasets);
    
    // Clear selected variables if they reference the removed dataset
    if (selectedVariables.x?.datasetId === datasetId) {
      onVariableSelect({ datasetId: "", column: "", label: "" }, 'x');
    }
    if (selectedVariables.y?.datasetId === datasetId) {
      onVariableSelect({ datasetId: "", column: "", label: "" }, 'y');
    }

    // Switch to upload tab if no datasets remain
    if (updatedDatasets.length === 0) {
      setActiveTab("upload");
    } else if (activeTab === datasetId) {
      setActiveTab(updatedDatasets[0].id);
    }
  }, [datasets, onDatasetsChange, selectedVariables, onVariableSelect, activeTab]);

  const handleVariableSelect = useCallback((datasetId: string, column: string, axis: 'x' | 'y') => {
    const dataset = datasets.find(d => d.id === datasetId);
    if (dataset) {
      onVariableSelect({
        datasetId,
        column,
        label: `${dataset.name}.${column}`
      }, axis);
    }
  }, [datasets, onVariableSelect]);

  // Get all available numeric columns from all datasets
  const allNumericOptions = datasets.flatMap(dataset => 
    dataset.numericColumns.map(column => ({
      datasetId: dataset.id,
      datasetName: dataset.name,
      column,
      label: `${dataset.name}.${column}`
    }))
  );

  // Check if both variables are selected
  const canValidate = selectedVariables.x && selectedVariables.y && 
    selectedVariables.x.datasetId && selectedVariables.x.column &&
    selectedVariables.y.datasetId && selectedVariables.y.column;

  // Get dataset info for validation display
  const getDatasetInfo = (selection: VariableSelection) => {
    const dataset = datasets.find(d => d.id === selection.datasetId);
    return dataset;
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gestion des Données
          </div>
          {datasets.length > 0 && (
            <Badge variant="outline">
              {datasets.length} dataset{datasets.length > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Variable Selection - only show if we have datasets */}
        {datasets.length > 0 && (
          <div className="mb-6 space-y-4">
            <h3 className="font-medium">Sélection des Variables</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-blue-600">Variable X (Indépendante)</label>
                <Select 
                  value={selectedVariables.x?.datasetId && selectedVariables.x?.column ? 
                    `${selectedVariables.x.datasetId}:${selectedVariables.x.column}` : ""} 
                  onValueChange={(value) => {
                    if (value) {
                      const [datasetId, column] = value.split(':');
                      handleVariableSelect(datasetId, column, 'x');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir la variable X..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allNumericOptions.map((option) => (
                      <SelectItem key={`${option.datasetId}:${option.column}`} value={`${option.datasetId}:${option.column}`}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{option.datasetName}</Badge>
                          {option.column}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-green-600">Variable Y (Dépendante)</label>
                <Select 
                  value={selectedVariables.y?.datasetId && selectedVariables.y?.column ? 
                    `${selectedVariables.y.datasetId}:${selectedVariables.y.column}` : ""} 
                  onValueChange={(value) => {
                    if (value) {
                      const [datasetId, column] = value.split(':');
                      handleVariableSelect(datasetId, column, 'y');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir la variable Y..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allNumericOptions.map((option) => (
                      <SelectItem key={`${option.datasetId}:${option.column}`} value={`${option.datasetId}:${option.column}`}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{option.datasetName}</Badge>
                          {option.column}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Validation Section */}
        {canValidate && (
          <div className="border rounded-lg p-4 bg-muted/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Validation des Variables Sélectionnées
              </h3>
              {isValidated && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Validé
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* X Variable Info */}
              <div className="space-y-2">
                <div className="font-medium text-sm text-primary">Variable X (Indépendante)</div>
                <div className="bg-card rounded p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getDatasetInfo(selectedVariables.x!)?.name}
                    </Badge>
                    <span className="font-medium">{selectedVariables.x!.column}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getDatasetInfo(selectedVariables.x!)?.data.length} lignes de données
                  </div>
                </div>
              </div>

              {/* Y Variable Info */}
              <div className="space-y-2">
                <div className="font-medium text-sm text-accent">Variable Y (Dépendante)</div>
                <div className="bg-card rounded p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {getDatasetInfo(selectedVariables.y!)?.name}
                    </Badge>
                    <span className="font-medium">{selectedVariables.y!.column}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getDatasetInfo(selectedVariables.y!)?.data.length} lignes de données
                  </div>
                </div>
              </div>
            </div>

            {/* Cross-dataset info */}
            {selectedVariables.x!.datasetId !== selectedVariables.y!.datasetId && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 text-sm">
                  <Info className="h-4 w-4" />
                  <span className="font-medium">Analyse Cross-Dataset</span>
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Les données proviennent de datasets différents. L'alignement sera effectué automatiquement.
                </div>
              </div>
            )}

            {/* Validation Button */}
            {onValidateAndProceed && (
              <div className="flex justify-end">
                <Button 
                  onClick={() => {
                    console.log('Validation button clicked');
                    onValidateAndProceed();
                  }}
                  className="flex items-center gap-2"
                  disabled={isValidated}
                >
                  {isValidated ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Données Validées
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      Valider et Continuer
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Dataset Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Datasets</h3>
            <Button onClick={() => setActiveTab("upload")} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter Dataset
            </Button>
          </div>

          {activeTab === "upload" && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <FileUpload onFileSelect={handleFileSelect} />
            </div>
          )}

          {datasets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {datasets.map((dataset) => (
                <Card key={dataset.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{dataset.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeDataset(dataset.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div>{dataset.data.length} lignes • {dataset.headers.length} colonnes</div>
                      <div className="flex flex-wrap gap-1">
                        {dataset.numericColumns.slice(0, 3).map((column) => (
                          <Badge key={column} variant="secondary" className="text-xs">
                            {column}
                          </Badge>
                        ))}
                        {dataset.numericColumns.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{dataset.numericColumns.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
