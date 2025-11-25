import { getSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function findClient7Id22() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🔍 Buscando propiedades del cliente 7 (Il Cervino) con ID 22...\n');

    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:AA');

    const matches: Array<{ rowIndex: number; id: string; location: string; referenceCode: string }> = [];

    propertiesData.slice(1).forEach((row, index) => {
      const id = row[0]?.toString() || '';
      const clientId = row[1]?.toString() || '';
      const location = row[4]?.toString() || '';
      const referenceCode = row[24]?.toString() || '';
      
      if (clientId === '7' && id === '22') {
        matches.push({ rowIndex: index + 2, id, location, referenceCode });
      }
    });

    console.log(`📊 Propiedades encontradas: ${matches.length}\n`);
    matches.forEach((match) => {
      console.log(`   Fila ${match.rowIndex}: ID ${match.id} - ${match.location} (Código: ${match.referenceCode || 'sin código'})`);
    });

    if (matches.length > 1) {
      console.log(`\n❌ Hay ${matches.length} propiedades duplicadas con cliente 7 e ID 22`);
      console.log('   Necesito eliminar las duplicadas.\n');
    } else if (matches.length === 1) {
      console.log('\n✅ Solo hay una propiedad con cliente 7 e ID 22\n');
    } else {
      console.log('\n⚠️  No se encontraron propiedades con cliente 7 e ID 22\n');
    }

    return matches;
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

findClient7Id22();

