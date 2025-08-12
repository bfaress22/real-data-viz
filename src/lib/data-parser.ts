import Papa from 'papaparse';

export interface ParsedData {
  data: Record<string, any>[];
  headers: string[];
  errors: string[];
}

export async function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // Auto-convert numbers
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        console.log('CSV parsing complete:', results);
        resolve({
          data: results.data,
          headers: results.meta.fields || [],
          errors: results.errors.map(err => err.message)
        });
      },
      error: (error) => {
        resolve({
          data: [],
          headers: [],
          errors: [error.message]
        });
      }
    });
  });
}

export async function parseJSON(file: File): Promise<ParsedData> {
  try {
    const text = await file.text();
    const jsonData = JSON.parse(text);
    
    // Handle different JSON structures
    let data: Record<string, any>[] = [];
    
    if (Array.isArray(jsonData)) {
      data = jsonData;
    } else if (jsonData.data && Array.isArray(jsonData.data)) {
      data = jsonData.data;
    } else if (typeof jsonData === 'object') {
      // Convert object to array of objects
      data = [jsonData];
    }
    
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    
    return {
      data,
      headers,
      errors: []
    };
  } catch (error) {
    return {
      data: [],
      headers: [],
      errors: [`JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

export async function parseFile(file: File): Promise<ParsedData> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  switch (fileExtension) {
    case 'csv':
      return parseCSV(file);
    case 'json':
      return parseJSON(file);
    default:
      return {
        data: [],
        headers: [],
        errors: [`Unsupported file type: ${fileExtension}`]
      };
  }
}

export function validateNumericData(
  data: Record<string, any>[], 
  xColumn: string, 
  yColumn: string
): { x: number; y: number }[] {
  return data
    .filter(row => {
      const x = Number(row[xColumn]);
      const y = Number(row[yColumn]);
      return !isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y);
    })
    .map(row => ({
      x: Number(row[xColumn]),
      y: Number(row[yColumn])
    }));
}