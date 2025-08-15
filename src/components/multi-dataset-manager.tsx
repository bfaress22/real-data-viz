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
import { Database, Plus, X, FileText, CheckCircle, ArrowRight, Info, RefreshCcw, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

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
  customName?: string; // Custom name for the variable in equations
}

interface MultiDatasetManagerProps {
  datasets: Dataset[];
  onDatasetsChange: (datasets: Dataset[]) => void;
  selectedVariables: { x: VariableSelection | null; y: VariableSelection | null };
  onVariableSelect: (variable: VariableSelection, axis: 'x' | 'y') => void;
  onValidateAndProceed?: () => void;
  isValidated?: boolean;
}

// Helper functions for forex pair detection and inversion
function detectForexPair(columnName: string): { isForexPair: boolean; baseCurrency?: string; quoteCurrency?: string; format?: 'slash' | 'direct' } {
  // Pattern for XXX/YYY format
  const slashPattern = /^([A-Z]{3})\/([A-Z]{3})$/;
  // Pattern for XXXYYY format (6 characters)
  const directPattern = /^([A-Z]{3})([A-Z]{3})$/;
  
  const slashMatch = columnName.match(slashPattern);
  if (slashMatch) {
    return {
      isForexPair: true,
      baseCurrency: slashMatch[1],
      quoteCurrency: slashMatch[2],
      format: 'slash'
    };
  }
  
  const directMatch = columnName.match(directPattern);
  if (directMatch) {
    return {
      isForexPair: true,
      baseCurrency: directMatch[1],
      quoteCurrency: directMatch[2],
      format: 'direct'
    };
  }
  
  return { isForexPair: false };
}

function invertForexPair(columnName: string): string {
  const pairInfo = detectForexPair(columnName);
  if (!pairInfo.isForexPair || !pairInfo.baseCurrency || !pairInfo.quoteCurrency) {
    return columnName;
  }
  
  if (pairInfo.format === 'slash') {
    return `${pairInfo.quoteCurrency}/${pairInfo.baseCurrency}`;
  } else {
    return `${pairInfo.quoteCurrency}${pairInfo.baseCurrency}`;
  }
}

function invertForexDataInDataset(dataset: Dataset, columnName: string, forexPairName?: string): Dataset {
  const newColumnName = forexPairName ? invertForexPair(forexPairName) : invertForexPair(columnName);
  
  const newData = dataset.data.map(row => {
    const newRow = { ...row };
    const value = parseFloat(row[columnName]);
    
    if (!isNaN(value) && value !== 0) {
      newRow[newColumnName] = 1 / value;
    } else {
      newRow[newColumnName] = null;
    }
    
    // Remove the old column
    delete newRow[columnName];
    
    return newRow;
  });

  // Update headers and numeric columns
  const newHeaders = dataset.headers.map(h => h === columnName ? newColumnName : h);
  const newNumericColumns = dataset.numericColumns.map(h => h === columnName ? newColumnName : h);

  return {
    ...dataset,
    data: newData,
    headers: newHeaders,
    numericColumns: newNumericColumns
  };
}

