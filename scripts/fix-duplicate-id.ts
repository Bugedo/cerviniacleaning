import { getGoogleSheetsClient, getSpreadsheetData, updateSpreadsheetData } from '../lib/googleSheets';
import { readFileSync } from 'fs';
import path from 'path';

async function fixDuplicateId() {
  try {
    const configPath = path.join(process.cwd(), 'sheets-config.json');
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile);

    console.log('🔧 Corrigiendo ID duplicado 22...\n');

    const clientsSheetId = config.sheets.clients;
    const propertiesData = await getSpreadsheetData(clientsSheetId, 'Proprietà!A:AA');

    // Encontrar todas las propiedades con ID 22
    const propertiesWithId22: Array<{ index: number; location: string; client: string }> = [];
    
    propertiesData.slice(1).forEach((row, index) => {
      const id = row[0]?.toString() || '';
      const location = row[4]?.toString() || '';
      const client = row[2]?.toString() || '';
      
      if (id === '22') {
        propertiesWithId22.push({ index: index + 1, location, client });
      }
    });

    console.log(`📊 Propiedades con ID 22: ${propertiesWithId22.length}\n`);
    propertiesWithId22.forEach((prop, idx) => {
      console.log(`   ${idx + 1}. Fila ${prop.index}: ${prop.location} (${prop.client})`);
    });

    if (propertiesWithId22.length <= 1) {
      console.log('\n✅ No hay duplicados, el problema puede estar en otro lugar.\n');
      return;
    }

    // Encontrar el próximo ID disponible
    const allIds = propertiesData.slice(1).map(row => parseInt(row[0]?.toString() || '0'));
    const maxId = Math.max(...allIds);
    const newId = (maxId + 1).toString();

    console.log(`\n🔄 Asignando nuevo ID ${newId} a la segunda propiedad con ID 22...\n`);

    // Actualizar la segunda propiedad (probablemente T335 que acabamos de crear)
    const updatedPropertiesData = [...propertiesData];
    const secondPropertyIndex = propertiesWithId22[1].index;
    
    // Verificar cuál es T335
    const isT335 = updatedPropertiesData[secondPropertyIndex][4]?.toString().includes('T335') ||
                   updatedPropertiesData[secondPropertyIndex][24]?.toString() === 'T335';
    
    if (isT335) {
      updatedPropertiesData[secondPropertyIndex][0] = newId;
      console.log(`✅ Propiedad T335 actualizada: ID ${newId}`);
    } else {
      // Si no es T335, actualizar la segunda que encontramos
      updatedPropertiesData[secondPropertyIndex][0] = newId;
      console.log(`✅ Propiedad "${updatedPropertiesData[secondPropertyIndex][4]}" actualizada: ID ${newId}`);
    }

    await updateSpreadsheetData(clientsSheetId, 'Proprietà!A1', updatedPropertiesData);
    
    console.log('\n✅ ID duplicado corregido!');
    console.log(`\n📊 Resumen:`);
    console.log(`   - Nuevo ID asignado: ${newId}`);
    console.log(`   - Propiedades con ID 22 ahora: 1\n`);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Error:', err.message || error);
    throw error;
  }
}

fixDuplicateId();

