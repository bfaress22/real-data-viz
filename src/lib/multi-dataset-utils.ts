import { Dataset, VariableSelection } from "@/components/multi-dataset-manager";
import { DataPoint } from "./regression-utils";

export interface CombinedData {
  dataPoints: DataPoint[];
  xLabel: string;
  yLabel: string;
  sourceInfo: {
    x: { dataset: string; column: string };
    y: { dataset: string; column: string };
  };
}

/**
 * Combine data from multiple datasets based on variable selections
 */
export function combineDatasets(
  datasets: Dataset[],
  xVariable: VariableSelection,
  yVariable: VariableSelection
): CombinedData | null {
  if (!xVariable.datasetId || !xVariable.column || !yVariable.datasetId || !yVariable.column) {
    return null;
  }

  const xDataset = datasets.find(d => d.id === xVariable.datasetId);
  const yDataset = datasets.find(d => d.id === yVariable.datasetId);

  if (!xDataset || !yDataset) {
    return null;
  }

  const xData = extractNumericColumn(xDataset.data, xVariable.column);
  const yData = extractNumericColumn(yDataset.data, yVariable.column);

  if (xData.length === 0 || yData.length === 0) {
    return null;
  }

  // If data comes from the same dataset, pair them directly
  if (xVariable.datasetId === yVariable.datasetId) {
    const minLength = Math.min(xData.length, yData.length);
    const dataPoints: DataPoint[] = [];
    
    for (let i = 0; i < minLength; i++) {
      if (xData[i].value !== null && yData[i].value !== null) {
        dataPoints.push({
          x: xData[i].value,
          y: yData[i].value
        });
      }
    }

    return {
      dataPoints,
      xLabel: xVariable.label,
      yLabel: yVariable.label,
      sourceInfo: {
        x: { dataset: xDataset.name, column: xVariable.column },
        y: { dataset: yDataset.name, column: yVariable.column }
      }
    };
  }

  // If data comes from different datasets, we need to align them
  // For now, we'll use a simple approach: pair by index
  // In a more advanced implementation, you might want to merge based on common keys
  const minLength = Math.min(xData.length, yData.length);
  const dataPoints: DataPoint[] = [];
  
  for (let i = 0; i < minLength; i++) {
    if (xData[i].value !== null && yData[i].value !== null) {
      dataPoints.push({
        x: xData[i].value,
        y: yData[i].value
      });
    }
  }

  return {
    dataPoints,
    xLabel: xVariable.label,
    yLabel: yVariable.label,
    sourceInfo: {
      x: { dataset: xDataset.name, column: xVariable.column },
      y: { dataset: yDataset.name, column: yVariable.column }
    }
  };
}

/**
 * Advanced data combination with key-based merging
 */
export function combineDatasetsByKey(
  datasets: Dataset[],
  xVariable: VariableSelection,
  yVariable: VariableSelection,
  keyColumn?: string
): CombinedData | null {
  if (!xVariable.datasetId || !xVariable.column || !yVariable.datasetId || !yVariable.column) {
    return null;
  }

  const xDataset = datasets.find(d => d.id === xVariable.datasetId);
  const yDataset = datasets.find(d => d.id === yVariable.datasetId);

  if (!xDataset || !yDataset) {
    return null;
  }

  // If same dataset, use simple pairing
  if (xVariable.datasetId === yVariable.datasetId) {
    return combineDatasets(datasets, xVariable, yVariable);
  }

  // For different datasets, try to find a common key column
  if (!keyColumn) {
    // Try to find a common column name between datasets
    const commonColumns = xDataset.headers.filter(col => 
      yDataset.headers.includes(col)
    );
    
    if (commonColumns.length === 0) {
      // No common key found, fall back to index-based pairing
      return combineDatasets(datasets, xVariable, yVariable);
    }
    
    keyColumn = commonColumns[0]; // Use first common column as key
  }

  // Create maps for efficient lookup
  const xMap = new Map<string, number>();
  const yMap = new Map<string, number>();

  // Populate X data map
  xDataset.data.forEach(row => {
    const keyValue = row[keyColumn!]?.toString();
    const xValue = parseFloat(row[xVariable.column]);
    if (keyValue && !isNaN(xValue)) {
      xMap.set(keyValue, xValue);
    }
  });

  // Populate Y data map and create data points
  const dataPoints: DataPoint[] = [];
  yDataset.data.forEach(row => {
    const keyValue = row[keyColumn!]?.toString();
    const yValue = parseFloat(row[yVariable.column]);
    if (keyValue && !isNaN(yValue) && xMap.has(keyValue)) {
      const xValue = xMap.get(keyValue)!;
      dataPoints.push({ x: xValue, y: yValue });
    }
  });

  return {
    dataPoints,
    xLabel: xVariable.label,
    yLabel: yVariable.label,
    sourceInfo: {
      x: { dataset: xDataset.name, column: xVariable.column },
      y: { dataset: yDataset.name, column: yVariable.column }
    }
  };
}

