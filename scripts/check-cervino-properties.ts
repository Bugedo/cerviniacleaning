import { getSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function checkCervinoProperties() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🔍 Verificando propiedades de Il Cervino...\n');

    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:AA');

    const cervinoProperties: Array<{
      id: string;
      location: string;
      referenceCode: string;
      typology: string;
      accessInfo: string;
    }> = [];

    propertiesData.slice(1).forEach((row) => {
      const id = row[0]?.toString() || '';
      const clientId = row[1]?.toString() || '';
      const location = row[4]?.toString() || '';
      const typology = row[5]?.toString() || '';
      const accessInfo = row[9]?.toString() || '';
      const referenceCode = row[24]?.toString() || '';
      
      if (clientId === '7') { // Il Cervino
        cervinoProperties.push({ id, location, referenceCode, typology, accessInfo });
      }
    });

    console.log(`📊 Propiedades de Il Cervino: ${cervinoProperties.length}\n`);
    cervinoProperties.forEach((prop) => {
      console.log(`   ID ${prop.id}: ${prop.location}`);
      console.log(`      Código: ${prop.referenceCode || 'sin código'}`);
      console.log(`      Tipologia: ${prop.typology}`);
      console.log(`      Accesso: ${prop.accessInfo}\n`);
    });

    return cervinoProperties;
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

checkCervinoProperties();