// Forex Column Manager Component
function ForexColumnManager({ 
  dataset, 
  onForexInversion 
}: { 
  dataset: Dataset; 
  onForexInversion: (datasetId: string, columnName: string, forexPairName?: string) => void;
}) {
  const [enableInversion, setEnableInversion] = useState<boolean>(false);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [forexPairName, setForexPairName] = useState<string>('');

  const handleInversion = () => {
    if (!selectedColumn || !forexPairName || !enableInversion) return;
    onForexInversion(dataset.id, selectedColumn, forexPairName);
    setSelectedColumn('');
    setForexPairName('');
    setEnableInversion(false);
  };

  return (
    <div className="border rounded-lg p-3 bg-white dark:bg-gray-800">
      <div className="font-medium text-sm mb-3 text-yellow-800 dark:text-yellow-200">
        {dataset.name}
      </div>
      
      {/* Enable Inversion Checkbox */}
      <div className="mb-3">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id={`enable-inversion-${dataset.id}`}
            checked={enableInversion}
            onCheckedChange={setEnableInversion}
          />
          <Label 
            htmlFor={`enable-inversion-${dataset.id}`}
            className="text-sm text-yellow-800 dark:text-yellow-200 cursor-pointer"
          >
            Activer l'inversion de paire forex
          </Label>
        </div>
      </div>

      {/* Inversion Controls - Only visible when enabled */}
      {enableInversion && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          {/* Column Selection */}
          <div>
            <Label className="text-xs text-yellow-700 dark:text-yellow-300">
              Colonne à inverser
            </Label>
            <Select value={selectedColumn} onValueChange={setSelectedColumn}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Choisir..." />
              </SelectTrigger>
              <SelectContent>
                {dataset.numericColumns.map(col => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Forex Pair Name */}
          <div>
            <Label className="text-xs text-yellow-700 dark:text-yellow-300">
              Paire de devises
            </Label>
            <Input
              placeholder="USD/MAD"
              value={forexPairName}
              onChange={(e) => setForexPairName(e.target.value.toUpperCase())}
              className="h-8 text-sm"
            />
          </div>

          {/* Invert Button */}
          <div>
            <Button
              size="sm"
              onClick={handleInversion}
              disabled={!selectedColumn || !forexPairName}
              className="h-8 w-full"
            >
              <RefreshCcw className="h-3 w-3 mr-1" />
              → {forexPairName ? invertForexPair(forexPairName) : '?'}
            </Button>
          </div>
        </div>
      )}

      {/* Auto-detected forex pairs */}
      {dataset.numericColumns.some(col => detectForexPair(col).isForexPair) && (
        <div className="mt-3 pt-3 border-t">
          <div className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
            Paires détectées automatiquement :
          </div>
          <div className="flex flex-wrap gap-2">
            {dataset.numericColumns
              .filter(col => detectForexPair(col).isForexPair)
              .map(col => (
                <div key={col} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border">
                  <span className="text-sm font-medium">{col}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onForexInversion(dataset.id, col)}
                    className="h-6 px-2 text-xs"
                  >
                    <RefreshCcw className="h-3 w-3 mr-1" />
                    → {invertForexPair(col)}
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
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

  // Handle forex pair inversion
  const handleForexInversion = useCallback((datasetId: string, columnName: string, forexPairName?: string) => {
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) return;
    
    const newDataset = invertForexDataInDataset(dataset, columnName, forexPairName);
    const updatedDatasets = datasets.map(d => d.id === datasetId ? newDataset : d);
    
    onDatasetsChange(updatedDatasets);
    
    // Update selected variables if they reference the modified column
    const newColumnName = forexPairName ? invertForexPair(forexPairName) : invertForexPair(columnName);
    if (selectedVariables.x?.datasetId === datasetId && selectedVariables.x?.column === columnName) {
      onVariableSelect({
        datasetId,
        column: newColumnName,
        label: newColumnName, // Use only the forex pair name, not dataset.column
        customName: selectedVariables.x.customName
      }, 'x');
    }
    if (selectedVariables.y?.datasetId === datasetId && selectedVariables.y?.column === columnName) {
      onVariableSelect({
        datasetId,
        column: newColumnName,
        label: newColumnName, // Use only the forex pair name, not dataset.column
        customName: selectedVariables.y.customName
      }, 'y');
    }

    const originalName = forexPairName || columnName;
    toast({
      title: "Paire inversée",
      description: `${originalName} → ${newColumnName}`,
      variant: "default"
    });
  }, [datasets, onDatasetsChange, selectedVariables, onVariableSelect]);

  const handleVariableSelect = useCallback((datasetId: string, column: string, axis: 'x' | 'y') => {
    const dataset = datasets.find(d => d.id === datasetId);
    if (dataset) {
      // Check if it's a forex pair, if so use only the pair name as label
      const pairInfo = detectForexPair(column);
      const label = pairInfo.isForexPair ? column : `${dataset.name}.${column}`;
      
      onVariableSelect({
        datasetId,
        column,
        label
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

            {/* Custom Variable Names */}
            <div className="mb-4 p-3 bg-muted/50 rounded-lg border">
              <div className="text-sm font-medium mb-3">Noms personnalisés des variables :</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="x-custom-name" className="text-xs">
                    Nom pour {selectedVariables.x!.column}
                  </Label>
                  <Input
                    id="x-custom-name"
                    placeholder={selectedVariables.x!.column}
                    value={selectedVariables.x!.customName || ''}
                    onChange={(e) => {
                      const updatedSelection = { ...selectedVariables.x!, customName: e.target.value };
                      onVariableSelect(updatedSelection, 'x');
                    }}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="y-custom-name" className="text-xs">
                    Nom pour {selectedVariables.y!.column}
                  </Label>
                  <Input
                    id="y-custom-name"
                    placeholder={selectedVariables.y!.column}
                    value={selectedVariables.y!.customName || ''}
                    onChange={(e) => {
                      const updatedSelection = { ...selectedVariables.y!, customName: e.target.value };
                      onVariableSelect(updatedSelection, 'y');
                    }}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Ces noms apparaîtront dans les équations de régression
              </div>
            </div>

            {/* Forex Pair Inversion Section - Before Validation */}
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-5 w-5 text-yellow-600" />
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                  Inversion de Paire Forex (Optionnel)
                </h3>
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                Inversez une paire de devises avant l'analyse (ex: USD/MAD → MAD/USD)
              </p>
              
              <div className="space-y-3">
                {datasets.map(dataset => (
                  <ForexColumnManager
                    key={dataset.id}
                    dataset={dataset}
                    onForexInversion={handleForexInversion}
                  />
                ))}
              </div>
            </div>

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
