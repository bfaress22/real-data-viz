import regression from 'regression';

export interface DataPoint {
  x: number;
  y: number;
}

export interface RegressionResult {
  equation: number[];
  string: string;
  r2: number;
  points: DataPoint[];
}

export type RegressionType = 'linear' | 'polynomial' | 'exponential';

export function performRegression(
  data: DataPoint[], 
  type: RegressionType,
  order = 2
): RegressionResult | null {
  if (data.length < 2) return null;

  try {
    // Prepare data for regression library (expects [x, y] pairs)
    const regressionData: [number, number][] = data.map(point => [point.x, point.y]);
    
    let result;
    
    switch (type) {
      case 'linear':
        result = regression.linear(regressionData);
        break;
      case 'polynomial':
        result = regression.polynomial(regressionData, { order });
        break;
      case 'exponential':
        // Filter out non-positive y values for exponential regression
        const positiveData = regressionData.filter(([x, y]) => y > 0);
        if (positiveData.length < 2) {
          console.warn('Exponential regression requires positive Y values');
          return null;
        }
        result = regression.exponential(positiveData);
        break;
      default:
        throw new Error(`Unsupported regression type: ${type}`);
    }

    console.log(`${type} regression result:`, result);

    return {
      equation: result.equation,
      string: result.string,
      r2: result.r2,
      points: result.points.map(([x, y]) => ({ x, y }))
    };
  } catch (error) {
    console.error(`Error performing ${type} regression:`, error);
    return null;
  }
}

export function calculateStatistics(data: DataPoint[]) {
  if (data.length === 0) return null;

  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);

  const xMean = xValues.reduce((sum, val) => sum + val, 0) / xValues.length;
  const yMean = yValues.reduce((sum, val) => sum + val, 0) / yValues.length;

  const xStd = Math.sqrt(
    xValues.reduce((sum, val) => sum + Math.pow(val - xMean, 2), 0) / (xValues.length - 1)
  );
  const yStd = Math.sqrt(
    yValues.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0) / (yValues.length - 1)
  );

  return {
    count: data.length,
    xStats: {
      mean: xMean,
      std: xStd,
      min: Math.min(...xValues),
      max: Math.max(...xValues)
    },
    yStats: {
      mean: yMean,
      std: yStd,
      min: Math.min(...yValues),
      max: Math.max(...yValues)
    }
  };
}