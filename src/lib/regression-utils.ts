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
  type: RegressionType;
  metrics: RegressionMetrics;
  coefficients: number[];
  intercept?: number;
  slope?: number;
  predict: (x: number) => number; // Function to predict y for any x value
}

export interface RegressionMetrics {
  mae: number; // Mean Absolute Error
  mse: number; // Mean Squared Error
  rmse: number; // Root Mean Squared Error
  mape: number; // Mean Absolute Percentage Error
  adjustedR2: number; // Adjusted R-squared
  aic: number; // Akaike Information Criterion
  bic: number; // Bayesian Information Criterion
  standardError: number; // Standard Error of the Estimate
  fStatistic: number; // F-statistic for significance testing
  pValue: number; // P-value for F-test
}

export type RegressionType = 'linear' | 'polynomial' | 'exponential' | 'logarithmic' | 'power' | 'logistic';

// Linear Regression Implementation
function linearRegression(data: DataPoint[]): RegressionResult | null {
  if (data.length < 2) return null;

  const n = data.length;
  const sumX = data.reduce((sum, point) => sum + point.x, 0);
  const sumY = data.reduce((sum, point) => sum + point.y, 0);
  const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumX2 = data.reduce((sum, point) => sum + point.x * point.x, 0);
  const sumY2 = data.reduce((sum, point) => sum + point.y * point.y, 0);

  // Calculate coefficients using least squares
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate predictions
  const predictions = data.map(point => intercept + slope * point.x);
  
  // Calculate R-squared
  const meanY = sumY / n;
  const ssRes = data.reduce((sum, point, i) => sum + Math.pow(point.y - predictions[i], 2), 0);
  const ssTot = data.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0);
  const r2 = 1 - (ssRes / ssTot);

  // Calculate metrics
  const metrics = calculateMetrics(data, predictions, 2);

  return {
    equation: [intercept, slope],
    string: `y = ${intercept.toFixed(4)} + ${slope.toFixed(4)}x`,
    r2,
    points: data.map((point, i) => ({ x: point.x, y: predictions[i] })),
    type: 'linear',
    metrics,
    coefficients: [intercept, slope],
    intercept,
    slope,
    predict: (x: number) => intercept + slope * x
  };
}

// Polynomial Regression Implementation
function polynomialRegression(data: DataPoint[], degree: number = 2): RegressionResult | null {
  if (data.length < degree + 1) return null;

  // Create design matrix
  const n = data.length;
  const X: number[][] = [];
  const y: number[] = [];

  for (let i = 0; i < n; i++) {
    const row: number[] = [1]; // intercept term
    for (let j = 1; j <= degree; j++) {
      row.push(Math.pow(data[i].x, j));
    }
    X.push(row);
    y.push(data[i].y);
  }

  // Solve using normal equations: (X^T * X)^(-1) * X^T * y
  const coefficients = solveNormalEquations(X, y);
  
  if (!coefficients) return null;

  // Calculate predictions
  const predictions = data.map(point => {
    let pred = coefficients[0]; // intercept
    for (let j = 1; j <= degree; j++) {
      pred += coefficients[j] * Math.pow(point.x, j);
    }
    return pred;
  });

  // Calculate R-squared
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;
  const ssRes = data.reduce((sum, point, i) => sum + Math.pow(point.y - predictions[i], 2), 0);
  const ssTot = data.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0);
  const r2 = 1 - (ssRes / ssTot);

  // Calculate metrics
  const metrics = calculateMetrics(data, predictions, degree + 1);

  return {
    equation: coefficients,
    string: `y = ${coefficients.map((coef, i) => 
      i === 0 ? coef.toFixed(4) : 
      i === 1 ? `${coef >= 0 ? '+' : ''}${coef.toFixed(4)}x` :
      `${coef >= 0 ? '+' : ''}${coef.toFixed(4)}x^${i}`
    ).join('')}`,
    r2,
    points: data.map((point, i) => ({ x: point.x, y: predictions[i] })),
    type: 'polynomial',
    metrics,
    coefficients,
    predict: (x: number) => {
      let pred = coefficients[0]; // intercept
      for (let j = 1; j <= degree; j++) {
        pred += coefficients[j] * Math.pow(x, j);
      }
      return pred;
    }
  };
}

