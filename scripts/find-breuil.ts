import { getSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function findBreuil() {
  const configPath = path.join(process.cwd(), 'sheets-config.json');
  const configFile = readFileSync(configPath, 'utf8');
  const config = JSON.parse(configFile);

  const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:Z');

  console.log('Buscando propiedades con BREUIL, 5P o del cliente Il Cervino...\n');
  propertiesData.slice(1).forEach((row) => {
    const location = row[4]?.toString() || '';
    const client = row[2]?.toString() || '';
    if (location.toLowerCase().includes('breuil') || 
        location.toLowerCase().includes('5p') || 
        client.toLowerCase().includes('cervino')) {
      console.log('ID:', row[0], '| Location:', location, '| Cliente:', client);
    }
  });
}

findBreuil();

