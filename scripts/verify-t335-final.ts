import { getSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function verifyT335Final() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🔍 Verificación final de propiedades T335...\n');

    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:AA');

    const t335Properties: Array<{ rowIndex: number; id: string; location: string; referenceCode: string; clientId: string }> = [];
    
    propertiesData.slice(1).forEach((row, index) => {
      const id = row[0]?.toString() || '';
      const clientId = row[1]?.toString() || '';
      const location = row[4]?.toString() || '';
      const referenceCode = row[24]?.toString() || '';
      
      if (location.includes('T335') || referenceCode === 'T335') {
        t335Properties.push({ rowIndex: index + 2, id, location, referenceCode, clientId });
      }
    });

    console.log(`📊 Propiedades T335 encontradas: ${t335Properties.length}\n`);
    t335Properties.forEach((prop) => {
      console.log(`   Fila ${prop.rowIndex}: ID ${prop.id} | Cliente ${prop.clientId} | ${prop.location} | Código: ${prop.referenceCode}`);
    });

    if (t335Properties.length === 1) {
      console.log('\n✅ Perfecto! Solo hay una propiedad T335\n');
    } else if (t335Properties.length > 1) {
      console.log(`\n❌ Todavía hay ${t335Properties.length} propiedades T335. Necesito eliminar las duplicadas.\n`);
    } else {
      console.log('\n⚠️  No se encontraron propiedades T335\n');
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

verifyT335Final();