// Exponential Regression Implementation
function exponentialRegression(data: DataPoint[]): RegressionResult | null {
  if (data.length < 2) return null;

  // Filter out non-positive y values
  const validData = data.filter(point => point.y > 0);
  if (validData.length < 2) return null;

  // Transform to linear: ln(y) = ln(a) + bx
  const transformedData = validData.map(point => ({
    x: point.x,
    y: Math.log(point.y)
  }));

  const linearResult = linearRegression(transformedData);
  if (!linearResult) return null;

  // Transform back: y = a * e^(bx)
  const a = Math.exp(linearResult.intercept!);
  const b = linearResult.slope!;

  // Calculate predictions
  const predictions = validData.map(point => a * Math.exp(b * point.x));

  // Calculate R-squared for original scale
  const meanY = validData.reduce((sum, point) => sum + point.y, 0) / validData.length;
  const ssRes = validData.reduce((sum, point, i) => sum + Math.pow(point.y - predictions[i], 2), 0);
  const ssTot = validData.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0);
  const r2 = 1 - (ssRes / ssTot);

  // Calculate metrics
  const metrics = calculateMetrics(validData, predictions, 2);

  return {
    equation: [a, b],
    string: `y = ${a.toFixed(4)} * e^(${b.toFixed(4)}x)`,
    r2,
    points: validData.map((point, i) => ({ x: point.x, y: predictions[i] })),
    type: 'exponential',
    metrics,
    coefficients: [a, b],
    predict: (x: number) => a * Math.exp(b * x)
  };
}

// Logarithmic Regression Implementation
function logarithmicRegression(data: DataPoint[]): RegressionResult | null {
  if (data.length < 2) return null;

  // Filter out non-positive x values
  const validData = data.filter(point => point.x > 0);
  if (validData.length < 2) return null;

  // Transform to linear: y = a + b * ln(x)
  const transformedData = validData.map(point => ({
    x: Math.log(point.x),
    y: point.y
  }));

  const linearResult = linearRegression(transformedData);
  if (!linearResult) return null;

  const a = linearResult.intercept!;
  const b = linearResult.slope!;

  // Calculate predictions
  const predictions = validData.map(point => a + b * Math.log(point.x));

  // Calculate R-squared
  const meanY = validData.reduce((sum, point) => sum + point.y, 0) / validData.length;
  const ssRes = validData.reduce((sum, point, i) => sum + Math.pow(point.y - predictions[i], 2), 0);
  const ssTot = validData.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0);
  const r2 = 1 - (ssRes / ssTot);

  // Calculate metrics
  const metrics = calculateMetrics(validData, predictions, 2);

  return {
    equation: [a, b],
    string: `y = ${a.toFixed(4)} + ${b.toFixed(4)} * ln(x)`,
    r2,
    points: validData.map((point, i) => ({ x: point.x, y: predictions[i] })),
    type: 'logarithmic',
    metrics,
    coefficients: [a, b],
    predict: (x: number) => a + b * Math.log(x)
  };
}

// Power Regression Implementation
function powerRegression(data: DataPoint[]): RegressionResult | null {
  if (data.length < 2) return null;

  // Filter out non-positive values
  const validData = data.filter(point => point.x > 0 && point.y > 0);
  if (validData.length < 2) return null;

  // Transform to linear: ln(y) = ln(a) + b * ln(x)
  const transformedData = validData.map(point => ({
    x: Math.log(point.x),
    y: Math.log(point.y)
  }));

  const linearResult = linearRegression(transformedData);
  if (!linearResult) return null;

  // Transform back: y = a * x^b
  const a = Math.exp(linearResult.intercept!);
  const b = linearResult.slope!;

  // Calculate predictions
  const predictions = validData.map(point => a * Math.pow(point.x, b));

  // Calculate R-squared for original scale
  const meanY = validData.reduce((sum, point) => sum + point.y, 0) / validData.length;
  const ssRes = validData.reduce((sum, point, i) => sum + Math.pow(point.y - predictions[i], 2), 0);
  const ssTot = validData.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0);
  const r2 = 1 - (ssRes / ssTot);

  // Calculate metrics
  const metrics = calculateMetrics(validData, predictions, 2);

  return {
    equation: [a, b],
    string: `y = ${a.toFixed(4)} * x^${b.toFixed(4)}`,
    r2,
    points: validData.map((point, i) => ({ x: point.x, y: predictions[i] })),
    type: 'power',
    metrics,
    coefficients: [a, b],
    predict: (x: number) => a * Math.pow(x, b)
  };
}

