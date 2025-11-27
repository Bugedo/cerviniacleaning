import { readFileSync } from 'fs';
import path from 'path';

interface SheetsConfig {
  sheets: {
    clients: string;
    calendar: string;
    resources: string;
    billing: string;
  };
}

export function getSheetsConfig(): SheetsConfig {
  // En Vercel, usar variable de entorno
  if (process.env.SHEETS_CONFIG) {
    return JSON.parse(process.env.SHEETS_CONFIG);
  }
  
  // En local, leer del archivo
  const configPath = path.join(process.cwd(), 'sheets-config.json');
  return JSON.parse(readFileSync(configPath, 'utf8'));
}

