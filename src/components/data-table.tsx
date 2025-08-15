import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RefreshCcw, DollarSign } from "lucide-react";

interface DataTableProps {
  data: Record<string, any>[];
  selectedColumns: { x: string; y: string };
  onColumnSelect: (column: string, axis: 'x' | 'y') => void;
  customLabels?: { x: string; y: string };
  onCustomLabelChange?: (label: string, axis: 'x' | 'y') => void;
  onDataChange?: (newData: Record<string, any>[]) => void;
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

function invertForexData(data: Record<string, any>[], columnName: string, newColumnName: string): Record<string, any>[] {
  return data.map(row => {
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
}

export function DataTable({ 
  data, 
  selectedColumns, 
  onColumnSelect, 
  customLabels, 
  onCustomLabelChange,
  onDataChange
}: DataTableProps) {
  if (!data.length) return null;

  const columns = Object.keys(data[0]);
  const numericColumns = columns.filter(col => {
    // Check if at least 80% of values are numeric
    const numericCount = data.filter(row => {
      const val = row[col];
      return val !== null && val !== undefined && val !== "" && !isNaN(Number(val));
    }).length;
    return numericCount / data.length >= 0.8;
  });

  console.log('Available columns:', columns);
  console.log('Numeric columns detected:', numericColumns);

  // Handle forex pair inversion
  const handleForexInversion = (columnName: string) => {
    if (!onDataChange) return;
    
    const pairInfo = detectForexPair(columnName);
    if (!pairInfo.isForexPair) return;
    
    const newColumnName = invertForexPair(columnName);
    const newData = invertForexData(data, columnName, newColumnName);
    
    // Update selected columns if necessary
    const newSelectedColumns = { ...selectedColumns };
    if (selectedColumns.x === columnName) {
      onColumnSelect(newColumnName, 'x');
    }
    if (selectedColumns.y === columnName) {
      onColumnSelect(newColumnName, 'y');
    }
    
    onDataChange(newData);
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Dataset Preview</CardTitle>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span>{data.length} rows</span>
          <span>•</span>
          <span>{columns.length} columns</span>
          <span>•</span>
          <span>{numericColumns.length} numeric</span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Forex Pair Inversion Section */}
        {onDataChange && numericColumns.some(col => detectForexPair(col).isForexPair) && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                Gestion des Paires Forex
              </h3>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
              Inversez les paires de devises (ex: USD/MAD → MAD/USD)
            </p>
            <div className="flex flex-wrap gap-2">
              {numericColumns
                .filter(col => detectForexPair(col).isForexPair)
                .map(col => {
                  const pairInfo = detectForexPair(col);
                  return (
                    <div key={col} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border">
                      <span className="text-sm font-medium">{col}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleForexInversion(col)}
                        className="h-6 px-2 text-xs"
                      >
                        <RefreshCcw className="h-3 w-3 mr-1" />
                        → {invertForexPair(col)}
                      </Button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Column Selection */}
        <div className="mb-4 space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">X-Axis (Independent Variable)</label>
            <div className="flex flex-wrap gap-1">
              {numericColumns.map(col => (
                <Badge
                  key={col}
                  variant={selectedColumns.x === col ? "default" : "secondary"}
                  className={`cursor-pointer transition-all ${
                    selectedColumns.x === col 
                      ? "bg-primary hover:bg-primary/90" 
                      : "hover:bg-secondary"
                  }`}
                  onClick={() => onColumnSelect(col, 'x')}
                >
                  {col}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Y-Axis (Dependent Variable)</label>
            <div className="flex flex-wrap gap-1">
              {numericColumns.map(col => (
                <Badge
                  key={col}
                  variant={selectedColumns.y === col ? "default" : "secondary"}
                  className={`cursor-pointer transition-all ${
                    selectedColumns.y === col 
                      ? "bg-accent hover:bg-accent/90" 
                      : "hover:bg-secondary"
                  }`}
                  onClick={() => onColumnSelect(col, 'y')}
                >
                  {col}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Variable Names */}
        {onCustomLabelChange && (
          <div className="mb-4 space-y-3 p-3 bg-muted/50 rounded-lg border">
            <div className="text-sm font-medium">Noms personnalisés des variables :</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="x-label" className="text-xs">
                  Nom pour {selectedColumns.x || 'variable X'}
                </Label>
                <Input
                  id="x-label"
                  placeholder={selectedColumns.x || 'X'}
                  value={customLabels?.x || ''}
                  onChange={(e) => onCustomLabelChange(e.target.value, 'x')}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="y-label" className="text-xs">
                  Nom pour {selectedColumns.y || 'variable Y'}
                </Label>
                <Input
                  id="y-label"
                  placeholder={selectedColumns.y || 'Y'}
                  value={customLabels?.y || ''}
                  onChange={(e) => onCustomLabelChange(e.target.value, 'y')}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Ces noms apparaîtront dans les équations de régression
            </div>
          </div>
        )}

        {/* Data Preview */}
        <ScrollArea className="h-64 w-full rounded-lg border">
          <div className="min-w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  {columns.map(col => (
                    <th 
                      key={col} 
                      className={`p-2 text-left font-medium sticky top-0 bg-muted/50 backdrop-blur-sm ${
                        col === selectedColumns.x ? "text-primary" : 
                        col === selectedColumns.y ? "text-accent" : ""
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 100).map((row, index) => (
                  <tr key={index} className="border-b hover:bg-muted/20">
                    {columns.map(col => (
                      <td 
                        key={col} 
                        className={`p-2 ${
                          col === selectedColumns.x ? "bg-primary/5" : 
                          col === selectedColumns.y ? "bg-accent/5" : ""
                        }`}
                      >
                        {row[col]?.toString() || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
        
        {data.length > 100 && (
          <p className="text-xs text-muted-foreground mt-2">
            Showing first 100 rows of {data.length} total rows
          </p>
        )}
      </CardContent>
    </Card>
  );
}