// Logistic Regression Implementation
function logisticRegression(data: DataPoint[]): RegressionResult | null {
  if (data.length < 2) return null;

  // Filter values between 0 and 1
  const validData = data.filter(point => point.y >= 0 && point.y <= 1);
  if (validData.length < 2) return null;

  // Use iterative approach for logistic regression
  // Initialize parameters
  let beta0 = 0;
  let beta1 = 0;
  const learningRate = 0.01;
  const maxIterations = 1000;
  const tolerance = 1e-6;

  // Gradient descent optimization
  for (let iter = 0; iter < maxIterations; iter++) {
    let grad0 = 0;
    let grad1 = 0;

    for (const point of validData) {
      const z = beta0 + beta1 * point.x;
      const p = 1 / (1 + Math.exp(-z));
      const error = p - point.y;
      
      grad0 += error;
      grad1 += error * point.x;
    }

    const newBeta0 = beta0 - learningRate * grad0 / validData.length;
    const newBeta1 = beta1 - learningRate * grad1 / validData.length;

    if (Math.abs(newBeta0 - beta0) < tolerance && Math.abs(newBeta1 - beta1) < tolerance) {
      break;
    }

    beta0 = newBeta0;
    beta1 = newBeta1;
  }

  // Calculate predictions
  const predictions = validData.map(point => {
    const z = beta0 + beta1 * point.x;
    return 1 / (1 + Math.exp(-z));
  });

  // Calculate R-squared (pseudo R-squared for logistic regression)
  const meanY = validData.reduce((sum, point) => sum + point.y, 0) / validData.length;
  const ssRes = validData.reduce((sum, point, i) => sum + Math.pow(point.y - predictions[i], 2), 0);
  const ssTot = validData.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0);
  const r2 = 1 - (ssRes / ssTot);

  // Calculate metrics
  const metrics = calculateMetrics(validData, predictions, 2);

  return {
    equation: [beta0, beta1],
    string: `y = 1 / (1 + e^(-(${beta0.toFixed(4)} + ${beta1.toFixed(4)}x)))`,
    r2,
    points: validData.map((point, i) => ({ x: point.x, y: predictions[i] })),
    type: 'logistic',
    metrics,
    coefficients: [beta0, beta1],
    predict: (x: number) => {
      const z = beta0 + beta1 * x;
      return 1 / (1 + Math.exp(-z));
    }
  };
}

// Helper function to solve normal equations
function solveNormalEquations(X: number[][], y: number[]): number[] | null {
  const n = X.length;
  const p = X[0].length;

  // Create X^T * X matrix
  const XtX: number[][] = [];
  for (let i = 0; i < p; i++) {
    XtX[i] = [];
    for (let j = 0; j < p; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += X[k][i] * X[k][j];
      }
      XtX[i][j] = sum;
    }
  }

  // Create X^T * y vector
  const Xty: number[] = [];
  for (let i = 0; i < p; i++) {
    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += X[k][i] * y[k];
    }
    Xty[i] = sum;
  }

  // Solve using Gaussian elimination
  return gaussianElimination(XtX, Xty);
}

// Gaussian elimination solver
function gaussianElimination(A: number[][], b: number[]): number[] | null {
  const n = A.length;
  const augmented = A.map((row, i) => [...row, b[i]]);

  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }

    // Swap rows
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    // Check for singular matrix
    if (Math.abs(augmented[i][i]) < 1e-10) {
      return null;
    }

    // Eliminate column
    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / augmented[i][i];
      for (let j = i; j <= n; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += augmented[i][j] * x[j];
    }
    x[i] = (augmented[i][n] - sum) / augmented[i][i];
  }

  return x;
}

