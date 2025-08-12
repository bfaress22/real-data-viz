import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataTableProps {
  data: Record<string, any>[];
  selectedColumns: { x: string; y: string };
  onColumnSelect: (column: string, axis: 'x' | 'y') => void;
}

export function DataTable({ data, selectedColumns, onColumnSelect }: DataTableProps) {
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