import React, { useState, useCallback } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import { DataTable } from "@/components/data-table";
import { ModelSelector, RegressionType } from "@/components/model-selector";
import { RegressionChart } from "@/components/regression-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseFile } from "@/lib/data-parser";
import { performRegression, calculateStatistics, DataPoint } from "@/lib/regression-utils";
import { validateNumericData } from "@/lib/data-parser";
import { BarChart3, TrendingUp, Database } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [rawData, setRawData] = useState<Record<string, any>[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<{ x: string; y: string }>({ x: "", y: "" });
  const [selectedModel, setSelectedModel] = useState<RegressionType>('linear');
  const [regressionResults, setRegressionResults] = useState<Record<RegressionType, any>>({
    linear: null,
    polynomial: null,
    exponential: null
  });

  const processedData: DataPoint[] = selectedColumns.x && selectedColumns.y 
    ? validateNumericData(rawData, selectedColumns.x, selectedColumns.y)
    : [];

  const statistics = calculateStatistics(processedData);

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
      const numericColumns = result.headers.filter(col => 
        result.data.every(row => !isNaN(Number(row[col])) && row[col] !== null && row[col] !== "")
      );
      
      if (numericColumns.length >= 2) {
        setSelectedColumns({ x: numericColumns[0], y: numericColumns[1] });
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

  // Perform regressions when data or columns change
  React.useEffect(() => {
    if (processedData.length < 2) {
      setRegressionResults({ linear: null, polynomial: null, exponential: null });
      return;
    }

    const results: Record<RegressionType, any> = {
      linear: performRegression(processedData, 'linear'),
      polynomial: performRegression(processedData, 'polynomial', 2),
      exponential: performRegression(processedData, 'exponential')
    };

    setRegressionResults(results);
  }, [processedData]);

  const currentRegression = regressionResults[selectedModel];

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
        {!rawData.length ? (
          // Welcome State
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                Welcome to <span className="gradient-text">Regression Analytics</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Upload your dataset to start analyzing relationships between variables using advanced regression models.
              </p>
            </div>
            <FileUpload onFileSelect={handleFileSelect} />
          </div>
        ) : (
          // Main Dashboard
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <ModelSelector 
                selectedModel={selectedModel}
                onModelSelect={handleModelSelect}
                regressionResults={regressionResults}
              />
              
              {/* Statistics Card */}
              {statistics && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-1">{selectedColumns.x}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <Badge variant="outline">μ: {statistics.xStats.mean.toFixed(2)}</Badge>
                        <Badge variant="outline">σ: {statistics.xStats.std.toFixed(2)}</Badge>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{selectedColumns.y}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <Badge variant="outline">μ: {statistics.yStats.mean.toFixed(2)}</Badge>
                        <Badge variant="outline">σ: {statistics.yStats.std.toFixed(2)}</Badge>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <Badge variant="secondary" className="w-full justify-center">
                        {statistics.count} data points
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Chart */}
              {processedData.length > 0 && (
                <RegressionChart
                  data={processedData}
                  regression={currentRegression}
                  title={`${selectedModel.charAt(0).toUpperCase() + selectedModel.slice(1)} Regression Analysis`}
                  xLabel={selectedColumns.x}
                  yLabel={selectedColumns.y}
                />
              )}

              {/* Data Table */}
              <DataTable
                data={rawData}
                selectedColumns={selectedColumns}
                onColumnSelect={handleColumnSelect}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
