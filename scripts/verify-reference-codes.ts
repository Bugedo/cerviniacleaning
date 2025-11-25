import { getSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function verifyReferenceCodes() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('📊 Verificando códigos referenciales en las propiedades...\n');

    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:AA');

    const propertiesWithCodes: Array<{ id: string; location: string; code: string; client: string }> = [];
    const propertiesWithoutCodes: Array<{ id: string; location: string; client: string }> = [];

    propertiesData.slice(1).forEach((row) => {
      const id = row[0]?.toString() || '';
      const location = row[4]?.toString() || '';
      const client = row[2]?.toString() || '';
      const code = row[24]?.toString() || ''; // Columna 24 es Codice Riferimento

      if (code && code.trim()) {
        propertiesWithCodes.push({ id, location, code, client });
      } else {
        propertiesWithoutCodes.push({ id, location, client });
      }
    });

    console.log(`✅ Propiedades con código referencial: ${propertiesWithCodes.length}\n`);
    propertiesWithCodes.forEach((prop) => {
      console.log(`   ID ${prop.id}: ${prop.location} (${prop.client}) → ${prop.code}`);
    });

    console.log(`\n⚠️  Propiedades sin código: ${propertiesWithoutCodes.length}\n`);
    if (propertiesWithoutCodes.length > 0 && propertiesWithoutCodes.length <= 10) {
      propertiesWithoutCodes.forEach((prop) => {
        console.log(`   ID ${prop.id}: ${prop.location} (${prop.client})`);
      });
    } else if (propertiesWithoutCodes.length > 10) {
      propertiesWithoutCodes.slice(0, 10).forEach((prop) => {
        console.log(`   ID ${prop.id}: ${prop.location} (${prop.client})`);
      });
      console.log(`   ... y ${propertiesWithoutCodes.length - 10} más`);
    }

    console.log('\n✅ Verificación completada!');
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

verifyReferenceCodes();

