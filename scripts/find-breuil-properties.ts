import { getSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function findBreuilProperties() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🔍 Buscando propiedades de Il Cervino relacionadas con Breuil...\n');

    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:AA');

    const breuilProperties: Array<{
      id: string;
      location: string;
      referenceCode: string;
      client: string;
      row: string[];
    }> = [];

    propertiesData.slice(1).forEach((row) => {
      const id = row[0]?.toString() || '';
      const location = row[4]?.toString() || '';
      const client = row[2]?.toString() || '';
      const referenceCode = row[24]?.toString() || '';
      
      if (client.toLowerCase().includes('cervino') && 
          (location.toLowerCase().includes('breuil') || referenceCode.toLowerCase().includes('q456') || referenceCode.toLowerCase().includes('t335'))) {
        breuilProperties.push({ id, location, referenceCode, client, row: row as string[] });
      }
    });

    console.log(`📊 Propiedades encontradas relacionadas con Breuil: ${breuilProperties.length}\n`);
    breuilProperties.forEach((prop) => {
      console.log(`   ID ${prop.id}: ${prop.location} | Código: ${prop.referenceCode || '(sin código)'}`);
    });

    return breuilProperties;
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

findBreuilProperties();