// Calculate comprehensive metrics
function calculateMetrics(data: DataPoint[], predictions: number[], numParams: number): RegressionMetrics {
  const n = data.length;
  
  // Calculate errors
  const errors = data.map((point, i) => point.y - predictions[i]);
  const absoluteErrors = errors.map(error => Math.abs(error));
  const squaredErrors = errors.map(error => error * error);
  const percentageErrors = data.map((point, i) => 
    Math.abs((errors[i] / point.y) * 100)
  );

  // Basic metrics
  const mae = absoluteErrors.reduce((sum, error) => sum + error, 0) / n;
  const mse = squaredErrors.reduce((sum, error) => sum + error, 0) / n;
  const rmse = Math.sqrt(mse);
  const mape = percentageErrors.reduce((sum, error) => sum + error, 0) / n;

  // Calculate R-squared and adjusted R-squared
  const meanY = data.reduce((sum, point) => sum + point.y, 0) / n;
  const ssRes = squaredErrors.reduce((sum, error) => sum + error, 0);
  const ssTot = data.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0);
  const r2 = 1 - (ssRes / ssTot);
  const adjustedR2 = 1 - ((1 - r2) * (n - 1)) / (n - numParams - 1);

  // Standard Error of the Estimate
  const standardError = Math.sqrt(ssRes / (n - numParams));

  // F-statistic and p-value
  const ssReg = ssTot - ssRes;
  const fStatistic = (ssReg / (numParams - 1)) / (ssRes / (n - numParams));
  const pValue = 1 - fDistributionCDF(fStatistic, numParams - 1, n - numParams);

  // AIC and BIC
  const logLikelihood = -0.5 * n * Math.log(2 * Math.PI * mse) - 0.5 * n;
  const aic = 2 * numParams - 2 * logLikelihood;
  const bic = Math.log(n) * numParams - 2 * logLikelihood;

  return {
    mae,
    mse,
    rmse,
    mape,
    adjustedR2,
    aic,
    bic,
    standardError,
    fStatistic,
    pValue
  };
}

// Approximate F-distribution CDF (simplified)
function fDistributionCDF(f: number, df1: number, df2: number): number {
  // This is a simplified approximation
  // For more accuracy, you might want to use a proper statistical library
  if (f <= 0) return 0;
  if (df1 === 1 && df2 > 0) {
    // For df1=1, F-distribution is related to t-distribution
    const t = Math.sqrt(f);
    return 2 * (1 - normalCDF(t));
  }
  // Simplified approximation for other cases
  return 1 - Math.exp(-f / 2);
}

// Normal CDF approximation
function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

// Error function approximation
function erf(x: number): number {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

export function performRegression(
  data: DataPoint[], 
  type: RegressionType,
  order = 2
): RegressionResult | null {
  if (data.length < 2) return null;

  try {
    let result: RegressionResult | null = null;
    
    switch (type) {
      case 'linear':
        result = linearRegression(data);
        break;
      case 'polynomial':
        result = polynomialRegression(data, order);
        break;
      case 'exponential':
        result = exponentialRegression(data);
        break;
      case 'logarithmic':
        result = logarithmicRegression(data);
        break;
      case 'power':
        result = powerRegression(data);
        break;
      case 'logistic':
        result = logisticRegression(data);
        break;
      default:
        throw new Error(`Unsupported regression type: ${type}`);
    }

    console.log(`${type} regression result:`, result);
    return result;
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

  // Calculate correlation coefficient
  const covariance = xValues.reduce((sum, x, i) => sum + (x - xMean) * (yValues[i] - yMean), 0) / (xValues.length - 1);
  const correlation = covariance / (xStd * yStd);

  return {
    count: data.length,
    xStats: {
      mean: xMean,
      std: xStd,
      min: Math.min(...xValues),
      max: Math.max(...xValues),
      median: calculateMedian(xValues),
      q1: calculatePercentile(xValues, 25),
      q3: calculatePercentile(xValues, 75)
    },
    yStats: {
      mean: yMean,
      std: yStd,
      min: Math.min(...yValues),
      max: Math.max(...yValues),
      median: calculateMedian(yValues),
      q1: calculatePercentile(yValues, 25),
      q3: calculatePercentile(yValues, 75)
    },
    correlation
  };
}

function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
}

function calculatePercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (upper >= sorted.length) return sorted[sorted.length - 1];
  if (lower === upper) return sorted[lower];
  
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

// Function to get all available regression types for a dataset
export function getAvailableRegressionTypes(data: DataPoint[]): RegressionType[] {
  const types: RegressionType[] = ['linear', 'polynomial'];
  
  // Check if exponential regression is possible
  const hasPositiveY = data.some(point => point.y > 0);
  if (hasPositiveY) types.push('exponential');
  
  // Check if logarithmic regression is possible
  const hasPositiveX = data.some(point => point.x > 0);
  if (hasPositiveX) types.push('logarithmic');
  
  // Check if power regression is possible
  const hasPositiveBoth = data.some(point => point.x > 0 && point.y > 0);
  if (hasPositiveBoth) types.push('power');
  
  // Check if logistic regression is possible
  const hasValidLogistic = data.some(point => point.y >= 0 && point.y <= 1);
  if (hasValidLogistic) types.push('logistic');
  
  return types;
}