/**
 * Extract numeric values from a column
 */
function extractNumericColumn(data: Record<string, any>[], columnName: string): Array<{ value: number; index: number }> {
  return data
    .map((row, index) => ({ value: parseFloat(row[columnName]), index }))
    .filter(item => !isNaN(item.value));
}

/**
 * Get statistics about data alignment between datasets
 */
export function getDataAlignmentInfo(
  datasets: Dataset[],
  xVariable: VariableSelection,
  yVariable: VariableSelection
): {
  sameDataset: boolean;
  commonColumns: string[];
  xDataPoints: number;
  yDataPoints: number;
  alignedDataPoints: number;
} {
  const xDataset = datasets.find(d => d.id === xVariable.datasetId);
  const yDataset = datasets.find(d => d.id === yVariable.datasetId);

  if (!xDataset || !yDataset) {
    return {
      sameDataset: false,
      commonColumns: [],
      xDataPoints: 0,
      yDataPoints: 0,
      alignedDataPoints: 0
    };
  }

  const sameDataset = xVariable.datasetId === yVariable.datasetId;
  const commonColumns = sameDataset ? [] : xDataset.headers.filter(col => 
    yDataset.headers.includes(col)
  );

  const xData = extractNumericColumn(xDataset.data, xVariable.column);
  const yData = extractNumericColumn(yDataset.data, yVariable.column);

  let alignedDataPoints = 0;
  if (sameDataset) {
    alignedDataPoints = Math.min(xData.length, yData.length);
  } else {
    // For different datasets, estimate alignment based on first common column
    if (commonColumns.length > 0) {
      const keyColumn = commonColumns[0];
      const xKeys = new Set(xDataset.data.map(row => row[keyColumn]?.toString()).filter(Boolean));
      const yKeys = new Set(yDataset.data.map(row => row[keyColumn]?.toString()).filter(Boolean));
      alignedDataPoints = [...xKeys].filter(key => yKeys.has(key)).length;
    } else {
      alignedDataPoints = Math.min(xData.length, yData.length);
    }
  }

  return {
    sameDataset,
    commonColumns,
    xDataPoints: xData.length,
    yDataPoints: yData.length,
    alignedDataPoints
  };
}

/**
 * Validate that selected variables are compatible for regression
 */
export function validateVariableSelection(
  datasets: Dataset[],
  xVariable: VariableSelection,
  yVariable: VariableSelection
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if variables are selected
  if (!xVariable.datasetId || !xVariable.column) {
    errors.push("X variable not selected");
  }
  if (!yVariable.datasetId || !yVariable.column) {
    errors.push("Y variable not selected");
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Check if datasets exist
  const xDataset = datasets.find(d => d.id === xVariable.datasetId);
  const yDataset = datasets.find(d => d.id === yVariable.datasetId);

  if (!xDataset) {
    errors.push("X variable dataset not found");
  }
  if (!yDataset) {
    errors.push("Y variable dataset not found");
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Check if columns exist and are numeric
  if (!xDataset!.numericColumns.includes(xVariable.column)) {
    errors.push(`Column '${xVariable.column}' is not numeric in dataset '${xDataset!.name}'`);
  }
  if (!yDataset!.numericColumns.includes(yVariable.column)) {
    errors.push(`Column '${yVariable.column}' is not numeric in dataset '${yDataset!.name}'`);
  }

  // Check for same variable selection
  if (xVariable.datasetId === yVariable.datasetId && xVariable.column === yVariable.column) {
    errors.push("X and Y variables cannot be the same");
  }

  // Add warnings for cross-dataset analysis
  if (xVariable.datasetId !== yVariable.datasetId) {
    const alignmentInfo = getDataAlignmentInfo(datasets, xVariable, yVariable);
    if (alignmentInfo.commonColumns.length === 0) {
      warnings.push("No common key columns found between datasets. Data will be aligned by row index.");
    }
    if (alignmentInfo.alignedDataPoints < Math.min(alignmentInfo.xDataPoints, alignmentInfo.yDataPoints) * 0.5) {
      warnings.push("Low data alignment between datasets. Results may be unreliable.");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
