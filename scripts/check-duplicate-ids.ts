import { getSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function checkDuplicateIds() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🔍 Verificando IDs duplicados en propiedades...\n');

    const propertiesData = await getSpreadsheetData(config.sheets.clients, 'Proprietà!A:AA');

    const idMap = new Map<string, number>();
    const duplicates: Array<{ id: string; location: string; client: string }> = [];

    propertiesData.slice(1).forEach((row) => {
      const id = row[0]?.toString() || '';
      const location = row[4]?.toString() || '';
      const client = row[2]?.toString() || '';
      
      if (id) {
        const count = idMap.get(id) || 0;
        idMap.set(id, count + 1);
        
        if (count > 0) {
          duplicates.push({ id, location, client });
        }
      }
    });

    if (duplicates.length > 0) {
      console.log(`❌ Se encontraron ${duplicates.length} IDs duplicados:\n`);
      duplicates.forEach((dup) => {
        console.log(`   ID ${dup.id}: ${dup.location} (${dup.client})`);
      });
    } else {
      console.log('✅ No se encontraron IDs duplicados\n');
    }

    // Mostrar todos los IDs para verificar
    console.log('\n📊 Todos los IDs de propiedades:');
    const allIds = Array.from(idMap.keys()).sort((a, b) => parseInt(a) - parseInt(b));
    allIds.forEach(id => {
      const count = idMap.get(id) || 0;
      if (count > 1) {
        console.log(`   ID ${id}: ${count} veces (DUPLICADO)`);
      }
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

checkDuplicateIds();

